// controllers/prediction.controller.js  (updated)
// Uses Node 22 native fetch — no axios, no extra dependencies
const supabase = require("../db");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// ─── HELPER — call the Python ML service ────────────────────────────────────
async function callML(path, body, timeoutMs = 30000) {
  let res;
  try {
    res = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === "AbortError") throw Object.assign(new Error("ML service timeout"), { code: "ML_TIMEOUT" });
    throw Object.assign(new Error("ML service indisponible"), { code: "ECONNREFUSED" });
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `ML service returned ${res.status}`);
  }
  return res.json();
}

// ─── HELPER — fetch historical daily revenue ─────────────────────────────────
async function getShopDailyRevenue(id_magasin, days = 400) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("ligne_commande")
    .select(`prix_at_time, qte, commande!ligne_commande_id_commande_fkey (date_commande, statut_commande), produit!ligne_commande_id_produit_fkey (id_magasin)`)
    .eq("produit.id_magasin", id_magasin)
    .gte("commande.date_commande", since.toISOString())
    .eq("commande.statut_commande", "completer");

  if (error) throw new Error(error.message);

  const dailyMap = {};
  for (const row of data) {
    if (!row.commande || !row.produit) continue;
    const date = row.commande.date_commande.split("T")[0];
    dailyMap[date] = (dailyMap[date] || 0) + row.prix_at_time * row.qte;
  }

  const sortedDates = Object.keys(dailyMap).sort();
  if (sortedDates.length === 0) return [];

  const start = new Date(sortedDates[0]);
  const end   = new Date(sortedDates[sortedDates.length - 1]);
  const result = [];
  const current = new Date(start);

  while (current <= end) {
    const key = current.toISOString().split("T")[0];
    result.push(dailyMap[key] || 0);
    current.setDate(current.getDate() + 1);
  }
  return result;
}

// ─── HELPER — fetch per-product sales history ────────────────────────────────
async function getShopProductHistory(id_magasin, days = 60) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: produits, error: prodErr } = await supabase
    .from("produit")
    .select("id, nom_produit, prix, qte_dispo")
    .eq("id_magasin", id_magasin);
  if (prodErr) throw new Error(prodErr.message);
  if (!produits.length) return [];

  const productIds = produits.map(p => p.id);

  const { data: ventes, error: ventErr } = await supabase
    .from("ligne_commande")
    .select(`id_produit, qte, commande!ligne_commande_id_commande_fkey (date_commande, statut_commande)`)
    .in("id_produit", productIds)
    .gte("commande.date_commande", since.toISOString())
    .eq("commande.statut_commande", "completer");
  if (ventErr) throw new Error(ventErr.message);

  const productMap = {};
  for (const p of produits) {
    productMap[p.id] = { nom_produit: p.nom_produit, avg_price: parseFloat(p.prix), qte_dispo: p.qte_dispo, dailySales: {} };
  }
  for (const v of ventes) {
    if (!v.commande) continue;
    const date = v.commande.date_commande.split("T")[0];
    const pid  = v.id_produit;
    if (!productMap[pid]) continue;
    productMap[pid].dailySales[date] = (productMap[pid].dailySales[date] || 0) + v.qte;
  }

  const today = new Date();
  return Object.values(productMap).map(info => {
    const arr = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      arr.push(info.dailySales[key] || 0);
    }
    return { nom_produit: info.nom_produit, avg_price: info.avg_price, qte_dispo: info.qte_dispo, historical_units: arr };
  });
}

// ─── HELPER — generate DEMO revenue forecasts (no ML service needed) ─────────
function generateDemoRevenueForecast(historicalRevenue, id_magasin) {
  const recentDays = historicalRevenue.slice(-14);
  const avgDaily = recentDays.length > 0
    ? recentDays.reduce((s, v) => s + v, 0) / recentDays.length
    : 5000;

  const forecasts = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    // Add ±20% noise + slight upward trend
    const noise = 0.8 + Math.random() * 0.4;
    const trend = 1 + (i * 0.01);
    forecasts.push({
      date: dateStr,
      revenu_predit: Math.round(avgDaily * noise * trend),
    });
  }
  return { source: "demo", forecasts, note: "Prédictions démo générées localement (données insuffisantes pour le modèle ML)" };
}

// ─── HELPER — generate DEMO restock alerts (no ML service needed) ────────────
function generateDemoRestockAlerts(products) {
  return products.map(p => {
    const totalSold = p.historical_units.reduce((s, v) => s + v, 0);
    const avgDaily = totalSold / Math.max(p.historical_units.length, 1);
    const daysLeft = avgDaily > 0 ? Math.floor(p.qte_dispo / avgDaily) : 999;
    return {
      nom_produit:         p.nom_produit,
      avg_price:           p.avg_price,
      qte_dispo:           p.qte_dispo,
      unite_7j:            Math.round(avgDaily * 7),
      seuil_normal:        Math.round(avgDaily * 14), // 2-week buffer
      alerte_restock:      daysLeft <= 14,
      jours_stock_restant: Math.min(daysLeft, 999),
    };
  });
}

// ─── HELPER — verify shop ownership ──────────────────────────────────────────
async function verifyShopAccess(id_magasin, userId) {
  const { data: magasin, error } = await supabase
    .from("magasin").select("id, id_vendeur").eq("id", id_magasin).single();
  if (error || !magasin) return { allowed: false, status: 404, msg: "Magasin introuvable" };
  if (magasin.id_vendeur === userId) return { allowed: true };
  const { data: isAdmin } = await supabase.from("admin").select("id").eq("id", userId).single();
  if (isAdmin) return { allowed: true };
  return { allowed: false, status: 403, msg: "Accès refusé" };
}

// ─── CONTROLLER — GET REVENUE FORECAST ───────────────────────────────────────
exports.getRevenueForecast = async (req, res) => {
  try {
    const { id_magasin } = req.params;
    const { demo } = req.query; // ?demo=1 to force demo mode

    const access = await verifyShopAccess(id_magasin, req.user.id);
    if (!access.allowed) return res.status(access.status).json({ error: access.msg });

    const today = new Date().toISOString().split("T")[0];

    // Check cache first
    const { data: cached } = await supabase
      .from("prediction_revenu")
      .select("*")
      .eq("id_magasin", id_magasin)
      .gte("genere_le", `${today}T00:00:00Z`)
      .order("date_cible", { ascending: true });

    if (cached && cached.length >= 7) {
      return res.status(200).json({ source: "cache", forecasts: cached });
    }

    const historicalRevenue = await getShopDailyRevenue(id_magasin, 400);
    const hasEnoughData = historicalRevenue.length >= 30;

    // If demo mode forced, or not enough data, or ML unavailable — use demo
    if (demo === "1" || !hasEnoughData) {
      if (!hasEnoughData) {
        console.log(`[getRevenueForecast] Only ${historicalRevenue.length} days of data — using demo predictions`);
      }
      // Pad with some synthetic base if completely empty
      const dataToUse = historicalRevenue.length === 0
        ? Array(60).fill(0).map((_, i) => 3000 + Math.random() * 4000 + i * 50)
        : historicalRevenue;
      const result = generateDemoRevenueForecast(dataToUse, id_magasin);

      // Cache demo results
      const rows = result.forecasts.map(f => ({
        id_magasin,
        date_cible: f.date,
        revenu_predit: f.revenu_predit,
        genere_le: new Date().toISOString(),
      }));
      await supabase.from("prediction_revenu").upsert(rows, { onConflict: "id_magasin,date_cible" });

      return res.status(200).json(result);
    }

    // Try ML service
    try {
      const { forecasts } = await callML("/predict/revenue", { historical_revenue: historicalRevenue }, 30000);
      const rows = forecasts.map(f => ({ id_magasin, date_cible: f.date, revenu_predit: f.revenu_predit, genere_le: new Date().toISOString() }));
      await supabase.from("prediction_revenu").upsert(rows, { onConflict: "id_magasin,date_cible" });
      return res.status(200).json({ source: "model", forecasts });
    } catch (mlErr) {
      if (mlErr.code === "ECONNREFUSED" || mlErr.code === "ML_TIMEOUT") {
        // Fallback to demo predictions
        const result = generateDemoRevenueForecast(historicalRevenue, id_magasin);
        return res.status(200).json({ ...result, source: "demo_fallback" });
      }
      throw mlErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── CONTROLLER — GET RESTOCK ALERTS ─────────────────────────────────────────
exports.getRestockAlerts = async (req, res) => {
  try {
    const { id_magasin } = req.params;
    const { demo } = req.query;

    const access = await verifyShopAccess(id_magasin, req.user.id);
    if (!access.allowed) return res.status(access.status).json({ error: access.msg });

    const today = new Date().toISOString().split("T")[0];

    const { data: cached } = await supabase
      .from("prediction_restock")
      .select("*")
      .eq("id_magasin", id_magasin)
      .gte("genere_le", `${today}T00:00:00Z`)
      .order("alerte_restock", { ascending: false });

    if (cached && cached.length > 0) {
      return res.status(200).json({ source: "cache", alerts: cached });
    }

    const products = await getShopProductHistory(id_magasin, 60);

    if (!products.length) {
      return res.status(200).json({ alerts: [], message: "Aucun produit trouvé pour ce magasin" });
    }

    // Try ML service; fall back to local demo
    let alerts;
    let source = "model";

    try {
      if (demo === "1") throw new Error("demo_forced");
      const result = await callML("/predict/restock", { products }, 60000);
      alerts = result.alerts;
    } catch (mlErr) {
      console.log(`[getRestockAlerts] Using demo alerts: ${mlErr.message}`);
      alerts = generateDemoRestockAlerts(products);
      source = "demo";
    }

    // Persist
    await supabase.from("prediction_restock").delete().eq("id_magasin", id_magasin).gte("genere_le", `${today}T00:00:00Z`);
    const rows = alerts.map(a => ({
      id_magasin,
      nom_produit: a.nom_produit,
      unite_7j: a.unite_7j ?? 0,
      seuil_normal: a.seuil_normal ?? 0,
      alerte_restock: a.alerte_restock,
      jours_stock_restant: a.jours_stock_restant,
      genere_le: new Date().toISOString(),
    }));
    await supabase.from("prediction_restock").insert(rows);

    return res.status(200).json({ source, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPredictions = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: revenue, error: revError } = await supabase
      .from("prediction_revenu")
      .select(`id_magasin, date_cible, revenu_predit, genere_le, magasin:id_magasin ( nom_magasin )`)
      .gte("genere_le", `${today}T00:00:00Z`)
      .order("date_cible", { ascending: true });
    if (revError) return res.status(400).json({ error: revError.message });

    const { data: restock, error: restockError } = await supabase
      .from("prediction_restock")
      .select(`id_magasin, nom_produit, unite_7j, seuil_normal, alerte_restock, jours_stock_restant, genere_le, magasin:id_magasin ( nom_magasin )`)
      .gte("genere_le", `${today}T00:00:00Z`)
      .order("alerte_restock", { ascending: false });
    if (restockError) return res.status(400).json({ error: restockError.message });

    res.status(200).json({ predictions_revenu: revenue, predictions_restock: restock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── TEST ENDPOINT — seed demo data + get predictions ────────────────────────
// GET /api/predictions/test/:id_magasin?reset=1
exports.testPredictions = async (req, res) => {
  try {
    const { id_magasin } = req.params;
    const { reset } = req.query;

    // Clear cache if requested
    if (reset === "1") {
      await supabase.from("prediction_revenu").delete().eq("id_magasin", id_magasin);
      await supabase.from("prediction_restock").delete().eq("id_magasin", id_magasin);
    }

    const products = await getShopProductHistory(id_magasin, 60);
    const historicalRevenue = await getShopDailyRevenue(id_magasin, 90);

    const dataForRevenue = historicalRevenue.length === 0
      ? Array(60).fill(0).map((_, i) => 2000 + Math.random() * 8000 + i * 80)
      : historicalRevenue;

    const revenueResult  = generateDemoRevenueForecast(dataForRevenue, id_magasin);
    const restockAlerts  = generateDemoRestockAlerts(products.length > 0 ? products : [
      { nom_produit: "Produit Démo A", avg_price: 3500, qte_dispo: 5, historical_units: Array(60).fill(0).map(() => Math.floor(Math.random() * 3)) },
      { nom_produit: "Produit Démo B", avg_price: 8900, qte_dispo: 50, historical_units: Array(60).fill(0).map(() => Math.floor(Math.random() * 2)) },
    ]);

    res.status(200).json({
      message: "Test predictions générées avec succès",
      real_data: { revenue_days: historicalRevenue.length, products: products.length },
      revenue_forecasts: revenueResult.forecasts,
      restock_alerts: restockAlerts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};