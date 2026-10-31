import { AgencyLanding, agencyMetadata } from '@/lib/agency-landing';

export const revalidate = 300;
export const metadata = agencyMetadata('young-driver');

export default function Page() {
  return <AgencyLanding page="young-driver" />;
}
