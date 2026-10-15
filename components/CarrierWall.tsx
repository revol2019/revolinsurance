import Image from 'next/image';
import { approvedCarriers, type CarrierLine } from '@/lib/carriers';

export default function CarrierWall({
  line,
  only,
  note = true,
}: {
  line?: CarrierLine;
  only?: string[];
  note?: boolean;
}) {
  const carriers = approvedCarriers({ line, only });

  if (carriers.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed var(--line-2)',
          borderRadius: 12,
          padding: 28,
          textAlign: 'center',
          color: 'var(--muted-2)',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        No carrier marks are approved for display yet. Each carrier stays hidden until someone confirms the
        appointment or SIAA agreement permits showing its logo — set <code>displayApproved: true</code> in{' '}
        <code>lib/carriers.ts</code> as approvals come in.
      </div>
    );
  }

  return (
    <>
      <div className="carrier-wall">
        {carriers.map((c) => (
          <div key={c.slug} className="carrier-tile">
            <Image
              src={c.logo}
              alt={c.name}
              width={200}
              height={c.height}
              style={{ maxWidth: '100%', maxHeight: c.height, width: 'auto', height: 'auto', objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
      {note && (
        <p style={{ margin: '22px 0 0', fontSize: 13, color: 'var(--muted-2)' }}>
          Carrier marks are each carrier&apos;s property and display is governed by the appointment or SIAA
          agreement.
        </p>
      )}
    </>
  );
}
