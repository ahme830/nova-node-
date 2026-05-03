import { api } from './api';

export interface Product {
  id: string;
  nom_produit: string;
  description: string;
  prix: number;
  qte_dispo: number;
  image_url?: string;
  date_ajout?: string;
  type?: {
    nom: string;
    categorie?: { nom: string };
  };
  magasin?: {
    nom_magasin: string;
  };
}

export const produitService = {
  // Get all products with filters
  search: (params: { 
    search?: string; 
    categorie?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    sortBy?: string;
    inStock?: boolean;
    page?: number; 
    limit?: number 
  } = {}) =>
    api.get<{ produits: Product[]; total: number; page: number; limit: number }>('/produit', params),

  // Get a single product by ID
  getById: (id: string) =>
    api.get<{ produit: Product & { note_moyenne: string | null; nb_avis: number } }>(`/produit/${id}`),

  // Get all products for a specific store
  getByMagasin: (magasinId: string) => 
    api.get<{ produits: Product[] }>(`/produit/magasin/${magasinId}`),

  // Create a new product
  create: (data: Partial<Product>) =>
    api.post<{ message: string; produit: Product }>('/produit', data),

  // Update a product
  update: (id: string, data: Partial<Product>) =>
    api.put<{ message: string; produit: Product }>(`/produit/${id}`, data),

  // Delete a product
  delete: (id: string) =>
    api.delete<{ message: string }>(`/produit/${id}`),
};
