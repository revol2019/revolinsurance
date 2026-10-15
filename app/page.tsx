import Image from 'next/image';
import Link from 'next/link';
import { Nav, Footer } from '@/components/Chrome';
import QuoteForm from '@/components/QuoteForm';
import CarrierWall from '@/components/CarrierWall';
import { getActiveProducers, licenseLabel } from '@/lib/producers';

const LINES = [
  {
    id: 'personal',
    title: 'Personal',
    photo: '/photos/personal-home.jpg',
    blurb:
      'Homeowners, auto, renters, condo, landlord, umbrella and flood. The lines most people need bundled, shopped together.',
    bullets: ['Home and auto bundles', 'Umbrella and excess liability', 'Flood and high-value homes'],
    cta: 'Quote personal coverage',
  },
  {
    id: 'business',
    title: 'Business',
    photo: '/photos/business-office.jpg',
    blurb: 'Coverage for contractors, landlords, small offices and the trades we work alongside every day.',
    bullets: ['Business owners policies', 'General and professional liability', 'Commercial auto and workers’ comp'],
    cta: 'Quote business coverage',
  },
  {
    id: 'life',
    title: 'Life & health',
    photo: '/photos/life-couple.jpg',
    blurb: 'Protection that pays off the mortgage, covers the family and handles the Medicare transition.',
    bullets: ['Term and whole life', 'Mortgage protection', 'Medicare and final expense'],
    cta: 'Talk to a life producer',
  },
];

const STEPS = [
  ['01 — Under contract', 'Your REVOL agent flags the settlement date. Your producer starts shopping carriers that week.'],
  ['02 — Quotes back', 'One conversation, several carriers, side by side. You see what each one actually covers.'],
  ['03 — Bound before closing', 'The binder goes straight to your lender and to Raven Title. Nobody chases paperwork on settlement morning.'],
  ['04 — Reviewed every year', 'Renewal comes with a call, not a surprise. We reshop when the market moves against you.'],
];

export const revalidate = 300;

export default async function Home() {
  const producers = await getActiveProducers();

  return (
    <>
      <Nav />
      <main id="main">
        {/* Hero */}
        <section
          style={{
            backgroundImage:
              'linear-gradient(100deg, rgba(8,13,24,0.94) 0%, rgba(8,13,24,0.80) 46%, rgba(8,13,24,0.40) 100%), url(/photos/hero-rowhomes.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 62%',
          }}
        >
          <div
            className="shell"
            style={{
              paddingTop: 'clamp(48px, 7vw, 84px)',
              paddingBottom: 'clamp(52px, 7vw, 92px)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(32px, 5vw, 64px)',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '999 1 440px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <span style={{ width: 28, height: 2, background: '#5E9CFF', flex: 'none' }} />
                <span className="eyebrow" style={{ color: 'var(--on-dark-2)' }}>
                  Maryland · DC · Virginia · Delaware · Pennsylvania
                </span>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(32px, 4.6vw, 56px)',
                  lineHeight: 1.06,
                  letterSpacing: '-0.028em',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: 20,
                }}
              >
                Independent insurance, from the people who sold you the house.
              </h1>
              <p
                style={{
                  margin: '0 0 32px',
                  fontSize: 'clamp(16px, 1.4vw, 18px)',
                  lineHeight: 1.55,
                  color: '#D4DCE7',
                  maxWidth: '52ch',
                }}
              >
                We shop every carrier we are appointed with on every quote, so your home and auto coverage actually
                fits. Real estate, mortgage, title and insurance under one roof — one team, one phone number.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link href="/quote" className="btn btn-primary">Get a home &amp; auto quote</Link>
                <Link href="/agents" className="btn btn-on-dark">Find your agent</Link>
              </div>
            </div>

            <div
              style={{
                flex: '1 1 340px',
                minWidth: 0,
                background: 'var(--paper)',
                borderRadius: 18,
                padding: 'clamp(22px, 2.4vw, 30px)',
                boxShadow: '0 18px 44px rgba(5,9,18,0.34)',
              }}
            >
              <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>Start a quote</h2>
              <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--muted)' }}>
                Two minutes. A licensed producer follows up the same day.
              </p>
              <QuoteForm variant="short" source="home-hero" />
            </div>
          </div>
        </section>

        {/* Two promises */}
        <section style={{ borderBottom: '1px solid var(--line)' }}>
          <div
            className="shell"
            style={{
              paddingTop: 'clamp(36px, 4.5vw, 56px)',
              paddingBottom: 'clamp(36px, 4.5vw, 56px)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(28px, 4vw, 56px)',
            }}
          >
            {[
              ['Independent', 'We are not one carrier’s sales office. We work for you, and we keep working for you at renewal.'],
              ['Shopped', 'Every quote is a comparison across our appointed carriers — never a single pitch dressed up as a recommendation.'],
            ].map(([title, copy], i) => (
              <div key={title} style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', gap: 'clamp(28px, 4vw, 56px)' }}>
                {i === 1 && <div className="promise-rule" style={{ width: 1, background: 'var(--line)', flex: 'none' }} />}
                <div>
                  <div style={{ width: 32, height: 2, background: 'var(--blue)', marginBottom: 18 }} />
                  <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 34px)', fontWeight: 700, marginBottom: 10 }}>{title}</h2>
                  <p style={{ margin: 0, fontSize: 'clamp(15px, 1.3vw, 17px)', lineHeight: 1.6, color: 'var(--muted)', maxWidth: '44ch' }}>
                    {copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lines of business */}
        <section id="personal">
          <div className="shell" style={{ paddingTop: 'clamp(52px, 6vw, 80px)', paddingBottom: 'clamp(52px, 6vw, 80px)' }}>
            <h2 style={{ fontSize: 'clamp(27px, 3vw, 36px)', fontWeight: 700, marginBottom: 8 }}>What we cover</h2>
            <p
              style={{
                margin: '0 0 clamp(28px, 3vw, 40px)',
                fontSize: 'clamp(15px, 1.4vw, 17px)',
                color: 'var(--muted)',
                maxWidth: '58ch',
              }}
            >
              Personal and commercial property and casualty, plus life and health through our licensed producers.
            </p>

            <div className="cards">
              {LINES.map((l) => (
                <div key={l.id} id={l.id} className="card">
                  <Image
                    src={l.photo}
                    alt=""
                    width={800}
                    height={500}
                    style={{ width: '100%', height: 'auto', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: 'clamp(22px, 2.2vw, 28px)', display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
                    <h3 style={{ fontSize: 21, fontWeight: 700 }}>{l.title}</h3>
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{l.blurb}</p>
                    <ul style={{ margin: '2px 0 0', paddingLeft: 18, fontSize: 14.5, lineHeight: 1.9, color: 'var(--muted)' }}>
                      {l.bullets.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                    <Link href="/quote" style={{ marginTop: 'auto', paddingTop: 14, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
                      {l.cta} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrated model */}
        <section
          style={{
            color: '#fff',
            backgroundImage:
              'linear-gradient(180deg, rgba(10,15,26,0.94) 0%, rgba(10,15,26,0.88) 100%), url(/photos/model-handshake.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        >
          <div className="shell" style={{ paddingTop: 'clamp(52px, 6vw, 84px)', paddingBottom: 'clamp(52px, 6vw, 84px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <span style={{ width: 28, height: 2, background: '#5E9CFF', flex: 'none' }} />
              <span className="eyebrow" style={{ color: '#9DAABD' }}>Two companies, one team</span>
            </div>
            <h2 style={{ fontSize: 'clamp(27px, 3.2vw, 38px)', fontWeight: 700, maxWidth: '20ch', marginBottom: 14 }}>
              Most agencies find out about your house after you buy it.
            </h2>
            <p
              style={{
                margin: '0 0 clamp(32px, 4vw, 48px)',
                fontSize: 'clamp(15px, 1.4vw, 17px)',
                lineHeight: 1.6,
                color: 'var(--on-dark-2)',
                maxWidth: '62ch',
              }}
            >
              We are already on the file. Your agent, your lender, your title company and your producer work in the
              same system, so the binder is ready before settlement instead of the week after.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 'clamp(20px, 2.4vw, 26px)' }}>
              {STEPS.map(([label, copy], i) => (
                <div key={label} style={{ borderTop: `2px solid ${i === 0 ? '#5E9CFF' : '#3A4759'}`, paddingTop: 18, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: '0.09em',
                      textTransform: 'uppercase',
                      color: i === 0 ? '#7FB0FF' : '#AFBCCD',
                      marginBottom: 10,
                    }}
                  >
                    {label}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#DCE3EC' }}>{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Carriers */}
        <section id="carriers" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(48px, 5.5vw, 76px)', paddingBottom: 'clamp(48px, 5.5vw, 76px)' }}>
            <h2 style={{ fontSize: 'clamp(25px, 2.8vw, 32px)', fontWeight: 700, marginBottom: 8 }}>The carriers we shop</h2>
            <p
              style={{
                margin: '0 0 clamp(26px, 3vw, 36px)',
                fontSize: 'clamp(15px, 1.3vw, 16px)',
                color: 'var(--muted)',
                maxWidth: '60ch',
              }}
            >
              Being independent means your quote is a comparison, not a pitch.
            </p>
            <CarrierWall />
          </div>
        </section>

        {/* Producers */}
        <section id="agents" style={{ background: 'var(--ground)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(48px, 5.5vw, 76px)', paddingBottom: 'clamp(48px, 5.5vw, 76px)' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 20,
                marginBottom: 'clamp(26px, 3vw, 36px)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 'clamp(25px, 2.8vw, 32px)', fontWeight: 700, marginBottom: 8 }}>Find your producer</h2>
                <p style={{ margin: 0, fontSize: 'clamp(15px, 1.3vw, 16px)', color: 'var(--muted)', maxWidth: '56ch' }}>
                  Every producer has their own page, their own line, and their own book. You work with a person.
                </p>
              </div>
              {producers.length > 0 && (
                <Link href="/agents" className="btn btn-ghost btn-sm">See all producers</Link>
              )}
            </div>

            {producers.length === 0 ? (
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px dashed var(--line-2)',
                  borderRadius: 16,
                  padding: 32,
                  color: 'var(--muted)',
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                Our producers are being set up. In the meantime, start a quote above and a licensed producer will follow
                up the same business day.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 }}>
                {producers.slice(0, 6).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/agents/${p.slug}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      background: 'var(--paper)',
                      border: '1px solid var(--line)',
                      borderRadius: 16,
                      padding: 22,
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'var(--blue-soft)',
                        flex: 'none',
                        overflow: 'hidden',
                      }}
                    >
                      {p.headshot && (
                        <Image src={p.headshot} alt="" width={144} height={144} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>{licenseLabel(p)}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted-2)', marginTop: 6 }}>
                        {p.statesLicensed.length > 0 ? `Licensed in ${p.statesLicensed.join(', ')}` : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cross-sell */}
        <section
          style={{
            backgroundColor: 'var(--ink)',
            backgroundImage: 'url(/photos/crosssell-door.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
          }}
        >
          <div
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(16,21,31,0.94) 0%, rgba(16,21,31,0.80) 62%, rgba(16,21,31,0.55) 100%)',
            }}
          >
            <div
              className="shell"
              style={{
                paddingTop: 'clamp(44px, 5vw, 72px)',
                paddingBottom: 'clamp(44px, 5vw, 72px)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 28,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <h2 style={{ fontSize: 'clamp(24px, 2.6vw, 30px)', fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                  Buying or selling as well?
                </h2>
                <p style={{ margin: 0, fontSize: 'clamp(15px, 1.3vw, 16px)', lineHeight: 1.6, color: 'var(--on-dark-2)', maxWidth: '58ch' }}>
                  REVOL Real Estate, All Western Mortgage and Raven Title are the same team. Tell your producer and
                  we will hand you off properly.
                </p>
              </div>
              <a href="https://revolrealestate.com" className="btn" style={{ background: '#fff', color: 'var(--ink)' }}>
                Talk to REVOL Real Estate
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
