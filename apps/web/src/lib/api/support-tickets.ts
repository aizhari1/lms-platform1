import { apiClient } from './client';

export interface TicketSummary {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface TicketMessage {
  id: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
  sender: { id: string; fullName: string; avatarUrl: string | null; role: string };
}

export interface TicketDetail extends TicketSummary {
  student: { id: string; fullName: string; avatarUrl: string | null };
  messages: TicketMessage[];
}

export async function fetchMyTickets(): Promise<TicketSummary[]> {
  const { data } = await apiClient.get('/support-tickets/mine');
  return data.data;
}

export async function fetchTicket(ticketId: string): Promise<TicketDetail> {
  const { data } = await apiClient.get(`/support-tickets/${ticketId}`);
  return data.data;
}

export async function createTicket(payload: {
  subject: string;
  message: string;
  category?: string;
}) {
  const { data } = await apiClient.post('/support-tickets', payload);
  return data.data;
}

export async function replyToTicket(ticketId: string, body: string) {
  const { data } = await apiClient.post(`/support-tickets/${ticketId}/messages`, { body });
  return data.data;
}
