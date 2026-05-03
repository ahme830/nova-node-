import { api } from './api';

export const signalementService = {
  signalerProduit: (id_produit: string, motif: string) => 
    api.post<{ message: string }>('/signalement', { id_produit, motif }),

  // Note: Backend might need update to handle id_avis
  signalerAvis: (id_avis: string, motif: string) => 
    api.post<{ message: string }>('/signalement', { id_avis, motif }),
};
