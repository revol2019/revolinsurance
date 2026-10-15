import LegalPage, { ReviewNote } from '@/components/LegalPage';
import { AGENCY } from '@/lib/agency';

export const metadata = { title: 'Accessibility' };

export default function Accessibility() {
  return (
    <LegalPage
      title="Accessibility"
      intro="We want this site usable by everyone, and we want to hear about it when it is not."
    >
      <ReviewNote />
      <p>
        This site is built to work with a keyboard alone, with screen readers, and at phone widths. Form fields
        carry real labels, interactive elements are real buttons and links, and text is sized for contrast against
        its background.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>If something does not work for you</h2>
      <p>
        Tell us and we will fix it, and we will help you with whatever you were trying to do in the meantime.
        Email <a href={`mailto:${AGENCY.email}`}>{AGENCY.email}</a> or call{' '}
        <a href={`tel:${AGENCY.phoneHref}`}>{AGENCY.phone}</a>. You do not need to explain why.
      </p>
    </LegalPage>
  );
}
