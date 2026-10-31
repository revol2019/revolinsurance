import Image from 'next/image';
import { Footer, Wordmark } from '@/components/Chrome';
import CarrierWall from '@/components/CarrierWall';
import RateCheck from '@/components/rate/RateCheck';
import { RateButton, StickyCta, ZipStart } from '@/components/rate/Starters';
import type { LandingContext } from '@/components/rate/shared';
import { AGENCY } from '@/lib/agency';
import { approvedCarriers } from '@/lib/carriers';
import { campaignFor, type CampaignKey, type MergeVars } from '@/lib/campaigns';
import type { Producer } from '@/lib/producers';
import { STATE_NAMES, type StateCode } from '@/lib/rating';
import { AgentSection, Compare, SecHead } from './Landing';
import './landing.css';

export function mergeVars(key: CampaignKey, producer: Producer | null, origin = 'https://revolinsurance.com'): MergeVars {
  const first = producer ? producer.name.split(' ')[0] : 'REVOL';
  const slug = producer?.slug ?? null;
  const only = producer && producer.carriers.length > 0 ? producer.carriers : undefined;
  return {
    first,
    name: producer?.name ?? 'REVOL Insurance',
    phone: producer?.phone || AGENCY.phone,
    url: origin + (slug ? `/agents/${slug}/${key}` : `/${key}`),
    short: 'revolinsurance.com/' + (slug ? `${slug}/${key}` : key),
    carriers: approvedCarriers({ line: 'pc', only }).length || 10,
    city: AGENCY.address.city,
  };
}

/** Renders a headline with <em> allowed and nothing else. */
function Em({ text }: { text: string }) {
  const parts = text.split(/(<em>.*?<\/em>)/);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('<em>') ? <em key={i}>{p.slice(4, -5)}</em> : <span key={i}>{p}</span>))}
    </>
  );
}

/**
 * A campaign landing page: one offer, the rate check, and the producer.
 * Same chrome as the other landing pages, different story.
 */
export default function CampaignLanding({ campaign, producer, states }: { campaign: CampaignKey; producer: Producer | null; states: StateCode[] }) {
  const v = mergeVars(campaign, producer);
  const c = campaignFor(campaign, v);
  const first = producer ? v.first : null;
  const Who = first ?? 'One licensed REVOL agent';
  const phone = v.phone;
  const tel = 'tel:' + phone.replace(/[^\d+]/g, '');
  const only = producer && producer.carriers.length > 0 ? producer.carriers : undefined;
  const pcCarriers = approvedCarriers({ line: 'pc', only });
  const statesLine = states.map((s) => STATE_NAMES[s]).join(' · ');

  const ctx: LandingContext = {
    agent: producer
      ? { slug: producer.slug, name: producer.name, first: v.first, phone: producer.phone, headshot: producer.headshot, calendarUrl: producer.calendarUrl, npn: producer.npn, carriers: producer.carriers }
      : null,
    source: producer ? `producer-${producer.slug}:${campaign}` : `web-${campaign}`,
    pageTitle: c.name,
    states,
    officePhone: AGENCY.phone,
  };

  return (
    <>
      <header className="lp-head">
        <div className="shell lp-head-in">
          <Wordmark />
          <div className="lp-head-right">
            <a href={tel} className="lp-head-phone">
              {first ? <span>{producer?.name} · </span> : <span>Talk to a local agent · </span>}
              {phone}
            </a>
            <RateButton path={c.path} className="btn btn-primary btn-sm">{c.creative.cta}</RateButton>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="lp-hero" style={{ backgroundImage: `url(${c.heroImage})` }}>
          <div className="shell lp-hero-in">
            <div className="lp-hero-copy">
              <div className="lp-eyebrow">{statesLine || 'Independent agency'}</div>
              <h1><Em text={c.headline} /></h1>
              <p className="lp-hero-sub">{c.sub}</p>
              <ul className="lp-trust">{c.trust.map((t) => <li key={t}>{t}</li>)}</ul>
              {producer ? (
                <div className="lp-agent-chip">
                  {producer.headshot ? <Image src={producer.headshot} alt="" width={96} height={96} /> : <span>{first?.slice(0, 1)}</span>}
                  <div>
                    <b>{producer.name}</b>
                    <small>{producer.title}{producer.npn ? ` · NPN ${producer.npn}` : ''}</small>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="lp-hero-card">
              <ZipStart paths={c.path === 'auto' ? ['auto'] : ['bundle', 'auto', 'home']} defaultPath={c.path} states={states} officePhone={phone} title={campaign === 'young-driver' ? 'Who is on the policy?' : 'What went up?'} button={c.creative.cta} />
            </div>
          </div>
        </section>

        <section className="lp-carriers">
          <div className="shell">
            <div className="lp-carriers-head">
              <b>{first ? `Carriers ${first} is appointed with` : 'Carriers we are appointed with'}</b>
              <span>Availability varies by state and coverage.</span>
            </div>
            <CarrierWall line="pc" only={only} note={false} />
          </div>
        </section>

        <section className="lp-sec" id="how">
          <div className="shell lp-how">
            <div className="lp-how-photo">
              <Image src="/lp/policy-review.webp" alt="" width={720} height={540} />
              <div className="lp-how-badge"><span>Estimate → real quote</span><b>1 agent</b></div>
            </div>
            <div>
              <SecHead eyebrow="How it works" title="Three steps, one person, no call center." />
              <ol className="lp-steps">
                {c.steps.map((s) => (
                  <li key={s.title}><b>{s.title}</b><span>{s.body}</span></li>
                ))}
              </ol>
              <RateButton path={c.path}>{c.creative.cta} <span aria-hidden="true">→</span></RateButton>
            </div>
          </div>
        </section>

        <section className="lp-sec lp-white" id="why">
          <div className="shell lp-explainer">
            <SecHead eyebrow={c.explainer.eyebrow} title={c.explainer.title} />
            <div className="lp-explainer-body">
              <div>{c.explainer.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
              {c.explainer.bullets ? (
                <ul className="lp-check">
                  {c.explainer.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        <Compare n={pcCarriers.length || 10} who={Who} />

        <AgentSection producer={producer} first={first} phone={phone} tel={tel} states={states} />

        <section className="lp-sec" id="faq">
          <div className="shell lp-faq">
            <div>
              <SecHead eyebrow="Questions" title="Straight answers before you share a phone number." />
              <div className="lp-faq-call">
                <b>Rather just talk to someone?</b>
                <a href={tel}>{phone}</a>
                <span>Monday to Friday, 9 to 6</span>
              </div>
            </div>
            <div className="lp-faq-list">
              {c.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-sec lp-white">
          <div className="shell">
            <p className="lp-fine">{c.disclaimer}</p>
          </div>
        </section>
      </main>

      <Footer />
      <RateCheck ctx={ctx} defaultPath={c.path} />
      <StickyCta path={c.path} label={c.creative.cta} />
    </>
  );
}
