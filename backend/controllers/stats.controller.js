const supabase = require("../db");

exports.getStats = async (req, res) => {
  try {
    // Run all counts in parallel
    const [
      { count: total_clients },
      { count: clients_actifs },
      { count: clients_suspendus },
      { count: clients_bannis },
      { count: total_commandes },
      { count: commandes_en_cours },
      { count: commandes_completees },
      { count: commandes_annulees },
      { count: total_magasins },
      { count: magasins_actifs },
      { count: magasins_non_valides },
      { count: total_produits },
      { count: total_avis },
      { count: total_signalements },
      { count: total_vendeurs },
      { count: total_messages },
    ] = await Promise.all([
      supabase.from("client").select("*", { count: "exact", head: true }),
      supabase.from("client").select("*", { count: "exact", head: true }).eq("statut", "actif"),
      supabase.from("client").select("*", { count: "exact", head: true }).eq("statut", "suspendu"),
      supabase.from("client").select("*", { count: "exact", head: true }).eq("statut", "banni"),
      supabase.from("commande").select("*", { count: "exact", head: true }),
      supabase.from("commande").select("*", { count: "exact", head: true }).eq("statut_commande", "en_cours"),
      supabase.from("commande").select("*", { count: "exact", head: true }).eq("statut_commande", "completer"),
      supabase.from("commande").select("*", { count: "exact", head: true }).eq("statut_commande", "annulee"),
      supabase.from("magasin").select("*", { count: "exact", head: true }),
      supabase.from("magasin").select("*", { count: "exact", head: true }).eq("statut", "actif"),
      supabase.from("magasin").select("*", { count: "exact", head: true }).eq("statut", "nonValide"),
      supabase.from("produit").select("*", { count: "exact", head: true }),
      supabase.from("avis").select("*", { count: "exact", head: true }),
      supabase.from("signalement").select("*", { count: "exact", head: true }),
      supabase.from("utilisateur").select("*", { count: "exact", head: true }).eq("role", "vendeur"),
      supabase.from("contact").select("*", { count: "exact", head: true }),
    ]);

    // Total revenue from completed orders
    const { data: revenueData } = await supabase
      .from("commande")
      .select("montant_total")
      .eq("statut_commande", "completer");

    const revenu_total = revenueData
      ? revenueData.reduce((sum, c) => sum + parseFloat(c.montant_total), 0).toFixed(2)
      : "0.00";

    res.status(200).json({
      // Flat format for frontend dashboard compatibility
      totalUsers: total_clients || 0,
      totalVendors: total_vendeurs || 0,
      totalProducts: total_produits || 0,
      totalOrders: total_commandes || 0,
      revenue: parseFloat(revenu_total),
      // Detailed nested format
      clients: {
        total: total_clients,
        actifs: clients_actifs,
        suspendus: clients_suspendus,
        bannis: clients_bannis,
      },
      commandes: {
        total: total_commandes,
        en_cours: commandes_en_cours,
        completees: commandes_completees,
        annulees: commandes_annulees,
        revenu_total: parseFloat(revenu_total),
      },
      magasins: {
        total: total_magasins,
        actifs: magasins_actifs,
        en_attente_validation: magasins_non_valides,
      },
      produits:     { total: total_produits },
      avis:         { total: total_avis },
      signalements: { total: total_signalements },
      messages:     { total: total_messages },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};