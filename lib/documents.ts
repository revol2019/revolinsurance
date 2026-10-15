/**
 * Phase 2 document handling — the server side of the dec page upload.
 *
 * NOT WIRED YET. `app/api/formal-quote/route.ts` still emails the attachment
 * and keeps no copy. When the migration in supabase/migrations/0002 has run,
 * swap the email-attachment block in that route for `intakeDecPage()` below
 * and the form itself does not change at all.
 *
 * Two rules this file exists to enforce:
 *
 *   1. Writes from the public form run with the service role, because the
 *      submitter is anonymous and must never hold a token that can read
 *      anything back. Reads run as the signed-in producer so RLS decides.
 *   2. A file is only ever handed out as a short-lived signed URL. There is no
 *      code path here that produces a public link.
 */

import 'server-only';

const BUCKET = 'client-documents';
const SIGNED_URL_TTL_SECONDS = 300;

type IntakeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  currentCarrier?: string;
  renewalDate?: string | null;
  assignedTo: string | null;
  source: string;
  consentText: string;
  file?: { bytes: Buffer; name: string; mimeType: string } | null;
};

function serviceHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function baseUrl() {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not set.');
  return url.replace(/\/+$/, '');
}

/**
 * Create or match the contact, store the file, record the document row.
 * Returns the contact id so the notification can deep-link to it.
 */
export async function intakeDecPage(input: IntakeInput): Promise<{ contactId: string; documentId: string | null }> {
  const headers = { ...serviceHeaders(), 'Content-Type': 'application/json' };

  // Match on email so a repeat submission does not create a duplicate person.
  const found = await fetch(
    `${baseUrl()}/rest/v1/contacts?email=eq.${encodeURIComponent(input.email)}&select=id,type&limit=1`,
    { headers },
  ).then((r) => r.json());

  let contactId: string | undefined = Array.isArray(found) && found[0]?.id;

  if (!contactId) {
    const created = await fetch(`${baseUrl()}/rest/v1/contacts`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({
        // A quote request is a lead. It becomes a client when a policy binds.
        type: 'lead',
        line: 'insurance',
        assigned_to: input.assignedTo,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        street: input.street ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        postal_code: input.postalCode ?? null,
        current_carrier: input.currentCarrier ?? null,
        renewal_date: input.renewalDate || null,
        consent_text: input.consentText,
        consent_at: new Date().toISOString(),
        source: input.source,
      }),
    }).then((r) => r.json());
    contactId = created?.[0]?.id;
  }

  if (!contactId) throw new Error('Could not create or match the contact.');
  if (!input.file) return { contactId, documentId: null };

  const documentId = crypto.randomUUID();
  const ext = input.file.name.includes('.') ? `.${input.file.name.split('.').pop()}` : '';
  // Path shape must stay contacts/<contact_id>/<document_id> — the storage
  // policies read the contact id out of segment 2.
  const storagePath = `contacts/${contactId}/${documentId}${ext}`;

  const up = await fetch(`${baseUrl()}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: { ...serviceHeaders(), 'Content-Type': input.file.mimeType },
    body: new Uint8Array(input.file.bytes),
  });
  if (!up.ok) throw new Error(`Upload failed: ${up.status}`);

  await fetch(`${baseUrl()}/rest/v1/documents`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: documentId,
      contact_id: contactId,
      kind: 'declarations_page',
      source: 'web_form',
      storage_path: storagePath,
      original_name: input.file.name,
      mime_type: input.file.mimeType,
      size_bytes: input.file.bytes.length,
    }),
  });

  return { contactId, documentId };
}

/**
 * Mint a short-lived link for a producer to open the file.
 *
 * `accessToken` is the signed-in producer's JWT, not the service role — the
 * storage policy is what decides whether they get a URL back. Passing the
 * service key here would hand any producer the whole bucket.
 */
export async function signedDocumentUrl(
  storagePath: string,
  accessToken: string,
): Promise<string | null> {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');

  const res = await fetch(`${baseUrl()}/storage/v1/object/sign/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json?.signedURL ? `${baseUrl()}/storage/v1${json.signedURL}` : null;
}

/** Write the access trail. Call on every view and every download. */
export async function logDocumentAccess(opts: {
  documentId: string;
  actorId: string;
  action: 'view' | 'download' | 'share' | 'delete';
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await fetch(`${baseUrl()}/rest/v1/document_access_log`, {
    method: 'POST',
    headers: { ...serviceHeaders(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      document_id: opts.documentId,
      actor_id: opts.actorId,
      action: opts.action,
      ip: opts.ip ?? null,
      user_agent: opts.userAgent ?? null,
    }),
  }).catch(() => {
    // Never fail the user's request because logging failed, but do make the
    // gap visible.
    console.error('[documents] access log write failed', opts);
  });
}
