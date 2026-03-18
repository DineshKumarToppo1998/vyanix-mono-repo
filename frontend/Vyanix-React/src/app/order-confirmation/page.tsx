import { OrderConfirmationView } from '@/components/order/order-confirmation-view';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return <OrderConfirmationView orderId={orderId} />;
}
