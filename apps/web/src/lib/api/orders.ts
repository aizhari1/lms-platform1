import { apiClient } from './client';

export interface MyOrder {
  id: string;
  orderNo: string;
  courseId: string | null;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  invoiceUrl: string | null;
  createdAt: string;
  paidAt: string | null;
  coupon: { code: string } | null;
}

export interface OrderTimelineEvent {
  label: string;
  date: string;
  type: string;
}

export interface RefundRequest {
  id: string;
  reasonAr: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  order: { orderNo: string; totalAmount: string; currency: string };
}

export async function fetchMyOrders(): Promise<MyOrder[]> {
  const { data } = await apiClient.get('/payments/my-orders');
  return data.data;
}

export async function fetchOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
  const { data } = await apiClient.get(`/payments/orders/${orderId}/timeline`);
  return data.data;
}

export async function requestRefund(orderId: string, reasonAr: string) {
  const { data } = await apiClient.post(`/payments/orders/${orderId}/refund-request`, { reasonAr });
  return data.data;
}

export async function fetchMyRefundRequests(): Promise<RefundRequest[]> {
  const { data } = await apiClient.get('/payments/my-refund-requests');
  return data.data;
}
