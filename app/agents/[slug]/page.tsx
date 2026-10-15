import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Nav, Footer } from '@/components/Chrome';
import QuoteForm from '@/components/QuoteForm';
import QuoteChooser from '@/components/QuoteChooser';
import CarrierWall from '@/components/CarrierWall';
import { getActiveProducers, getProducer, hasPC, hasLife, licenseLabel } from '@/lib/producers';

export function generateStaticParams() {
  return getActiveProducers().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProducer(slug);
  if (!p) return { title: 'Producer not found' };
  return {
    title: `${p.name} — ${licenseLabel(p)}`,
    description: `${p.name}, ${p.title} at REVOL Insurance. Licensed in ${p.statesLicensed.join(', ')}.`,
  };
}

export default async function ProducerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProducer(slug);
  if (!p) notFound();

  const pc = hasPC(p);
  const life = hasLife(p);
  const accent = pc ? 'var(--blue)' : 'var(--green)';
  const heroPhoto = pc ? '/photos/agent-kitchen.jpg' : '/photos/life-couple.jpg';
  const heroTint = pc ? 'rgba(8,13,24,' : 'rgba(8,20,16,';

  return (
    <>
      <Nav />
      <main id="main">
        {/* Hero */}
        <section
          style={{
            backgroundImage: `linear-gradient(100deg, ${heroTint}0.95) 0%, ${heroTint}0.86) 54%, ${heroTint}0.52) 100%), url(${heroPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 50%',
          }}
        >
          <div
            className="shell"
            style={{
              paddingTop: 'clamp(40px, 5vw, 64px)',
              paddingBottom: 'clamp(44px, 5vw, 68px)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(28px, 4vw, 48px)',
            }}
          >
            <div style={{ flex: '0 1 260px', minWidth: 0 }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: 260,
                  aspectRatio: '3 / 4',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)',
                  border: p.headshot ? 'none' : '1px dashed rgba(255,255,255,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-dark-2)',
                  fontSize: 13,
                  textAlign: 'center',
                  padding: 16,
                }}
              >
                {p.headshot ? (
                  <Image src={p.headshot} alt={p.name} width={520} height={693} style={{ width: '100%', height: '100%', objectFit: 'cover' }} priority />
                ) : (
                  'Headshot pending'
                )}
              </div>
            </div>

            <div style={{ flex: '999 1 420px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ width: 24, height: 2, background: pc ? '#5E9CFF' : '#5FD3A6', flex: 'none' }} />
                <span className="eyebrow" style={{ color: 'var(--on-dark-2)' }}>REVOL Insurance producer</span>
              </div>
              <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.08, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                {p.name}
              </h1>
              <p style={{ margin: '0 0 18px', fontSize: 18, color: 'var(--on-dark-2)' }}>{p.title}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {pc && <Chip solid="var(--blue)">Property &amp; casualty</Chip>}
                {life && <Chip solid="var(--green)">Life &amp; health</Chip>}
                <Chip>Licensed in {p.statesLicensed.join(', ')}</Chip>
                <Chip>NPN {p.npn}</Chip>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                <a href="#quote" className={`btn ${pc ? 'btn-primary' : 'btn-green'}`}>
                  {pc ? 'Get a quote from me' : 'Request a coverage review'}
                </a>
                {p.calendarUrl && <a href={p.calendarUrl} className="btn btn-on-dark">Book a 15-minute call</a>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: 15 }}>
                <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`} style={{ color: '#E4EAF2', fontWeight: 500, textDecoration: 'none' }}>
                  {p.phone}
                </a>
                <a href={`mailto:${p.email}`} style={{ color: '#E4EAF2', fontWeight: 500, textDecoration: 'none' }}>
                  {p.email}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quote */}
        <section id="quote" style={{ borderBottom: '1px solid var(--line)' }}>
          <div
            className="shell"
            style={{
              paddingTop: 'clamp(44px, 5vw, 64px)',
              paddingBottom: 'clamp(44px, 5vw, 64px)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 32,
            }}
          >
            <div
              style={{
                flex: '999 1 520px',
                minWidth: 0,
                background: 'var(--ground)',
                border: '1px solid var(--line)',
                borderRadius: 18,
                padding: 'clamp(24px, 3vw, 36px)',
              }}
            >
              <div className="eyebrow" style={{ color: accent, marginBottom: 10 }}>Primary</div>
              <h2 style={{ fontSize: 'clamp(23px, 2.6vw, 28px)', fontWeight: 700, marginBottom: 6 }}>
                {pc ? 'Get a quote' : 'Tell me what you are protecting'}
              </h2>
              <p style={{ margin: '0 0 26px', fontSize: 16, color: 'var(--muted)', maxWidth: '54ch' }}>
                {pc
                  ? `Goes straight to ${p.name} — not a queue. Most quotes come back the same business day.`
                  : 'Life and Medicare do not price off a form. Give me the shape of it and I will come back with real options.'}
              </p>
              {pc ? (
                <QuoteChooser
                  producerSlug={p.slug}
                  producerName={p.name.split(' ')[0]}
                  source={`producer-${p.slug}`}
                />
              ) : (
                <QuoteForm
                  producerSlug={p.slug}
                  producerName={p.name.split(' ')[0]}
                  variant="life"
                  source={`producer-${p.slug}`}
                />
              )}
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pc && life && (
                <SideCard eyebrow="Also licensed" eyebrowColor="var(--green)" title="Life, Medicare & final expense">
                  <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>
                    Mortgage protection, term and whole life, and the Medicare transition. A conversation first, not
                    a form.
                  </p>
                  <a href="#quote" className="btn btn-ghost btn-sm">Request a life review</a>
                </SideCard>
              )}

              {!life && (
                <SideCard eyebrow="Not my license" title="Need life or Medicare?">
                  <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>
                    I am property and casualty only. I will introduce you to a licensed life producer on our team —
                    no handoff into a call center.
                  </p>
                  <Link href="/agents" className="btn btn-ghost btn-sm">Introduce me</Link>
                </SideCard>
              )}

              {!pc && (
                <SideCard eyebrow="Not my license" title="Need home or auto?">
                  <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>
                    I am life and health only. I will put you with a property and casualty producer on our team.
                  </p>
                  <Link href="/agents" className="btn btn-ghost btn-sm">Introduce me</Link>
                </SideCard>
              )}

              {p.alsoRealEstate && (
                <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 28, background: 'var(--ink)', color: '#fff' }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>Buying a home too?</h3>
                  <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: '#B8C3D2' }}>
                    {p.name.split(' ')[0]} also works with REVOL Real Estate, All Western Mortgage and Raven Title.
                    One handoff, same team.
                  </p>
                  <a href="https://revolrealestate.com" style={{ color: '#7FB0FF', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
                    Connect me with an agent →
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bio */}
        {p.bio.length > 0 && (
          <section style={{ borderBottom: '1px solid var(--line)' }}>
            <div className="shell" style={{ paddingTop: 'clamp(44px, 5vw, 64px)', paddingBottom: 'clamp(44px, 5vw, 64px)' }}>
              <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 30px)', fontWeight: 700, marginBottom: 18 }}>
                About {p.name.split(' ')[0]}
              </h2>
              <div style={{ maxWidth: '62ch' }}>
                {p.bio.map((para, i) => (
                  <p key={i} style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Carriers */}
        <section style={{ background: 'var(--ground)', borderBottom: '1px solid var(--line)' }}>
          <div className="shell" style={{ paddingTop: 'clamp(40px, 4.5vw, 56px)', paddingBottom: 'clamp(40px, 4.5vw, 56px)' }}>
            <h2 style={{ fontSize: 'clamp(21px, 2.2vw, 24px)', fontWeight: 700, marginBottom: 24 }}>Carriers I shop</h2>
            <CarrierWall only={p.carriers} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Chip({ children, solid }: { children: React.ReactNode; solid?: string }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: solid ? 600 : 500,
        padding: '6px 12px',
        borderRadius: 999,
        background: solid ?? 'rgba(255,255,255,0.08)',
        border: solid ? 'none' : '1px solid rgba(255,255,255,0.4)',
        color: solid ? '#fff' : '#E4EAF2',
      }}
    >
      {children}
    </span>
  );
}

function SideCard({
  eyebrow,
  eyebrowColor = 'var(--muted-2)',
  title,
  children,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 28 }}>
      <div className="eyebrow" style={{ color: eyebrowColor, marginBottom: 10 }}>{eyebrow}</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}
