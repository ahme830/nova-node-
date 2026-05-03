import { api } from './api';

export type MethodePaiement = 'carteVisa' | 'carteDahabia' | 'paypal' | 'virement' | 'cash';

export interface CommandeResponse {
    message: string;
    commande_id: string;
    montant_total: number;
    statut: string;
}

export const commandeService = {
    passer: (id_adrs: string, methode_paiement: MethodePaiement) =>
        api.post<CommandeResponse>('/commande', { id_adrs, methode_paiement }),

    getById: (id: string) => api.get<{ commande: any }>(`/commande/${id}`),

    getEnCours: () => api.get<{ commandes_en_cours: any[] }>('/commande/en-cours'),

    getHistorique: () => api.get<{ historique: any[] }>('/commande/historique'),

    annuler: (id: string) => api.put<{ message: string }>(`/commande/${id}/annuler`, {}),

    // Vendor specific calls
    getByVendeur: (vendeurId: string) => 
        api.get<{ commandes: any[] }>(`/commande/vendeur/${vendeurId}`),

    updateStatut: (id: string, statut: string) =>
        api.patch<{ message: string }>(`/commande/${id}/statut`, { statut }),
};
