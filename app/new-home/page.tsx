import { AgencyLanding, agencyMetadata } from '@/lib/agency-landing';

export const revalidate = 300;
export const metadata = agencyMetadata('new-home');

export default function Page() {
  return <AgencyLanding page="new-home" />;
}
