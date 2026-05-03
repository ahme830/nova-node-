import { api } from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RevenueForecast {
  date: string;
  revenu_predit: number;
  date_cible?: string; // from cache
}

export interface RevenueForecastResponse {
  source: 'model' | 'cache' | 'demo' | 'demo_fallback';
  forecasts: RevenueForecast[];
  note?: string;
}

export interface RestockAlert {
  nom_produit: string;
  unite_7j: number | null;
  seuil_normal: number;
  alerte_restock: boolean;
  jours_stock_restant: number | null;
  qte_dispo: number;
  message?: string;
  avg_price?: number;
}

export interface RestockAlertsResponse {
  source: 'model' | 'cache' | 'demo';
  alerts: RestockAlert[];
  message?: string;
}

export interface AdminPredictionsResponse {
  predictions_revenu: Array<{
    id_magasin: string;
    date_cible: string;
    revenu_predit: number;
    genere_le: string;
    magasin: { nom_magasin: string } | null;
  }>;
  predictions_restock: Array<{
    id_magasin: string;
    nom_produit: string;
    unite_7j: number;
    seuil_normal: number;
    alerte_restock: boolean;
    jours_stock_restant: number;
    genere_le: string;
    magasin: { nom_magasin: string } | null;
  }>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const predictionService = {
  /** Revenue forecast for the next 7 days for a given store */
  getRevenueForecast: (id_magasin: string, demo?: boolean) =>
    api.get<RevenueForecastResponse>(
      `/predictions/revenue/${id_magasin}`,
      demo ? { demo: '1' } : undefined
    ),

  /** Restock alerts for all products in a given store */
  getRestockAlerts: (id_magasin: string, demo?: boolean) =>
    api.get<RestockAlertsResponse>(
      `/predictions/restock/${id_magasin}`,
      demo ? { demo: '1' } : undefined
    ),

  /** Admin-only: get all predictions across all stores */
  getAllPredictions: () =>
    api.get<AdminPredictionsResponse>('/admin/predictions'),
};
