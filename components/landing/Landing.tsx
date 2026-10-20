import Image from 'next/image';
import Link from 'next/link';
import { Footer, Wordmark } from '@/components/Chrome';
import CarrierWall from '@/components/CarrierWall';
import RateCheck from '@/components/rate/RateCheck';
import LifeNeeds from '@/components/rate/LifeNeeds';
import { RateButton, StickyCta, ZipStart } from '@/components/rate/Starters';
import { LimitsTool, RebuildTool, Worksheet } from '@/components/rate/Tools';
import type { LandingContext } from '@/components/rate/shared';
import { AGENCY, ADDRESS_LINES } from '@/lib/agency';
import { approvedCarriers } from '@/lib/carriers';
import { LANDINGS, landingPath, type LandingKey } from '@/lib/landing';
import type { Producer } from '@/lib/producers';
import { STATE_MINIMUMS, STATE_NAMES, type StateCode } from '@/lib/rating';
import './landing.css';

const HERO: Record<LandingKey, string> = {
  'home-auto': '/lp/hero-umbrella-home.webp',
  auto: '/photos/agent-driving.jpg',
  'new-home': '/lp/agent-couple-home.webp',
  life: '/photos/life-couple.jpg',
};

function listStates(states: StateCode[]) {
  const names = states.map((s) => STATE_NAMES[s]);
  return names.length <= 1 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

/**
 * One landing page: a producer's (or the agency's) page built around an
 * instant quote tool. Server-rendered; the tools are client islands.
 */
export default function Landing({ page, producer, states }: { page: LandingKey; producer: Producer | null; states: StateCode[] }) {
  const def = LANDINGS[page];
  const first = producer ? producer.name.split(' ')[0] : null;
  const who = first ?? 'one licensed REVOL agent';
  const Who = first ?? 'One licensed REVOL agent';
  const phone = producer?.phone || AGENCY.phone;
  const tel = 'tel:' + phone.replace(/[^\d+]/g, '');
  const only = producer && producer.carriers.length > 0 ? producer.carriers : undefined;
  const pcCarriers = approvedCarriers({ line: 'pc', only });
  const n = pcCarriers.length || 10;
  const isLife = def.line === 'life';
  const primary: StateCode = states[0] ?? 'MD';
  const statesLine = states.map((s) => STATE_NAMES[s]).join(' · ');

  const ctx: LandingContext = {
    agent: producer
      ? {
          slug: producer.slug,
          name: producer.name,
          first: first as string,
          phone: producer.phone,
          headshot: producer.headshot,
          calendarUrl: producer.calendarUrl,
          npn: producer.npn,
          carriers: producer.carriers,
        }
      : null,
    source: producer ? `producer-${producer.slug}:${page}` : `web-${page}`,
    pageTitle: def.name,
    states,
    officePhone: AGENCY.phone,
  };

  const hero = {
    'home-auto': {
      title: <>{n} carriers. <em>One local agent.</em> No call-center pile-on.</>,
      sub: `See what ${n} carriers typically charge someone like you for home and auto, in about 60 seconds. Then ${who} turns the lowest estimate into a real quote.`,
    },
    auto: {
      title: <>See what you <em>should</em> be paying for car insurance.</>,
      sub: `Sixty seconds, ${n} carriers, and no call-center pile-on. Then ${who} turns the lowest estimate into a real, bindable quote.`,
    },
    'new-home': {
      title: <>Under contract? <em>Insurance done</em> before closing.</>,
      sub: `Price the house before your inspection period ends, and ${who} sends the binder straight to your lender and title company.`,
    },
    life: {
      title: <>How much life insurance do you <em>actually</em> need?</>,
      sub: `Two minutes of real math and no health questions. Then ${who} shops it across our life carriers and comes back with real prices.`,
    },
  }[page];

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
            {isLife ? (
              <a href="#calculator" className="btn btn-green btn-sm">Run the numbers</a>
            ) : (
              <RateButton path={def.defaultPath} className="btn btn-primary btn-sm">Compare rates</RateButton>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className={`lp-hero${isLife ? ' life' : ''}`} style={{ backgroundImage: `url(${HERO[page]})` }}>
          <div className="shell lp-hero-in">
            <div className="lp-hero-copy">
              <div className="lp-eyebrow">{statesLine || 'Independent agency'}</div>
              <h1>{hero.title}</h1>
              <p className="lp-hero-sub">{hero.sub}</p>
              <ul className="lp-trust">
                {isLife ? (
                  <>
                    <li>No health questions to see your number</li>
                    <li>Your information is not sold as a lead</li>
                    <li>Free. Carriers pay us, not you</li>
                  </>
                ) : (
                  <>
                    <li>No account, no spam</li>
                    <li>Your information is not sold as a lead</li>
                    <li>Free. Carriers pay us, not you</li>
                  </>
                )}
              </ul>
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
              {isLife ? (
                <div className="lp-starter">
                  <div className="lp-starter-head"><h2>Your number in two minutes</h2><span>No exam</span></div>
                  <p className="lp-starter-p">Income, mortgage, debts, kids and what you already have. You get a coverage amount and a term length, then decide if you want quotes.</p>
                  <a href="#calculator" className="btn btn-green lp-block">Run the numbers <span aria-hidden="true">→</span></a>
                </div>
              ) : (
                <ZipStart paths={def.paths} defaultPath={def.defaultPath} states={states} officePhone={phone} title={page === 'new-home' ? 'Price the house' : 'What are we pricing?'} />
              )}
            </div>
          </div>
        </section>

        {/* Carriers */}
        <section className="lp-carriers">
          <div className="shell">
            <div className="lp-carriers-head">
              <b>{first ? `Carriers ${first} is appointed with` : 'Carriers we are appointed with'}</b>
              <span>Availability varies by state and coverage.</span>
            </div>
            <CarrierWall line={isLife ? 'life' : 'pc'} only={only} note={false} />
          </div>
        </section>

        {page === 'life' ? (
          <section className="lp-sec" id="calculator">
            <div className="shell">
              <SecHead eyebrow="The calculator" title="Real math, the way an agent would do it." sub="Income for the years your family would need it, the mortgage, debts and college, less what you already have." />
              <LifeNeeds ctx={ctx} />
            </div>
          </section>
        ) : null}

        {page === 'new-home' ? (
          <>
            <Timeline who={Who} full />
            <section className="lp-sec lp-white" id="rebuild">
              <div className="shell">
                <SecHead eyebrow="How much house are you insuring?" title="Rebuild cost, not the price on the contract." sub="It is the single most common place homeowners end up underinsured. Get a rough number in thirty seconds, then price it." />
                <RebuildTool states={states} />
              </div>
            </section>
          </>
        ) : null}

        {page === 'auto' ? (
          <section className="lp-sec lp-white" id="limits">
            <div className="shell">
              <SecHead eyebrow="The part cheap policies skip" title="What better limits cost, and what they pay when it counts." sub="Pick what happened. See what each level of coverage pays, and what lands on you." />
              <LimitsTool states={states} />
            </div>
          </section>
        ) : null}

        {/* How it works */}
        <section className={`lp-sec${isLife ? ' lp-white' : ''}`} id="how">
          <div className="shell lp-how">
            <div className="lp-how-photo">
              <Image src="/lp/policy-review.webp" alt="" width={720} height={540} />
              <div className="lp-how-badge"><span>Estimate → real quote</span><b>1 agent</b></div>
            </div>
            <div>
              <SecHead eyebrow="How it works" title={isLife ? 'The number first. The conversation second.' : 'Comparison-site speed, without the comparison-site phone calls.'} />
              <ol className="lp-steps">
                {isLife ? (
                  <>
                    <li><b>Run your numbers</b><span>Income, mortgage, debts and kids. No name, no health questions.</span></li>
                    <li><b>See your coverage and term</b><span>A coverage amount and a term length that match what your family would need.</span></li>
                    <li><b>{Who} gets real prices</b><span>Shopped across our life carriers. Health questions happen on the phone, not on a website.</span></li>
                  </>
                ) : (
                  <>
                    <li><b>Answer a few questions</b><span>ZIP, drivers, vehicles, the house. No names, license numbers or VINs, just what moves a premium.</span></li>
                    <li><b>See your range across {n} carriers</b><span>Every carrier prices the same person differently. You see the spread, and whether bundling or splitting carriers comes out ahead.</span></li>
                    <li><b>{Who} makes it real</b><span>Runs your full details with the lowest carriers and calls or emails you a bindable quote. Nobody else gets your number.</span></li>
                  </>
                )}
              </ol>
              {isLife ? (
                <a href="#calculator" className="btn btn-green">Run my numbers <span aria-hidden="true">→</span></a>
              ) : (
                <RateButton path={def.defaultPath}>Start my rate check <span aria-hidden="true">→</span></RateButton>
              )}
            </div>
          </div>
        </section>

        {page === 'home-auto' ? <CoverageCards pc={pcCarriers.map((c) => c.name)} /> : null}

        {page === 'life' ? <LifeTypes /> : null}

        {!isLife ? <Compare n={n} who={Who} /> : null}

        {!isLife ? (
          <section className="lp-sec" id="worksheet">
            <div className="shell">
              <SecHead
                eyebrow="What moves your rate"
                title="Your premium is a multiplication problem. Here is the worksheet."
                sub="Carriers start with a base rate, then multiply by a factor for each thing they know about you. Change an input and watch the math move. It is the same engine behind the rate check."
              />
              <Worksheet states={states} only={page === 'auto' ? 'auto' : page === 'new-home' ? 'home' : undefined} />
            </div>
          </section>
        ) : null}

        {page === 'home-auto' ? (
          <section className="lp-claim">
            <div className="shell lp-claim-in">
              <div>
                <div className="lp-eyebrow">The part cheap policies skip</div>
                <h2>The cheapest policy is the one that actually pays when this happens.</h2>
                <p>A serious at-fault accident can blow past state-minimum limits in seconds, and anything above your limits can come after your savings and your home. The price difference is usually smaller than people expect.</p>
                <Link href={landingPath('auto', producer?.slug) + '#limits'} className="btn btn-on-dark">Compare limits side by side <span aria-hidden="true">→</span></Link>
              </div>
              <div className="lp-claim-tiers">
                <div><b>{STATE_MINIMUMS[primary]}</b><span>{STATE_NAMES[primary]} legal minimum</span></div>
                <div><b>100/300/100</b><span>What most drivers carry</span></div>
                <div><b>250/500/100</b><span>Where homeowners should start</span></div>
              </div>
            </div>
          </section>
        ) : null}

        {page === 'home-auto' ? <Timeline who={Who} /> : null}

        <AgentSection producer={producer} first={first} phone={phone} tel={tel} states={states} />

        <Faq page={page} who={who} Who={Who} states={states} carriers={pcCarriers.map((c) => c.name)} phone={phone} />

        <section className="lp-final">
          <div className="shell lp-final-in">
            <div>
              <div className="lp-eyebrow">Ready when you are</div>
              <h2>{isLife ? 'Two minutes to know your number.' : 'Sixty seconds to see if you are overpaying.'}</h2>
              <p>{isLife ? 'No health questions until you want real prices.' : `Start with your ZIP. You will see a range across ${n} carriers before we ask for a single piece of contact information.`}</p>
            </div>
            {isLife ? (
              <a href="#calculator" className="btn btn-green">Run the numbers <span aria-hidden="true">→</span></a>
            ) : (
              <ZipStart id="final" paths={[]} defaultPath={def.defaultPath} states={states} officePhone={phone} title="Start with your ZIP" />
            )}
          </div>
        </section>

        <p className="shell lp-legal">
          Rate check figures are estimates for comparison only, not offers of insurance or bindable quotes. Coverage is subject to underwriting,
          eligibility and each carrier&apos;s filed rates and forms. Carrier availability varies by state and line of business. Carrier names and
          logos belong to their owners and identify companies REVOL is appointed with; showing them does not imply endorsement.
          {producer ? ` ${producer.name}${producer.npn ? `, NPN ${producer.npn}` : ''}, licensed in ${listStates(states)}.` : ''}
        </p>
      </main>
      <Footer />

      {!isLife ? (
        <>
          <RateCheck ctx={ctx} defaultPath={def.defaultPath} />
          <StickyCta path={def.defaultPath} label={page === 'auto' ? 'Compare auto rates' : page === 'new-home' ? 'Price the house' : 'Compare rates'} />
        </>
      ) : null}
    </>
  );
}

function SecHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="lp-sechead">
      <div className="lp-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {sub ? <p>{sub}</p> : null}
    </div>
  );
}

function CoverageCards({ pc }: { pc: string[] }) {
  const cards = [
    { path: 'bundle' as const, badge: 'Most savings', title: 'Home + auto bundle', text: 'Multi-policy discounts are where the real money is, and we also check whether two carriers beat one.', bullets: ['Bundle vs. best-split comparison', 'One renewal date, one agent', 'Umbrella when your assets call for it'], cta: 'Price my bundle', primary: true },
    { path: 'auto' as const, title: 'Auto', text: 'Liability limits that match what you own, not just what the state requires. Teen drivers, several cars and lapses are all shoppable.', bullets: ['State minimums leave a lot exposed', 'Multi-car and homeowner credits', 'SR-22 and prior-lapse options'], cta: 'Price my auto' },
    { path: 'home' as const, title: 'Homeowners', text: 'Priced on rebuild cost, not market value, with roof age, deductible and claims history shopped across carriers with different appetites.', bullets: ['Older roofs placed where they are welcome', 'Replacement cost vs. actual cash value', 'Condo (HO-6) and landlord policies'], cta: 'Price my home' },
  ];
  return (
    <section className="lp-sec lp-white" id="coverage">
      <div className="shell">
        <SecHead eyebrow="Coverage we shop" title="Pick what you are protecting. We shop it everywhere at once." />
        <div className="lp-cards">
          {cards.map((c) => (
            <div className="lp-card" key={c.title}>
              {c.badge ? <span className="lp-card-badge">{c.badge}</span> : null}
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <ul>{c.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <div className="lp-card-tags">{pc.slice(0, 5).map((n) => <span key={n}>{n}</span>)}{pc.length > 5 ? <span>+{pc.length - 5}</span> : null}</div>
              <RateButton path={c.path} className={`btn ${c.primary ? 'btn-primary' : 'btn-ghost'} lp-block`}>{c.cta} <span aria-hidden="true">→</span></RateButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Compare({ n, who }: { n: number; who: string }) {
  const rows: [string, [string, string], [string, string], [string, string]][] = [
    ['Carriers compared', ['y', `${n} appointed carriers, priced locally`], ['y', 'Many, through partner networks'], ['n', 'One company only']],
    ['Who contacts you', ['y', who === 'One licensed REVOL agent' ? who : `${who}, and only ${who}`], ['m', 'Often several partner agents or carriers'], ['y', 'That company’s agent']],
    ['Your contact information', ['y', 'Stays with REVOL, never sold'], ['m', 'Commonly shared with partners'], ['y', 'Stays with that company']],
    ['Rate jumps at renewal', ['y', 'We re-shop it across carriers'], ['n', 'You start over'], ['n', 'Nowhere else to move you']],
    ['At claim time', ['y', 'Your agent goes to bat with the carrier'], ['n', 'You call the carrier yourself'], ['y', 'Agent can help']],
    ['Buying a home', ['y', 'Binder sent to your lender and title'], ['n', 'On you'], ['m', 'Varies']],
    ['Cost to you', ['y', '$0'], ['y', '$0'], ['y', '$0']],
  ];
  const mark = { y: '✓', n: '✕', m: '~' } as Record<string, string>;
  return (
    <section className="lp-sec lp-dark">
      <div className="shell">
        <SecHead eyebrow="Why an independent agency" title="Same side-by-side comparison. Very different day after." sub="National comparison sites are great at the first 60 seconds. What happens to your phone number next is where they differ." />
        <div className="lp-compare-cards">
          {rows.map(([k, us, web, captive]) => (
            <div key={k}>
              <h3>{k}</h3>
              <div className="us"><span className={`mk ${us[0]}`} aria-hidden="true">{mark[us[0]]}</span>REVOL: {us[1]}</div>
              <div className="them">
                <span><span className={`mk ${web[0]}`} aria-hidden="true">{mark[web[0]]}</span><b>Comparison sites:</b> {web[1]}</span>
                <span><span className={`mk ${captive[0]}`} aria-hidden="true">{mark[captive[0]]}</span><b>Single-company agent:</b> {captive[1]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="lp-table-wrap">
          <table className="lp-table">
            <thead>
              <tr><th scope="col"><span className="sr">Feature</span></th><th scope="col" className="us">REVOL Insurance</th><th scope="col">Online comparison sites</th><th scope="col">Single-company agent</th></tr>
            </thead>
            <tbody>
              {rows.map(([k, ...cols]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  {cols.map(([m, t], i) => (
                    <td key={i} className={i === 0 ? 'us' : undefined}><span className={`mk ${m}`} aria-hidden="true">{mark[m]}</span>{t}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Timeline({ who }: { who: string; full?: boolean }) {
  return (
    <section className="lp-sec" id="buying">
      <div className="shell">
        <SecHead
          eyebrow="Buying a home"
          title="Your lender needs a binder. Your title company needs it by Thursday. Covered."
          sub="REVOL Insurance sits on the same team as REVOL Real Estate, All Western Mortgage and Raven Title. Insurance is the step that most often holds up a closing, so we run it on the same timeline as everything else."
        />
        <ol className="lp-timeline">
          <li><small>Under contract</small><b>Price the house before inspection ends</b><span>Roof age and the home&apos;s claims history can change the price, or the carrier. Know before you are locked in.</span></li>
          <li><small>About 2 weeks out</small><b>Bind the policy</b><span>{who} sends the binder and evidence of insurance straight to your lender and settlement team.</span></li>
          <li><small>Closing day</small><b>Keys, and nothing left to chase</b><span>Your auto moves to the new address and gets re-bundled for the multi-policy discount.</span></li>
        </ol>
      </div>
    </section>
  );
}

function LifeTypes() {
  // Sits between two white sections on the life page.
  const types = [
    { t: 'Term life', d: 'Coverage for a set number of years, 10 to 30. The most coverage for the money while the kids are young and the mortgage is big.' },
    { t: 'Whole life', d: 'Lasts your whole life and builds cash value. Costs more; it fits estate planning and lifelong needs.' },
    { t: 'Mortgage protection', d: 'A term policy sized to the mortgage, so the house is paid off if something happens to you.' },
    { t: 'Final expense', d: 'A smaller whole life policy that covers funeral costs and final bills, often with simple health questions.' },
  ];
  return (
    <section className="lp-sec">
      <div className="shell">
        <SecHead eyebrow="What we write" title="Four kinds of life insurance, in plain English." />
        <div className="lp-types">
          {types.map((x) => (
            <div key={x.t}><h3>{x.t}</h3><p>{x.d}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentSection({ producer, first, phone, tel, states }: { producer: Producer | null; first: string | null; phone: string; tel: string; states: StateCode[] }) {
  if (!producer) {
    return (
      <section className="lp-sec lp-white">
        <div className="shell lp-agent">
          <div className="lp-agent-copy">
            <SecHead eyebrow="Rather just talk to someone?" title="Licensed agents in Timonium, Maryland." />
            <p className="lp-agent-p">{ADDRESS_LINES.join(' · ')}</p>
            <div className="lp-row">
              <a className="btn btn-primary" href={tel}>Call {phone}</a>
              <Link className="btn btn-ghost" href="/agents">Find an agent</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="lp-sec lp-white" id="agent">
      <div className="shell lp-agent">
        <div className="lp-agent-photo">
          {producer.headshot ? <Image src={producer.headshot} alt={producer.name} width={480} height={640} /> : <span>{first?.slice(0, 1)}</span>}
        </div>
        <div className="lp-agent-copy">
          <div className="lp-eyebrow">Your agent</div>
          <h2>{producer.name}</h2>
          <p className="lp-agent-title">{producer.title}{states.length ? ` · Licensed in ${listStates(states)}` : ''}{producer.npn ? ` · NPN ${producer.npn}` : ''}</p>
          {producer.bio.slice(0, 2).map((p, i) => <p key={i} className="lp-agent-p">{p}</p>)}
          <div className="lp-row">
            <a className="btn btn-primary" href={tel}>Call {phone}</a>
            {producer.email ? <a className="btn btn-ghost" href={`mailto:${producer.email}`}>Email {first}</a> : null}
            {producer.calendarUrl ? <a className="btn btn-ghost" href={producer.calendarUrl}>Book a time</a> : null}
          </div>
          <Link href={`/agents/${producer.slug}`} className="lp-more">More about {first} →</Link>
        </div>
      </div>
    </section>
  );
}

function Faq({ page, who, Who, states, carriers, phone }: { page: LandingKey; who: string; Who: string; states: StateCode[]; carriers: string[]; phone: string }) {
  const minimums = (states.length ? states : (['MD'] as StateCode[])).map((s) => `${STATE_NAMES[s]} ${STATE_MINIMUMS[s]}`).join('; ');
  const estimate: [string, string] = ['Is the rate check a real quote?', `No. It is an estimated range built from typical rating factors, so you can see the landscape before talking to anyone. ${Who} then confirms real, bindable prices with each carrier using your full driving, claims and property details.`];
  const calls: [string, string] = ['Will ten agents call me after I enter my number?', `No. Your information goes to ${who}. It is not sold to a lead marketplace.`];
  const sets: Record<LandingKey, [string, string][]> = {
    'home-auto': [
      estimate,
      calls,
      ['Which insurance companies do you compare?', `${carriers.join(', ')}. Which ones can write your policy depends on your state and the type of coverage: Universal, for example, writes homeowners only.`],
      ['Is bundling home and auto always cheaper?', 'Usually, not always. Multi-policy discounts often run 10 to 20%, yet one carrier’s best auto price paired with another carrier’s best home price can occasionally beat a single-carrier bundle. Because we are independent, the rate check shows you both.'],
      ['How much dwelling coverage do I need?', 'Enough to rebuild the house at today’s construction costs. That is not the market value or what you paid, and it leaves out the land. Rebuild cost is the most common place homeowners end up underinsured.'],
      ['What are the auto minimums here?', `Liability minimums, per person / per accident / property damage in thousands: ${minimums}. If you own a home, those minimums leave a lot of what you own exposed.`],
    ],
    auto: [
      estimate,
      calls,
      ['What limits should I carry?', 'Enough to protect what you own. 100/300/100 is what most drivers carry. If you own a home or have savings, start at 250/500/100 and consider an umbrella policy on top.'],
      ['What are the minimums here?', `Per person / per accident / property damage, in thousands: ${minimums}. Minimum limits also leave your own car uncovered unless you add comprehensive and collision.`],
      ['Does a lapse in coverage really matter?', 'Yes. Going without insurance, even briefly, is one of the most expensive things on an auto policy. If you are between cars, ask about a non-owner policy to keep your history going.'],
      ['Do I cancel my current policy first?', `No. Never cancel until the new policy is in force. ${Who} lines the start date up with your current policy so there is no gap.`],
    ],
    'new-home': [
      ['When should I get homeowners insurance when buying?', 'Start during your inspection period, as soon as you have the inspection report. Roof age and the home’s claims history can change the price or the carrier. Bind about two weeks before closing.'],
      ['Can you send the binder to my lender?', `Yes. ${Who} sends the binder and evidence of insurance directly to your lender and settlement team, whether or not you work with REVOL Real Estate.`],
      ['How much dwelling coverage do I need?', 'The cost to rebuild the house, not the purchase price. Land does not burn down, so it is left out. Use the rebuild calculator above for a starting number; your agent runs a full replacement-cost estimate before binding.'],
      ['Why does the roof’s age matter so much?', 'Roofs drive the biggest claims. Past about 15 years, several carriers decline the house or pay roof claims at actual cash value. An independent agent can place an older roof with a carrier that wants it.'],
      ['What is a CLUE report?', 'A claims history for the property. Claims by the previous owners can affect the price, which is why it is worth checking before your contingencies run out.'],
      ['Do I need flood insurance?', 'Your lender requires it if the house is in a high-risk flood zone. Elsewhere it is optional and often inexpensive. Federal flood policies usually have a 30-day wait, except when bought with a new mortgage, so ask early.'],
    ],
    life: [
      ['Term or whole life?', 'For most families with a mortgage and kids, term gives the most coverage for the money during the years it matters. Whole life lasts for life and builds cash value, at a higher price.'],
      ['How is the price set?', 'Your age, health, tobacco use, the coverage amount and the length of the term. That is why the calculator gives you a coverage amount, and your agent gets the price.'],
      ['Do I need a medical exam?', 'Often not. Many carriers approve healthy applicants without an exam up to fairly high amounts. If one is needed, a nurse comes to you.'],
      ['Isn’t my coverage through work enough?', 'Usually not. Work coverage is often one or two times your salary, and it ends when you leave the job.'],
      ['Will anyone else call me?', `No. Your information goes to ${who}. It is not sold to a lead marketplace.`],
    ],
  };
  return (
    <section className="lp-sec" id="faq">
      <div className="shell lp-faq">
        <div>
          <SecHead eyebrow="Questions" title="Straight answers before you share a phone number." />
          <div className="lp-faq-call">
            <b>Rather just talk to someone?</b>
            <a href={'tel:' + phone.replace(/[^\d+]/g, '')}>{phone}</a>
            <span>Monday to Friday, 9 to 6</span>
          </div>
        </div>
        <div className="lp-faq-list">
          {sets[page].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
