import { AgencyLanding, agencyMetadata } from '@/lib/agency-landing';

export const revalidate = 300;
export const metadata = agencyMetadata('policy-review');

export default function Page() {
  return <AgencyLanding page="policy-review" />;
}
