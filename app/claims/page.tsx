import { Nav, Footer } from '@/components/Chrome';

export const metadata = {
  title: 'Report a claim',
  description: 'How to report a claim to your carrier, and how to let your REVOL Insurance producer know.',
};

export default function ClaimsPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <section style={{ background: 'var(--ground)', borderBottom: '1px solid var(--line)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
            <h1 style={{ fontSize: 'clamp(30px, 3.6vw, 42px)', fontWeight: 800, marginBottom: 12 }}>Report a claim to your carrier</h1>
            <p style={{ margin: 0, fontSize: 'clamp(16px, 1.4vw, 18px)', color: 'var(--muted)', maxWidth: '60ch' }}>
              Claims are filed with your carrier directly, not with us. Reporting it to your carrier first is what
              starts the clock — then tell your producer so we can follow it with you.
            </p>
          </div>
        </section>
        <section>
          <div className="shell" style={{ paddingTop: 'clamp(36px, 4.5vw, 56px)', paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
            <div style={{ border: '1px dashed var(--line-2)', borderRadius: 16, padding: 32, color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, maxWidth: '70ch' }}>
              Carrier claim numbers and direct links go here, one row per carrier, once the appointment list is
              confirmed. This page must never read as though submitting a form to REVOL files the claim — most
              carriers require first notice of loss through their own channel, and a client who believes they
              filed with us when they did not is an E&amp;O problem.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
