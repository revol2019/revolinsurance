import LegalPage, { ReviewNote } from '@/components/LegalPage';
import { AGENCY, ADDRESS_LINES } from '@/lib/agency';

export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy"
      intro="What we collect when you ask us for a quote, and what we do with it."
    >
      <ReviewNote />
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>What we collect</h2>
      <p>
        When you submit a quote request we collect the information you type into the form: your name, email
        address, phone number, the property address where applicable, the coverage lines you asked about, and any
        note you add. We also record the date and time of the submission and the exact consent wording shown to
        you at that moment.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>What we do with it</h2>
      <p>
        We use it to prepare your quote and contact you about it. As an independent agency, that means sharing
        your submitted information with participating insurance carriers and authorized partners for the purpose
        of obtaining quotes. We do not sell your information.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>Who sees it inside REVOL</h2>
      <p>
        A quote request submitted from a producer&rsquo;s page goes to that producer. Anything submitted from a
        general page goes to our agency inbox and is assigned to a licensed producer.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>Getting your information removed</h2>
      <p>
        Email <a href={`mailto:${AGENCY.email}`}>{AGENCY.email}</a> and ask, or call{' '}
        <a href={`tel:${AGENCY.phoneHref}`}>{AGENCY.phone}</a>. Tell us the name and email address you used so we
        can find the record.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>Contact</h2>
      <address style={{ fontStyle: 'normal', lineHeight: 1.8 }}>
        {AGENCY.legalName}
        <br />
        {ADDRESS_LINES.map((line) => (<span key={line}>{line}<br /></span>))}
        <a href={`tel:${AGENCY.phoneHref}`}>{AGENCY.phone}</a>
        <br />
        <a href={`mailto:${AGENCY.email}`}>{AGENCY.email}</a>
      </address>
    </LegalPage>
  );
}
