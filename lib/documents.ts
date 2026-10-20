/**
 * Lead intake into REVOL Team: contacts, client documents, notifications.
 *
 * Written against the live schema (migrations 0002 and 0003). Both website
 * forms call intakeContact(); the formal quote passes the dec page as `file`.
 *
 * Rules this file enforces:
 *
 *   1. Writes run with the service role. The submitter is anonymous and must
 *      never hold a token that can read anything back.
 *   2. Files go to the PRIVATE `client-documents` bucket at
 *      <contact_id>/<document_id>[.ext]. The storage policies read the contact
 *      id from that first folder segment, so the path shape is load-bearing.
 *   3. No function here produces a public link. Producers open files from
 *      REVOL Team through signed URLs minted as themselves, so RLS decides.
 */

import 'server-only';
import { serviceHeaders, supabaseUrl } from './supabase-server';

const BUCKET = 'client-documents';

export type IntakeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  currentCarrier?: string;
  renewalDate?: string | null;
  /** REVOL Team profile id of the producer, or null for the unassigned queue. */
  assignedTo: string | null;
  source: string;
  consentText: string;
  notes?: string;
  file?: { bytes: Buffer; name: string; mimeType: string } | null;
};

export type IntakeResult = {
  contactId: string;
  documentId: string | null;
  isNewContact: boolean;
};

/** Accepts "2026-11-01", "11/1/2026", "11/01/26"; anything else becomes null rather than failing the lead. */
function toIsoDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (!m) return null;
  const yyyy = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${yyyy}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: serviceHeaders({ 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) }),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Supabase ${init.method ?? 'GET'} ${path.split('?')[0]} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

type ExistingContact = {
  id: string;
  assigned_to: string | null;
  producer_id?: string | null;
  insurance_since?: string | null;
  company?: string;
};

/**
 * Finds the person by exact lowercased email (eq, not ilike: underscores in an
 * email are wildcards to ilike). REVOL Team database update 37 adds the
 * producer beside the agent; before it is run those columns do not exist, so
 * this falls back to the old lookup rather than losing the lead.
 */
async function findExisting(email: string): Promise<{ row: ExistingContact | null; twoOwners: boolean }> {
  const match = `email=eq.${encodeURIComponent(email)}&order=created_at.asc&limit=1`;
  try {
    const rows = await rest<ExistingContact[]>(`contacts?select=id,assigned_to,producer_id,insurance_since,company&${match}`);
    return { row: rows[0] ?? null, twoOwners: true };
  } catch (err) {
    if (!/producer_id|insurance_since|42703/.test(String(err))) throw err;
    const rows = await rest<ExistingContact[]>(`contacts?select=id,assigned_to&${match}`);
    return { row: rows[0] ?? null, twoOwners: false };
  }
}

export async function intakeContact(input: IntakeInput): Promise<IntakeResult> {
  const email = input.email.trim().toLowerCase();

  // A returning person stays one record: an earlier quote request, or a past
  // REVOL buyer or seller whose real estate agent already has them.
  const { row: existing, twoOwners } = await findExisting(email);

  let contactId: string;
  let isNewContact = false;

  if (existing) {
    contactId = existing.id;

    const patch: Record<string, unknown> = {};
    if (input.currentCarrier) patch.current_carrier = input.currentCarrier;
    const renewal = toIsoDate(input.renewalDate);
    if (renewal) patch.renewal_date = renewal;
    // Latest consent wins — it is the one in force.
    patch.consent_text = input.consentText;
    patch.consent_at = new Date().toISOString();

    // Who to tell about a repeat request. Left null when the database does it.
    let notifyId: string | null = null;
    if (twoOwners) {
      const inPipeline = Boolean(existing.insurance_since);
      // A request from a producer's page puts that producer on the record when
      // it has none. On a past buyer their agent stays on it, beside them.
      if (!existing.producer_id && input.assignedTo) patch.producer_id = input.assignedTo;
      if (!inPipeline) {
        // Joining the insurance pipeline now. The database tells the producer
        // (or the queue) and the client's agent.
        patch.insurance_source = input.source;
      } else {
        notifyId = existing.producer_id ?? (existing.company === 'insurance' ? input.assignedTo : null);
      }
    } else {
      // Before update 37: a repeat request from a producer's page claims an unassigned record.
      if (!existing.assigned_to && input.assignedTo) patch.assigned_to = input.assignedTo;
      notifyId = existing.assigned_to ?? input.assignedTo;
    }

    await rest(`contacts?id=eq.${contactId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });

    // What they asked for this time, on the record's timeline (needs update 26).
    if (input.notes) {
      await rest('activities', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          contact_id: contactId,
          kind: 'note',
          body: `Quote request on revolinsurance.com (${input.source}):\n${input.notes}`,
        }),
      }).catch((err) => console.error('[intake] request note failed', err));
    }

    if (notifyId) {
      await rest('notifications', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: notifyId,
          kind: 'returning_lead',
          title: `Back again: ${input.firstName} ${input.lastName}`,
          body: input.file ? 'Sent a declarations page' : `New request via ${input.source}`,
          url: `/contacts/${contactId}`,
        }),
      }).catch((err) => console.error('[intake] returning-lead notification failed', err));
    }
  } else {
    const created = await rest<{ id: string }[]>('contacts', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        company: 'insurance',
        stage: input.file ? 'quoting' : 'lead',
        assigned_to: input.assignedTo,
        first_name: input.firstName,
        last_name: input.lastName,
        email,
        phone: input.phone,
        street: input.address || null,
        current_carrier: input.currentCarrier || null,
        renewal_date: toIsoDate(input.renewalDate),
        consent_text: input.consentText,
        consent_at: new Date().toISOString(),
        source: input.source,
        notes: input.notes || null,
      }),
    });
    contactId = created[0].id;
    isNewContact = true;
  }

  if (!input.file) return { contactId, documentId: null, isNewContact };

  // Store the file.
  const documentId = crypto.randomUUID();
  const rawExt = input.file.name.includes('.') ? input.file.name.split('.').pop() ?? '' : '';
  const ext = /^[a-z0-9]{1,5}$/i.test(rawExt) ? `.${rawExt.toLowerCase()}` : '';
  const storagePath = `${contactId}/${documentId}${ext}`;

  const up = await fetch(`${supabaseUrl()}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: serviceHeaders({ 'Content-Type': input.file.mimeType, 'x-upsert': 'false' }),
    body: new Uint8Array(input.file.bytes),
    cache: 'no-store',
  });
  if (!up.ok) throw new Error(`Storage upload → ${up.status}: ${(await up.text()).slice(0, 300)}`);

  try {
    await rest('client_documents', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        id: documentId,
        contact_id: contactId,
        kind: 'declarations_page',
        storage_path: storagePath,
        original_name: input.file.name.slice(0, 200),
        mime_type: input.file.mimeType,
        size_bytes: input.file.bytes.length,
      }),
    });
  } catch (err) {
    // Never leave an orphaned file with no row pointing at it.
    await fetch(`${supabaseUrl()}/storage/v1/object/${BUCKET}/${storagePath}`, {
      method: 'DELETE',
      headers: serviceHeaders(),
    }).catch(() => {});
    throw err;
  }

  return { contactId, documentId, isNewContact };
}
