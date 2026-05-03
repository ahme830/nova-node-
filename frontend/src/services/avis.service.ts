import { api } from './api';

export interface Avis {
    id: string;
    note: number;
    contenu: string;
    date: string;
    auteur: string;
    photo_auteur?: string;
}

export const avisService = {
    getByProduit: (idProduit: string) =>
        api.get<{ avis: Avis[]; note_moyenne: string; nb_avis: number }>(`/avis/produit/${idProduit}`),

    submit: (data: { id_produit: string; note: number; contenu: string }) =>
        api.post<{ message: string; avis: any }>('/avis', data),

    getAll: (params: { id_produit?: string; page?: number; limit?: number } = {}) =>
        api.get<{ avis: Avis[]; total: number }>('/avis', params),
};
