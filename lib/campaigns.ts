/**
 * Campaign kits: an offer, its landing page, and everything a producer needs
 * to put it in front of people — ad images, ad copy for each network, organic
 * post captions, and step-by-step launch instructions.
 *
 * A producer's campaign page is revolinsurance.com/agents/<slug>/<campaign>
 * (short: revolinsurance.com/<slug>/<campaign>). Leads land on their record
 * in REVOL Team with source "producer-<slug>:<campaign>", which is how the
 * Launch a campaign page in REVOL Team counts results.
 *
 * REVOL Team reads these kits from /api/campaigns so the copy lives in one
 * place. Change wording here, both sites update.
 *
 * COMPLIANCE NOTES (read before editing copy)
 * - Every savings figure must be true on average for REVOL's own book and
 *   carry "savings vary". Maryland and Virginia treat insurance ads that
 *   state or imply guaranteed savings as misleading.
 * - "Young driver savings" is a shopping service, not a carrier program. Do
 *   not call it a program, plan or discount of REVOL's own.
 * - A policy review is free because carriers pay commission. Say so.
 */

import type { QuotePath } from './rating';

export type CampaignKey = 'young-driver' | 'policy-review' | 'rate-increase';

export type MergeVars = {
  first: string; // producer first name, or "REVOL"
  name: string; // full name or "REVOL Insurance"
  phone: string;
  url: string; // the producer's campaign page, full URL
  short: string; // the short link to say out loud: revolinsurance.com/<slug>/<campaign>
  carriers: number;
  city: string; // "Timonium" or the producer's city when known
};

export type NetworkKit = {
  /** Where the agent clicks to start. */
  startUrl: string;
  /** Suggested daily budget in dollars. */
  dailyBudget: number;
  /** Plain-English, in order. Each step is one thing to click or type. */
  steps: string[];
  /** The settings to copy, label → value. */
  settings: { label: string; value: string }[];
  /** What to watch after it is live. */
  watch: string[];
};

export type Campaign = {
  key: CampaignKey;
  name: string;
  /** One line for the producer, why this campaign. */
  pitch: string;
  /** Who it is for, in the producer's words. */
  audience: string;
  path: QuotePath;
  heroImage: string;
  /** Headline and sub on the landing page, with merge fields. */
  headline: string;
  sub: string;
  trust: string[];
  /** The "how it works" steps on the landing page. */
  steps: { title: string; body: string }[];
  /** The explainer section. */
  explainer: { eyebrow: string; title: string; paragraphs: string[]; bullets?: string[] };
  faq: { q: string; a: string }[];
  /** The small print under the offer. Always shown. */
  disclaimer: string;
  /** The line on ad images. Short. */
  creative: { headline: string; sub: string; cta: string; accent: string };
  /** Ad copy per network. All with merge fields. */
  meta: { primaryText: string[]; headlines: string[]; descriptions: string[] };
  google: { headlines: string[]; descriptions: string[]; keywords: string[]; negatives: string[] };
  organic: { facebook: string; instagram: string; linkedin: string; tiktok: string; nextdoor: string };
  outreach: { text: string; email: { subject: string; body: string } };
  launch: { meta: NetworkKit; google: NetworkKit; organic: NetworkKit };
};

const COMMON_NEGATIVES = ['free', 'jobs', 'career', 'salary', 'agent license', 'exam', 'claim', 'claims phone', 'login', 'pay bill', 'cancel', 'lawyer', 'attorney', 'geico', 'progressive', 'state farm', 'allstate', 'usaa', 'cheap', 'cheapest'];

export const CAMPAIGNS: Record<CampaignKey, Campaign> = {
  'young-driver': {
    key: 'young-driver',
    name: 'Young driver savings',
    pitch: 'Parents adding a teen or college-age driver are the most motivated shoppers in auto insurance. Their rate just doubled.',
    audience: 'Parents of 16–24 year olds, and young drivers getting their own policy.',
    path: 'auto',
    heroImage: '/photos/agent-driving.jpg',
    headline: 'Adding a driver under 25? <em>Don’t just accept the new rate.</em>',
    sub: 'Every carrier prices a young driver differently, and most families never find out by how much. {{first}} shops it across {{carriers}} carriers and lines up every young-driver discount you qualify for.',
    trust: ['Good-student, driver-training and distant-student discounts', 'Telematics options that reward safe driving', 'No account, no spam, nothing sold as a lead'],
    steps: [
      { title: 'Tell us about the household', body: 'Drivers, cars and ZIP. No license numbers or VINs yet, just what moves the price.' },
      { title: 'See the spread', body: 'The same teen can cost twice as much at one carrier as another. You see the range across our carriers in about a minute.' },
      { title: '{{first}} finds the discounts', body: 'Good student, driver training, away-at-school, safe-driving apps, and the right car on the right policy. Then a real, bindable quote.' },
    ],
    explainer: {
      eyebrow: 'Why the rate jumps',
      title: 'A new driver is the biggest single change a policy ever sees.',
      paragraphs: [
        'Carriers rate a 16-year-old as the riskiest driver on the road, and many families see their premium rise 50 to 100 percent when one is added. The jump is real. How big it is depends almost entirely on which carrier you are with and which discounts get applied.',
        'That is where an independent agent earns their keep. We know which carriers are kind to young drivers, which ones want the student rated on the oldest car, and which discounts stack. Most families we help keep the same coverage and pay less than their current carrier asked for.',
      ],
      bullets: ['Good student (usually a B average)', 'Driver-training course completion', 'Distant student, 100+ miles from home without a car', 'Safe-driver telematics apps', 'Assigning the young driver to the right vehicle'],
    },
    faq: [
      { q: 'Should my teen get their own policy?', a: 'Almost never. A separate policy for a young driver costs far more than adding them to yours, and they lose your multi-car and bundle discounts. We will tell you if your case is the exception.' },
      { q: 'What if they only have a learner’s permit?', a: 'Most carriers cover permit holders on the parent’s policy at no charge until they are licensed. Tell us the date they expect to get licensed and we quote for that.' },
      { q: 'Does a college student away from home still need to be listed?', a: 'Yes, if they ever drive your cars on breaks. But if they are 100+ miles away without a car, the distant-student discount can cut most of their cost.' },
      { q: 'Will shopping affect my current policy?', a: 'No. Nothing changes until you decide. We quote first and you compare it to what you have.' },
    ],
    disclaimer: 'Savings vary by household, driving record, vehicles and carrier, and are not guaranteed. Discounts are set by each carrier and subject to eligibility. REVOL Financial Group, LLC is an independent insurance agency.',
    creative: { headline: 'Teen driver? Your rate just doubled.', sub: 'See what the right carrier charges, in 60 seconds.', cta: 'Compare rates', accent: '#1657c8' },
    meta: {
      primaryText: [
        'Adding a teen to your car insurance? The renewal letter can be a shock. The same 16-year-old costs twice as much at one carrier as another, and most families never see the comparison. I shop it across {{carriers}} carriers and line up every young-driver discount: good student, driver training, away at school, safe-driving apps. 60 seconds to see your range, no spam, nothing sold as a lead. {{short}}',
        'Parents in {{city}}: before you accept the new rate for your young driver, see what {{carriers}} carriers would charge. Good-student and driver-training discounts alone can change the answer. One local agent, no call center. {{short}}',
        'Your 17-year-old just got licensed and your premium went up $180 a month? That is common, and it is also the moment to shop. I’m {{name}} with REVOL Insurance. Send me 60 seconds and I’ll send you a real comparison. {{short}}',
      ],
      headlines: ['Teen driver? Compare before you pay', 'Young driver discounts, found for you', 'See what {{carriers}} carriers charge', 'Adding a driver under 25?', 'Your rate doubled. It doesn’t have to.'],
      descriptions: ['Local independent agent. 60-second rate check, real quote after.', 'Good student, driver training and away-at-school discounts. Free to shop.'],
    },
    google: {
      headlines: ['Adding a Teen Driver?', 'Young Driver Car Insurance', 'Compare {{carriers}} Carriers in 60 Sec', 'Teen Driver Discounts Found', 'Local Independent Agent', 'Good Student Discount Quotes', 'Don’t Accept the New Rate', 'Rate Check, No Spam Calls', 'Insurance for Drivers Under 25', 'Real Quote From One Agent', 'Driver Training Discounts', 'Away-at-School Discounts', 'REVOL Insurance, {{city}}', 'Free to Shop, No Obligation', 'College Student Car Insurance'],
      descriptions: [
        'Every carrier prices a young driver differently. See your range across {{carriers}} carriers, then get one real quote from {{name}}.',
        'Good student, driver training, distant student and telematics discounts, lined up for you. Independent agency in {{city}}.',
        'No account and no call-center pile-on. 60 seconds to compare, one local agent to make it real.',
        'Adding a 16 to 24 year old? Compare before you renew. Licensed in Maryland, Virginia and DC.',
      ],
      keywords: ['adding teen driver to insurance', 'teen driver car insurance', 'car insurance for new drivers', 'how much does adding a teenager to car insurance cost', 'young driver car insurance quotes', 'cheapest car insurance for teens', 'good student discount car insurance', 'car insurance for college students', 'insurance for 17 year old driver', 'add child to car insurance'],
      negatives: COMMON_NEGATIVES,
    },
    organic: {
      facebook: 'PSA for parents of new drivers: when your teen gets licensed, your insurance bill usually jumps 50 to 100 percent. What most people don’t know is that the same kid costs wildly different amounts at different carriers, and the discounts (good student, driver training, away at school) don’t apply themselves. I shop all of it. 60-second rate check here, no spam: {{short}}',
      instagram: 'Teen just got their license? 🚗 Your premium is about to jump, and the carrier you’re with decides by how much. I shop {{carriers}} carriers and find every young-driver discount. Link in bio or {{short}} #teendriver #carinsurance #{{city}}',
      linkedin: 'If you have a 16 to 24 year old in the house, the renewal letter after they get licensed is one of the biggest single increases a policy ever sees. It is also the most shoppable moment in personal insurance: carriers disagree by 2x on young drivers, and discounts like good student and driver training are applied inconsistently. Happy to run a comparison for anyone in my network, no obligation. {{short}}',
      tiktok: 'POV: your kid gets their license and your insurance goes up $200/month. Here’s what to do instead of just paying it. (Shop it. Carriers price teens completely differently. I do this for a living.) {{short}}',
      nextdoor: 'Neighbors with new teen drivers: I’m a local independent insurance agent and I do a lot of young-driver comparisons this time of year. If your renewal jumped after adding a driver, I can usually find a better answer with the same coverage. No pressure, 60-second rate check at {{short}} or call me at {{phone}}.',
    },
    outreach: {
      text: 'Hi {{client_first}}, it’s {{first}} with REVOL Insurance. If anyone in the house is turning 16 this year, let me know before the renewal: carriers price young drivers very differently and I can line up the discounts. 60-second check: {{short}}',
      email: {
        subject: 'Before you add a young driver to the policy',
        body: 'Hi {{client_first}},\n\nQuick heads-up if you have a teen or college student about to drive: adding them is the biggest single change a policy ever sees, often 50 to 100 percent. Which carrier you are with decides most of that.\n\nI shop young drivers across {{carriers}} carriers and line up every discount they qualify for (good student, driver training, away at school, safe-driving apps). Same coverage, usually less than the renewal asks.\n\nSixty-second rate check: {{url}}\nOr just reply with the driver’s age and the cars.\n\n{{name}}\nREVOL Insurance · {{phone}}',
      },
    },
    launch: {
      meta: {
        startUrl: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns',
        dailyBudget: 15,
        steps: [
          'Open Meta Ads Manager and click the green Create button.',
          'Choose the Leads objective. On the next screen pick Website as the conversion location, and the pixel for revolinsurance.com. (If no pixel shows, ask Ryan; one pixel covers every producer.)',
          'Name the campaign "Young driver – {{name}}". Daily budget: $15. Leave Advantage+ budget on.',
          'Audience: location = your licensed states, or a 25-mile radius around {{city}}. Age 35 to 60. Leave detailed targeting empty; Meta finds parents of teens on its own from the creative. Placements: Advantage+.',
          'Ad: Single image. Upload the square image from REVOL Team for feed and the vertical one for Stories/Reels. Primary text: paste option 1. Headline: paste headline 1. Description: paste description 1. Call to action: Learn more.',
          'Website URL: your campaign link from REVOL Team (it already carries the tracking tags). Click Publish.',
          'Back in REVOL Team, mark the campaign as launched with the network and budget, so your results show up.',
        ],
        settings: [
          { label: 'Objective', value: 'Leads → Website → event: Lead' },
          { label: 'Daily budget', value: '$15 ($450/month)' },
          { label: 'Location', value: 'Your licensed states, or 25 mi around {{city}}' },
          { label: 'Age', value: '35–60' },
          { label: 'Placements', value: 'Advantage+ (all)' },
          { label: 'Creative', value: 'Square 1080×1080 for feed, Story 1080×1920 for Stories/Reels' },
          { label: 'URL', value: '{{url}}' },
        ],
        watch: ['Give it 7 days before judging; Meta needs about 50 leads to learn, so do not touch the budget daily.', 'Cost per lead under $25 is good for this offer; over $50 after two weeks, swap in primary text option 2 and the other image.', 'Reply to every lead inside 5 minutes. Speed-to-lead alerts in REVOL Team will nag you for a reason.'],
      },
      google: {
        startUrl: 'https://ads.google.com/',
        dailyBudget: 20,
        steps: [
          'In Google Ads click + New campaign. Goal: Leads. Type: Search. Conversion goal: the "Lead" conversion for revolinsurance.com (ask Ryan if it is not listed).',
          'Name it "Search – Young driver – {{name}}". Networks: untick Display Network and Search partners.',
          'Locations: your licensed states only, with "Presence: people in or regularly in". Language: English.',
          'Bidding: Maximize conversions. Leave target CPA blank for the first 30 days. Daily budget: $20.',
          'Keywords: paste the list from REVOL Team as Phrase match (put quotes around each). Add the negative keyword list to the campaign.',
          'Responsive search ad: paste the 15 headlines and 4 descriptions from REVOL Team. Final URL: your campaign link. Pin headline 1 ("Adding a Teen Driver?") to position 1.',
          'Add a call asset with your phone and sitelinks to your rate-check pages. Publish.',
          'Mark it launched in REVOL Team.',
        ],
        settings: [
          { label: 'Campaign type', value: 'Search only (no Display, no partners)' },
          { label: 'Bidding', value: 'Maximize conversions, no target CPA for 30 days' },
          { label: 'Daily budget', value: '$20 ($600/month)' },
          { label: 'Locations', value: 'Licensed states, presence only' },
          { label: 'Match type', value: 'Phrase' },
          { label: 'Final URL', value: '{{url}}' },
        ],
        watch: ['Check the Search terms report twice a week for the first month and add anything irrelevant as a negative.', 'Expect $8–$15 per click on these terms; a 10% form rate makes that $80–$150 per lead, which pays if you bind one in five.', 'After 30 conversions, switch to Target CPA at your average so far.'],
      },
      organic: {
        startUrl: 'https://www.facebook.com/',
        dailyBudget: 0,
        steps: [
          'Download the square image from REVOL Team.',
          'Post it on your personal Facebook with the Facebook caption. Personal profiles reach far more people than business pages; this is where young-driver leads actually come from.',
          'Post the Story image to Instagram Stories with a link sticker to your campaign link, then the square image as a feed post with the Instagram caption.',
          'Post the Nextdoor caption in your neighborhood with the square image.',
          'Repeat every two weeks with a different image or a quick phone video of you explaining the teen-driver jump. Rotate the three captions.',
          'Send the text template to every client with a child aged 14 to 17 on the policy. Do it from REVOL Team so it is logged.',
        ],
        settings: [
          { label: 'Where', value: 'Personal Facebook first, then Instagram, LinkedIn, Nextdoor' },
          { label: 'How often', value: 'Every two weeks, rotate captions and images' },
          { label: 'Link', value: '{{short}} (easy to say out loud in a video)' },
        ],
        watch: ['Reply to every comment. Comments are what make Facebook show the post to more parents.', 'Your own clients with teens are the best list you have. The text template is the single highest-return step on this page.'],
      },
    },
  },

  'policy-review': {
    key: 'policy-review',
    name: 'Free policy review',
    pitch: 'The easiest yes in insurance: send me what you have and I will tell you if you are overpaying or underinsured. No shopping required from them.',
    audience: 'Anyone with a home or auto policy who has not shopped it in two years. Especially homeowners and past real estate clients.',
    path: 'bundle',
    heroImage: '/lp/policy-review.webp',
    headline: 'Get a <em>free second opinion</em> on your home and auto insurance.',
    sub: '{{first}} reads your current policies line by line, shops the same coverage across {{carriers}} carriers, and tells you honestly whether to stay or move. Most households we review are overpaying, underinsured, or both.',
    trust: ['Takes 60 seconds to start, nothing to cancel', 'Same coverage compared, not a stripped-down quote', 'Free. Carriers pay us, not you'],
    steps: [
      { title: 'Send what you have', body: 'A photo of your declarations page, or just answer a few questions. {{first}} needs coverage limits, not your life story.' },
      { title: '{{first}} reads it like an adjuster would', body: 'Limits that would leave you exposed, coverage you are paying for and do not need, discounts you are missing, and what {{carriers}} carriers would charge for the same thing.' },
      { title: 'You get a straight answer', body: 'Stay, move, or change limits. If staying is the right call, {{first}} says so. If moving saves real money, the switch is handled for you.' },
    ],
    explainer: {
      eyebrow: 'What a review catches',
      title: 'The two problems that hide in most policies.',
      paragraphs: [
        'Rates drift. A policy that was competitive three years ago is often 15 to 30 percent above market now, because carriers raise renewals slowly and count on nobody checking. That is the overpaying problem, and shopping fixes it.',
        'Coverage drifts too. Home values and rebuild costs went up faster than most dwelling limits; liability limits that made sense in 2015 are thin now. That is the underinsured problem, and it only shows up on the worst day. A review looks at both.',
      ],
      bullets: ['Dwelling coverage vs. today’s rebuild cost', 'Liability limits vs. what you actually have to protect', 'Deductibles you may have forgotten you chose', 'Bundle and multi-policy discounts you are not getting', 'Endorsements worth adding (water backup, service line, umbrella)'],
    },
    faq: [
      { q: 'What do you need from me?', a: 'The declarations page of each policy, which is the first page or two showing coverage and premium. A photo from your phone is fine. If you do not have it handy, answer the rate-check questions and we start there.' },
      { q: 'Is this really free?', a: 'Yes. Independent agents are paid commission by the carrier when you buy a policy. The review costs you nothing and there is no obligation.' },
      { q: 'What if my current policy is actually good?', a: 'Then we tell you that. About a third of the reviews we do end with "keep what you have." You still get the coverage check.' },
      { q: 'Will you call me a hundred times?', a: 'No. You hear from {{first}} and only {{first}}. Your information is not sold or shared with other agents.' },
    ],
    disclaimer: 'Savings are not guaranteed and vary by policy, coverage and carrier. Figures quoted describe typical results from REVOL Insurance policy reviews and are not a promise for any household. REVOL Financial Group, LLC is an independent insurance agency.',
    creative: { headline: 'Free policy review.', sub: 'Most households are overpaying, underinsured, or both.', cta: 'Get my review', accent: '#0e6b4a' },
    meta: {
      primaryText: [
        'When did you last have someone actually read your home and auto policies? Not a quote. A review. I look at your limits, your deductibles, the discounts you are missing, and what {{carriers}} carriers would charge for the same coverage. Then I tell you to stay or move. It is free, it takes a photo of your dec page to start, and about a third of the time my answer is "keep what you have." {{short}}',
        'Rates drift up a little every renewal because carriers count on nobody checking. Most households I review in {{city}} are overpaying for coverage that is also thinner than it should be. Free second opinion, no obligation, nothing sold as a lead: {{short}}',
        'I’m {{name}}, an independent insurance agent in {{city}}. Send me your declarations page and I will tell you honestly whether you should stay with your carrier. That is the whole offer. {{short}}',
      ],
      headlines: ['Free home & auto policy review', 'Overpaying? Find out in a day', 'A second opinion on your insurance', 'Stay or switch: a straight answer', 'Same coverage, {{carriers}} carriers compared'],
      descriptions: ['Independent agent in {{city}}. Send your dec page, get a real answer.', 'Free. No obligation. Your info is never sold as a lead.'],
    },
    google: {
      headlines: ['Free Insurance Policy Review', 'Are You Overpaying? Find Out', 'Home & Auto Second Opinion', 'Independent Agent, {{city}}', 'Same Coverage, Lower Rate', 'Compare {{carriers}} Carriers', 'Stay or Switch? Straight Answer', 'Review Your Dec Page Free', 'No Obligation, No Spam Calls', 'Underinsured? We Check That Too', 'REVOL Insurance Review', 'Licensed in MD, VA & DC', 'Homeowners Insurance Review', 'Auto Insurance Review', 'Bundle Discounts You’re Missing'],
      descriptions: [
        '{{name}} reads your policies line by line, shops the same coverage across {{carriers}} carriers, and tells you honestly whether to stay or move.',
        'Rates drift up every renewal. Rebuild costs went up faster than your limits. A free review catches both. No obligation.',
        'Send a photo of your declarations page. Independent agency in {{city}}, licensed in Maryland, Virginia and DC.',
        'Not a stripped-down quote. The same coverage, priced everywhere at once, by one local agent.',
      ],
      keywords: ['insurance policy review', 'am i overpaying for home insurance', 'am i paying too much for car insurance', 'home insurance review', 'compare home and auto insurance', 'independent insurance agent near me', 'insurance agent {{city}}', 'home and auto insurance quotes', 'homeowners insurance too expensive', 'car insurance went up'],
      negatives: COMMON_NEGATIVES.filter((n) => n !== 'free'),
    },
    organic: {
      facebook: 'Offer for friends: send me the first page of your home or auto policy and I will tell you, honestly, whether you are overpaying or underinsured. No quote spam, no obligation, and about a third of the time my answer is "keep what you have." I do this because the ones that need to move usually need to move badly. Start here: {{short}}',
      instagram: 'Free policy review 📋 Send me your dec page, I read it like an adjuster would, and you get a straight stay-or-switch answer. No spam. {{short}} #insurance #{{city}} #homeowners',
      linkedin: 'A small professional offer: I will review your home and auto policies for free. Most I see are 15 to 30 percent above market after a few renewals, and a surprising number have dwelling or liability limits that have not kept up. If yours are fine, I will say so. {{short}}',
      tiktok: 'Nobody reads their insurance policy. I do, for free. Send me the first page and I’ll tell you if you’re getting ripped off. (Spoiler: it’s usually the deductible and the liability limits, not the price.) {{short}}',
      nextdoor: 'Hi neighbors, I’m {{name}}, an independent insurance agent nearby. I’m offering free home and auto policy reviews: send me the first page of your policy and I’ll tell you if you’re overpaying or underinsured, with no obligation. {{short}} or {{phone}}.',
    },
    outreach: {
      text: 'Hi {{client_first}}, {{first}} at REVOL Insurance. Quick offer: send me a photo of your current home or auto declarations page and I’ll do a free review, stay-or-switch, no pressure. Or start here: {{short}}',
      email: {
        subject: 'A free second opinion on your insurance',
        body: 'Hi {{client_first}},\n\nI’m offering something simple this month: a free review of your home and auto policies. I read the limits and deductibles, check the discounts, and price the same coverage across {{carriers}} carriers. Then I tell you honestly whether to stay or move. About a third of the time, the answer is stay.\n\nTo start, reply with a photo of your declarations page (the first page of each policy), or take the 60-second rate check: {{url}}\n\n{{name}}\nREVOL Insurance · {{phone}}',
      },
    },
    launch: {
      meta: {
        startUrl: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns',
        dailyBudget: 15,
        steps: [
          'Open Meta Ads Manager and click Create. Objective: Leads. Conversion location: Website, pixel: revolinsurance.com, event: Lead.',
          'Name it "Policy review – {{name}}". Daily budget: $15.',
          'Audience: 25-mile radius around {{city}} (or your licensed states). Age 30 to 65. Detailed targeting: add "Homeowners" under Demographics if offered; otherwise leave empty. Placements: Advantage+.',
          'Ad: upload the square image (feed) and the Story image (Stories/Reels). Primary text option 1, headline 1, description 1. CTA: Get quote.',
          'Website URL: your campaign link. Publish.',
          'Mark it launched in REVOL Team.',
        ],
        settings: [
          { label: 'Objective', value: 'Leads → Website → event: Lead' },
          { label: 'Daily budget', value: '$15 ($450/month)' },
          { label: 'Location', value: '25 mi around {{city}}, or licensed states' },
          { label: 'Age', value: '30–65' },
          { label: 'CTA', value: 'Get quote' },
          { label: 'URL', value: '{{url}}' },
        ],
        watch: ['This offer gets a lot of "just curious" leads. That is fine; they convert later. Put every one in the drip.', 'Cost per lead under $20 is normal here. If you are over $40 after two weeks, try the Story image in feed; it tends to stop the scroll.', 'Reply inside 5 minutes and ask for the dec page by text. The ones who send it bind at a very high rate.'],
      },
      google: {
        startUrl: 'https://ads.google.com/',
        dailyBudget: 15,
        steps: [
          '+ New campaign → Leads → Search. Conversion goal: Lead (revolinsurance.com).',
          'Name "Search – Policy review – {{name}}". Untick Display Network and Search partners.',
          'Locations: licensed states, presence only. Bidding: Maximize conversions. Daily budget: $15.',
          'Keywords as Phrase match from REVOL Team; add the negatives list.',
          'Responsive search ad: paste the headlines and descriptions. Pin "Free Insurance Policy Review" to position 1. Final URL: your campaign link.',
          'Add a call asset with your phone. Publish, then mark it launched in REVOL Team.',
        ],
        settings: [
          { label: 'Campaign type', value: 'Search only' },
          { label: 'Bidding', value: 'Maximize conversions' },
          { label: 'Daily budget', value: '$15 ($450/month)' },
          { label: 'Match type', value: 'Phrase' },
          { label: 'Final URL', value: '{{url}}' },
        ],
        watch: ['"Insurance review" terms are cheaper than "quote" terms. Expect $5–$10 per click.', 'Watch the Search terms report for people looking for their carrier’s own site; add those as negatives.'],
      },
      organic: {
        startUrl: 'https://www.facebook.com/',
        dailyBudget: 0,
        steps: [
          'This is the campaign to run on your own list first. In REVOL Team, send the text template to every real estate client you have closed in the last three years who is not already an insurance client.',
          'Post the square image with the Facebook caption on your personal profile. Pin it for a week.',
          'Instagram Story with a link sticker, then the feed post.',
          'LinkedIn post with the LinkedIn caption. This one does unusually well on LinkedIn because it is an offer, not an ad.',
          'Every month, repost with a one-line result ("Reviewed 11 policies this month, moved 6, told 4 to stay"). Real numbers only.',
        ],
        settings: [
          { label: 'Where', value: 'Your past clients by text first, then Facebook, LinkedIn, Instagram, Nextdoor' },
          { label: 'How often', value: 'Monthly, with a real result line' },
        ],
        watch: ['Track how many people send a dec page vs. just click. Asking for the dec page by text within minutes is what moves the number.'],
      },
    },
  },

  'rate-increase': {
    key: 'rate-increase',
    name: 'Rate went up?',
    pitch: 'The renewal letter is the strongest buying signal in insurance, and it lands in every mailbox twice a year. This campaign catches people in the week they are angry.',
    audience: 'Anyone who just opened a renewal with a higher premium. Highest intent on Google search; strong on social during renewal-heavy months.',
    path: 'bundle',
    heroImage: '/lp/hero-umbrella-home.webp',
    headline: 'Renewal went up again? <em>You don’t have to take it.</em>',
    sub: 'Carriers raise renewals a little at a time and count on you not checking. {{first}} prices the same coverage across {{carriers}} carriers in about 60 seconds, and moves you if moving wins.',
    trust: ['Same coverage compared, not a cheaper policy', 'Switching is handled for you, no gap in coverage', 'Free. Carriers pay us, not you'],
    steps: [
      { title: 'Tell us what went up', body: 'Home, auto or both, and your ZIP. No account, no license numbers.' },
      { title: 'See what the market says', body: 'Your range across {{carriers}} carriers, in about a minute. You see immediately whether your carrier is still competitive or has quietly fallen behind.' },
      { title: '{{first}} handles the switch', body: 'A real quote, the new policy bound to start the day the old one ends, and the cancellation sent for you. Or, if staying is right, {{first}} says so.' },
    ],
    explainer: {
      eyebrow: 'Why renewals climb',
      title: 'Your carrier is not pricing you against the market. It is pricing you against your last renewal.',
      paragraphs: [
        'Most carriers use what the industry calls price optimization: small increases each renewal, sized to what customers tolerate without leaving. Over three or four years that adds up to a policy well above what a new customer would pay for the same thing.',
        'Switching is not the only answer. Sometimes the fix is a deductible, a discount that was never applied, or dropping coverage you no longer need. {{first}} looks at all of it. But when moving saves real money, it is handled start to finish, with no gap in coverage.',
      ],
      bullets: ['Multi-policy and bundle discounts', 'Claims-free and loyalty credits you may have lost in a switch years ago', 'Roof age and home updates that lower a home premium', 'Telematics and low-mileage options on auto', 'Deductible changes that cut premium without real risk'],
    },
    faq: [
      { q: 'Is there a penalty for switching mid-term?', a: 'Rarely. Most carriers refund the unused premium pro rata. We check for any short-rate penalty before recommending a move, and time the switch to your renewal when that is better.' },
      { q: 'Will I lose my claims-free discount?', a: 'No. Claims history follows you. A good record is a reason carriers compete for you.' },
      { q: 'What if I have an open claim?', a: 'Then we usually wait until it closes. Tell us and we will advise honestly.' },
      { q: 'How long does switching take?', a: 'Usually a few days. {{first}} binds the new policy to start the day the old one ends and sends the cancellation for you.' },
    ],
    disclaimer: 'Savings are not guaranteed and vary by policy, coverage, carrier and claims history. Cancellation terms are set by your current carrier. REVOL Financial Group, LLC is an independent insurance agency.',
    creative: { headline: 'Renewal went up again?', sub: 'Price the same coverage across {{carriers}} carriers in 60 seconds.', cta: 'Check my rate', accent: '#b3261e' },
    meta: {
      primaryText: [
        'Opened your renewal and it went up again? Carriers raise renewals a little at a time and count on you not checking. I price the same coverage across {{carriers}} carriers in about 60 seconds. If your carrier is still competitive, I tell you. If not, I move you with no gap in coverage. Nothing sold as a lead, no call center. {{short}}',
        'The renewal letter is not a bill. It is an offer. Before you accept it, see what {{carriers}} carriers would charge for exactly the same coverage. 60 seconds, one local agent, no spam. {{short}}',
        'Insurance rates in {{city}} are up across the board, but not evenly. The carrier that was cheapest for you three years ago usually is not now. I’m {{name}} with REVOL Insurance and I shop it for free. {{short}}',
      ],
      headlines: ['Renewal went up? Compare in 60 sec', 'Same coverage, {{carriers}} carriers', 'Don’t just accept the new rate', 'Your carrier vs. the market', 'Switching handled for you'],
      descriptions: ['Independent agent in {{city}}. Real quote, no call-center pile-on.', 'Free to compare. Nothing sold as a lead.'],
    },
    google: {
      headlines: ['Insurance Rate Went Up?', 'Compare {{carriers}} Carriers in 60 Sec', 'Don’t Accept the Renewal Rate', 'Same Coverage, Lower Price', 'Local Independent Agent', 'Home Insurance Renewal Too High', 'Car Insurance Went Up Again?', 'Switching Handled For You', 'No Gap in Coverage', 'Real Quote, No Spam Calls', 'REVOL Insurance, {{city}}', 'Licensed in MD, VA & DC', 'Homeowners Insurance Quotes', 'Auto Insurance Quotes', 'Free to Compare, No Obligation'],
      descriptions: [
        'Carriers raise renewals a little at a time. See what {{carriers}} carriers charge for the same coverage, then let {{name}} handle the switch.',
        'Opened a higher renewal? Compare in 60 seconds. If staying is right, we say so. If moving wins, no gap in coverage.',
        'Independent agency in {{city}}. One local agent, not a call center. Your information is never sold as a lead.',
        'Home, auto or both. Licensed in Maryland, Virginia and DC. Free to compare, no obligation.',
      ],
      keywords: ['car insurance went up', 'why did my car insurance go up', 'home insurance renewal increase', 'homeowners insurance went up', 'insurance premium increase', 'switch car insurance', 'switch home insurance', 'cheaper home insurance same coverage', 'compare home insurance rates', 'compare car insurance rates', 'independent insurance agent near me'],
      negatives: COMMON_NEGATIVES,
    },
    organic: {
      facebook: 'If your insurance renewal came in higher again this year, that is not an accident. Carriers raise renewals in small steps because most people never check. I price the same coverage across {{carriers}} carriers in about a minute. Sometimes the answer is stay. Often it is not. 60-second check, no spam: {{short}}',
      instagram: 'Renewal went up? 📈 Don’t just pay it. 60 seconds to see what {{carriers}} carriers charge for the same coverage. {{short}} #insurance #{{city}} #homeowners #carinsurance',
      linkedin: 'A pattern I see every week: a renewal that is 20 to 30 percent above what the same coverage costs new, because the carrier priced it against last year, not against the market. If your renewal climbed again, I am glad to run the comparison. No obligation. {{short}}',
      tiktok: 'Your insurance renewal went up again and you just paid it, didn’t you. Here’s the thing: that letter is an offer, not a bill. Takes 60 seconds to see what everyone else would charge. {{short}}',
      nextdoor: 'Neighbors: if your home or auto renewal came in higher this year, I’m a local independent agent and I can price the same coverage across {{carriers}} carriers in about a minute. If your current carrier is still the best, I’ll tell you. {{short}} or {{phone}}.',
    },
    outreach: {
      text: 'Hi {{client_first}}, {{first}} at REVOL Insurance. If any of your renewals came in higher this year, send me the number and I’ll check it against {{carriers}} carriers. Same coverage, usually a better answer. {{short}}',
      email: {
        subject: 'Did your renewal go up?',
        body: 'Hi {{client_first}},\n\nRenewal season is when I earn my keep. Carriers raise renewals a little each year and count on nobody checking; after a few years the policy is well above what the same coverage costs new.\n\nIf a renewal came in higher, I can price the same coverage across {{carriers}} carriers in about a minute. If your carrier is still competitive, I will tell you. If not, I handle the switch with no gap in coverage.\n\nStart here: {{url}}\nOr reply with the renewal amount and I will take it from there.\n\n{{name}}\nREVOL Insurance · {{phone}}',
      },
    },
    launch: {
      meta: {
        startUrl: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns',
        dailyBudget: 15,
        steps: [
          'Meta Ads Manager → Create → Leads → Website, pixel revolinsurance.com, event Lead.',
          'Name "Rate increase – {{name}}". Daily budget: $15.',
          'Audience: 25-mile radius around {{city}} or licensed states. Age 28 to 65. No detailed targeting. Placements: Advantage+.',
          'Ad: square image for feed, Story image for Stories/Reels. Primary text option 1, headline 1, description 1. CTA: Get quote.',
          'URL: your campaign link. Publish. Mark it launched in REVOL Team.',
        ],
        settings: [
          { label: 'Objective', value: 'Leads → Website → event: Lead' },
          { label: 'Daily budget', value: '$15 ($450/month)' },
          { label: 'Location', value: '25 mi around {{city}}, or licensed states' },
          { label: 'Age', value: '28–65' },
          { label: 'URL', value: '{{url}}' },
        ],
        watch: ['Runs best in the two weeks before the 1st and the 15th, when renewals land. Raise the budget to $25 those weeks if it is working.', 'Under $25 per lead is good. These leads are the most ready to bind of the three campaigns.'],
      },
      google: {
        startUrl: 'https://ads.google.com/',
        dailyBudget: 25,
        steps: [
          '+ New campaign → Leads → Search. Conversion goal: Lead (revolinsurance.com).',
          'Name "Search – Rate increase – {{name}}". Untick Display and Search partners.',
          'Locations: licensed states, presence only. Bidding: Maximize conversions. Daily budget: $25. This is the highest-intent search campaign of the three; it deserves the most budget.',
          'Keywords as Phrase match; add the negatives list.',
          'Responsive search ad with the headlines and descriptions. Pin "Insurance Rate Went Up?" to position 1. Final URL: your campaign link.',
          'Call asset with your phone. Publish. Mark it launched in REVOL Team.',
        ],
        settings: [
          { label: 'Campaign type', value: 'Search only' },
          { label: 'Bidding', value: 'Maximize conversions' },
          { label: 'Daily budget', value: '$25 ($750/month)' },
          { label: 'Match type', value: 'Phrase' },
          { label: 'Final URL', value: '{{url}}' },
        ],
        watch: ['"Went up" searches are the best terms in personal lines. Expect $10–$18 per click and a high form rate.', 'Add your own carriers’ names as negatives if you see people searching for their login pages.'],
      },
      organic: {
        startUrl: 'https://www.facebook.com/',
        dailyBudget: 0,
        steps: [
          'Post the square image and the Facebook caption on your personal profile in the last week of each month, when renewals are arriving.',
          'Instagram Story with link sticker; feed post with the Instagram caption.',
          'Nextdoor with the Nextdoor caption. Rate-increase posts get real engagement there.',
          'Record a 30-second phone video: hold up a renewal letter (not a client’s) and say the TikTok caption out loud. Post it to Reels, TikTok and Facebook.',
          'Text the template to past clients whose policies you do not hold; renewal month if you know it.',
        ],
        settings: [
          { label: 'When', value: 'Last week of each month' },
          { label: 'Where', value: 'Facebook personal, Instagram, Nextdoor, short video' },
        ],
        watch: ['Comments will include people venting about their carrier. Answer each one personally; they are leads.'],
      },
    },
  },
};

export const CAMPAIGN_KEYS = Object.keys(CAMPAIGNS) as CampaignKey[];

export function isCampaignKey(v: string): v is CampaignKey {
  return (CAMPAIGN_KEYS as string[]).includes(v);
}

/** Fills {{first}}, {{name}}, {{phone}}, {{url}}, {{short}}, {{carriers}}, {{city}}; leaves {{client_first}} for the producer. */
export function fill(text: string, v: MergeVars) {
  return text.replace(/\{\{\s*(first|name|phone|url|short|carriers|city)\s*\}\}/g, (_, k: keyof MergeVars) => String(v[k]));
}

function deepFill<T>(value: T, v: MergeVars): T {
  if (typeof value === 'string') return fill(value, v) as T;
  if (Array.isArray(value)) return value.map((x) => deepFill(x, v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(value as Record<string, unknown>)) out[k] = deepFill(x, v);
    return out as T;
  }
  return value;
}

/** A campaign with every merge field filled for one producer (or the agency). */
export function campaignFor(key: CampaignKey, v: MergeVars): Campaign {
  return deepFill(CAMPAIGNS[key], v);
}

/** The tracked link for a network: the campaign page plus UTMs, so Google and Meta results are told apart. */
export function trackedUrl(pageUrl: string, key: CampaignKey, slug: string | null, network: 'meta' | 'google' | 'organic' | 'text' | 'email') {
  const u = new URL(pageUrl);
  const medium = network === 'meta' ? 'paid_social' : network === 'google' ? 'cpc' : network === 'organic' ? 'social' : network;
  u.searchParams.set('utm_source', network === 'meta' ? 'facebook' : network === 'google' ? 'google' : network);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', key + (slug ? '-' + slug : ''));
  return u.toString();
}
