import { DashboardTopbar } from '@/components/dashboard/student/topbar';
import { WishlistClient } from '@/components/dashboard/student/wishlist-client';

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <DashboardTopbar locale={locale} title="المفضلة" />
      <WishlistClient locale={locale} />
    </>
  );
}
