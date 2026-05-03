import { api } from './api';

export interface Category {
  id: string;
  nom: string;
  type?: Type[];
}

export interface Type {
  id: string;
  nom: string;
  id_categorie: string;
  categorie?: {
    id: string;
    nom: string;
  };
}

export const catalogService = {
  getCategories: () => api.get<{ categories: Category[] }>('/catalog/categories'),
  getTypes: () => api.get<{ types: Type[] }>('/catalog/types'),
};
