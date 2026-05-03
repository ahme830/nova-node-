import { api } from './api';

export interface PanierItem {
    qte: number;
    prix_at_time: number;
    produit: {
        id: string;
        nom_produit: string;
        prix: number;
        image_url: string;
        qte_dispo: number;
        magasin?: { nom_magasin: string };
        type?: { nom: string; categorie?: { nom: string } };
    };
}

export interface PanierResponse {
    panier: {
        id_client: string;
        total_panier: number;
        item: PanierItem[];
    } | null;
    total: number;
}

export const panierService = {
    get: () => api.get<PanierResponse>('/panier'),

    add: (produit_id: string, quantite: number = 1) =>
        api.post<{ message: string; item: PanierItem }>('/panier', { produit_id, quantite }),

    updateQuantity: (produit_id: string, quantite: number) =>
        api.put<{ message: string; item: PanierItem }>(`/panier/${produit_id}`, { quantite }),

    remove: (produit_id: string) =>
        api.delete<{ message: string }>(`/panier/${produit_id}`),
};
