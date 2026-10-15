import LegalPage, { ReviewNote } from '@/components/LegalPage';
import { AGENCY } from '@/lib/agency';

export const metadata = { title: 'Terms' };

export default function Terms() {
  return (
    <LegalPage title="Terms of use" intro="The terms that apply to this website.">
      <ReviewNote />
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>This site is not an offer of coverage</h2>
      <p>
        Nothing on this website binds coverage, and submitting a form is not an application. Coverage exists only
        when a carrier issues a policy. Quotes are estimates based on the information provided and are subject to
        carrier underwriting.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>Licensing</h2>
      <p>
        {AGENCY.legalName} is a licensed independent insurance agency. Individual producers are licensed in
        specific states and for specific lines; a producer can only advise on lines they are licensed and appointed
        for. License numbers are listed in the site footer.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>Carrier marks</h2>
      <p>
        Carrier names and logos shown on this site are the property of their respective owners and are displayed
        under our appointment agreements. Their appearance does not imply the carrier endorses this site.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '28px 0 10px' }}>Claims</h2>
      <p>
        Claims are filed with your carrier, not with us. Submitting anything through this site does not report a
        claim or constitute notice of loss.
      </p>
    </LegalPage>
  );
}
