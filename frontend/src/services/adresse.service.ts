import { api } from './api';

export interface Adresse {
  id: string;
  id_client: string;
  numero_rue: string | null;
  nom_rue: string;
  complement_adresse: string | null;
  code_postal: string;
  ville: string;
  region: string | null;
  pays: string;
}

export const adresseService = {
  getAdresses: () => api.get<{ adresses: Adresse[] }>('/adresse'),
  addAdresse: (adresse: Partial<Adresse>) => api.post<{ message: string; adresse: Adresse }>('/adresse', adresse),
  deleteAdresse: (id: string) => api.delete<{ message: string }>(`/adresse/${id}`),
};
