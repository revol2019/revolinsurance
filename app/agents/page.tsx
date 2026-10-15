import Image from 'next/image';
import Link from 'next/link';
import { Nav, Footer } from '@/components/Chrome';
import { getActiveProducers, licenseLabel } from '@/lib/producers';

export const metadata = {
  title: 'Find a producer',
  description: 'Licensed REVOL Insurance producers across Maryland, DC, Virginia, Delaware and Pennsylvania.',
};

export default function AgentsPage() {
  const producers = getActiveProducers();

  return (
    <>
      <Nav />
      <main id="main">
        <section style={{ background: 'var(--ground)', borderBottom: '1px solid var(--line)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
            <h1 style={{ fontSize: 'clamp(30px, 3.6vw, 42px)', fontWeight: 800, marginBottom: 12 }}>Find your producer</h1>
            <p style={{ margin: 0, fontSize: 'clamp(16px, 1.4vw, 18px)', color: 'var(--muted)', maxWidth: '56ch' }}>
              Every producer has their own page, their own line, and their own book. You work with a person, not a
              queue.
            </p>
          </div>
        </section>

        <section>
          <div className="shell" style={{ paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
            {producers.length === 0 ? (
              <div style={{ border: '1px dashed var(--line-2)', borderRadius: 16, padding: 40, color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>
                No producers are published yet. Add entries to <code>lib/producers.ts</code> — each one gets a page at
                <code> /agents/&lt;slug&gt;</code>, appears here, and has its quote form routed to its own inbox.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {producers.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/agents/${p.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--line)', borderRadius: 16, padding: 24, display: 'flex', gap: 18, alignItems: 'center', minWidth: 0 }}
                  >
                    <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--blue-soft)', flex: 'none', overflow: 'hidden' }}>
                      {p.headshot && <Image src={p.headshot} alt="" width={168} height={168} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>{licenseLabel(p)}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted-2)', marginTop: 6 }}>Licensed in {p.statesLicensed.join(', ')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
