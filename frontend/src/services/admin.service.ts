import { api } from './api';

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  // Detailed breakdown
  clients?: { total: number; actifs: number; suspendus: number; bannis: number };
  commandes?: { total: number; en_cours: number; completees: number; annulees: number; revenu_total: number };
  magasins?: { total: number; actifs: number; en_attente_validation: number };
}

export const adminService = {
  // Get platform-wide stats
  getStats: () => api.get<AdminStats>('/admin/stats'),

  // User management
  getAllUsers: () => api.get<{ users: any[] }>('/admin/users'),
  updateUserRole: (userId: string, role: string) => 
    api.patch<{ message: string }>(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => 
    api.delete<{ message: string }>(`/admin/users/${userId}`),

  // Store management (Validation)
  getPendingStores: () => api.get<{ stores: any[] }>('/admin/stores/pending'),
  validateStore: (storeId: string, statut: 'actif' | 'suspendu') => 
    api.patch<{ message: string }>(`/admin/stores/${storeId}/validate`, { statut }),

  // Product management
  getAllProducts: () => api.get<{ produits: any[] }>('/admin/produits'),
  deleteProduct: (productId: string) => 
    api.delete<{ message: string }>(`/admin/produits/${productId}`),

  // Order management
  getAllOrders: () => api.get<{ commandes: any[] }>('/admin/commandes'),
  deleteOrder: (orderId: string) => 
    api.delete<{ message: string }>(`/admin/commandes/${orderId}`),

  // Category management
  getCategories: () => api.get<{ categories: any[] }>('/catalog/categories'),
  createCategory: (nom: string) => 
    api.post<{ message: string; categorie: any }>('/catalog/categories', { nom }),
  updateCategory: (id: string, nom: string) => 
    api.put<{ message: string; categorie: any }>(`/catalog/categories/${id}`, { nom }),
  deleteCategory: (id: string) => 
    api.delete<{ message: string }>(`/catalog/categories/${id}`),

  // Type management
  getTypes: () => api.get<{ types: any[] }>('/catalog/types'),
  createType: (nom: string, nom_categorie: string) => 
    api.post<{ message: string; type: any }>('/catalog/types', { nom, nom_categorie }),
  updateType: (id: string, data: { nom?: string; nom_categorie?: string }) => 
    api.put<{ message: string; type: any }>(`/catalog/types/${id}`, data),
  deleteType: (id: string) => 
    api.delete<{ message: string }>(`/catalog/types/${id}`),

  // Reviews management
  getAllReviews: (params?: { id_produit?: string; page?: number; limit?: number }) => 
    api.get<{ avis: any[]; total: number }>('/admin/avis', params),
  deleteReview: (id: string) => 
    api.delete<{ message: string }>(`/admin/avis/${id}`),

  // Reports management
  getAllReports: (params?: { page?: number; limit?: number }) => 
    api.get<{ signalements: any[]; total: number }>('/admin/signalements', params),
  deleteReport: (id: string) => 
    api.delete<{ message: string }>(`/admin/signalements/${id}`),
};
