import { Nav, Footer } from '@/components/Chrome';
import QuoteChooser from '@/components/QuoteChooser';

export const metadata = {
  title: 'Start a quote',
  description: 'Tell us what you need covered and a licensed REVOL Insurance producer follows up the same day.',
};

export default function QuotePage() {
  return (
    <>
      <Nav />
      <main id="main">
        <section style={{ background: 'var(--ground)', borderBottom: '1px solid var(--line)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
            <h1 style={{ fontSize: 'clamp(30px, 3.6vw, 42px)', fontWeight: 800, marginBottom: 12 }}>Start a quote</h1>
            <p style={{ margin: 0, fontSize: 'clamp(16px, 1.4vw, 18px)', color: 'var(--muted)', maxWidth: '56ch' }}>
              Two ways to do this: a quick estimate, or send us your current policy and get a real line-by-line comparison. A licensed producer follows up the same business day either way.
            </p>
          </div>
        </section>
        <section>
          <div className="shell" style={{ paddingTop: 'clamp(36px, 4.5vw, 56px)', paddingBottom: 'clamp(48px, 6vw, 80px)', maxWidth: 760 }}>
            <QuoteChooser source="quote-page" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
