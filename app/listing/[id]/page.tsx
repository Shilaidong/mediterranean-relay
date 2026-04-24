import { ListingDetailPage } from '@/components/listing-detail-page';

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetailPage listingId={id} />;
}
