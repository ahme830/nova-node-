import { api } from './api';

export interface Magasin {
  id: string;
  nom_magasin: string;
  description: string;
  id_vendeur: string;
  statut: 'actif' | 'suspendu' | 'nonValide' | 'fermer';
  date_creation: string;
  photo_url?: string;
}

export const magasinService = {
  // Get store by vendor ID
  getByVendeur: (vendeurId: string) => 
    api.get<{ magasin: Magasin }>(`/magasin/vendeur/${vendeurId}`),

  // Update store details
  update: (id: string, data: Partial<Pick<Magasin, 'nom_magasin' | 'description' | 'photo_url'>>) =>
    api.patch<{ message: string; magasin: Magasin }>(`/magasin/${id}`, data),
};
