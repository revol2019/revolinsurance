import { Nav, Footer } from '@/components/Chrome';

export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main id="main">
        <section style={{ background: 'var(--ground)', borderBottom: '1px solid var(--line)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
            <h1 style={{ fontSize: 'clamp(30px, 3.6vw, 42px)', fontWeight: 800, marginBottom: 12 }}>{title}</h1>
            <p style={{ margin: 0, fontSize: 'clamp(16px, 1.4vw, 18px)', color: 'var(--muted)', maxWidth: '60ch' }}>{intro}</p>
          </div>
        </section>
        <section>
          <div className="shell" style={{ paddingTop: 'clamp(36px, 4.5vw, 56px)', paddingBottom: 'clamp(48px, 6vw, 80px)', maxWidth: 820 }}>
            <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>{children}</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function ReviewNote() {
  return (
    <div
      style={{
        border: '1px dashed var(--line-2)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 28,
        fontSize: 14,
        lineHeight: 1.6,
        color: 'var(--muted-2)',
        background: 'var(--ground)',
      }}
    >
      <strong style={{ color: 'var(--ink-2)' }}>Needs counsel review.</strong> This page exists so the footer link
      resolves rather than 404s, and describes what the site actually does today. It has not been reviewed by an
      attorney and is not a substitute for one.
    </div>
  );
}
