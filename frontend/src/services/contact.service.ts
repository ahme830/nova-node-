import { api } from './api';

export interface ContactMessage {
  id: string;
  nom: string;
  email: string;
  sujet: string;
  message: string;
  date: string;
}

export const contactService = {
  sendMessage: (data: { nom: string; email: string; sujet: string; message: string }) =>
    api.post<{ message: string; data: ContactMessage }>('/contact', data),

  getMessages: () =>
    api.get<{ messages: ContactMessage[] }>('/contact'),

  deleteMessage: (id: string) =>
    api.delete<{ message: string }>(`/contact/${id}`),
};
