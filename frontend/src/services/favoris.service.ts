import { api } from './api';
import { Product } from './produit.service';

export interface FavorisResponse {
  favoris: Product[];
}

export interface GenericResponse {
  message: string;
}

export const favorisService = {
  getAll: () => api.get<FavorisResponse>('/favoris'),
  
  add: (id_produit: string) => 
    api.post<GenericResponse>('/favoris', { id_produit }),
  
  remove: (id_produit: string) => 
    api.delete<GenericResponse>(`/favoris/${id_produit}`),
  
  clearAll: () => api.delete<GenericResponse>('/favoris'),
};
