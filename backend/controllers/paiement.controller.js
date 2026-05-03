const supabase = require("../db");

// Returns the revenue breakdown per vendeur so admin can decide payout amount
exports.getVendeurRevenue = async (req, res) => {
  try {
    const { id_vendeur } = req.params;

    const { data: magasin, error: magasinError } = await supabase
      .from("magasin")
      .select("id, nom_magasin, revenu_total, statut")
      .eq("id_vendeur", id_vendeur)
      .single();

    if (magasinError || !magasin) {
      return res.status(404).json({ error: "Magasin not found for this vendeur" });
    }

 const { data: lignes, error: lignesError } = await supabase
  .from("ligne_commande")
  .select(`
    qte,
    prix_at_time,
    produit:id_produit!inner ( id_magasin ), 
    commande:id_commande!inner ( statut_commande, date_commande )
  `)
  .eq("produit.id_magasin", magasin.id)
  .eq("commande.statut_commande", "completer");

    if (lignesError) return res.status(400).json({ error: lignesError.message });

    const revenu_calcule = lignes
      ? lignes.reduce((sum, l) => sum + l.qte * l.prix_at_time, 0).toFixed(2)
      : "0.00";

    res.status(200).json({
      id_vendeur,
      magasin: { id: magasin.id, nom: magasin.nom_magasin },
      revenu_total_magasin: magasin.revenu_total,
      revenu_commandes_completees: parseFloat(revenu_calcule),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Record a payout to a vendeur
exports.payerVendeur = async (req, res) => {
  try {
    const { id_vendeur } = req.params;
    const { montant, methode, note } = req.body;

    if (!montant || montant <= 0) {
      return res.status(400).json({ error: "montant must be > 0" });
    }
    if (!methode) {
      return res.status(400).json({ error: "methode is required (e.g. virement, cash)" });
    }

    // Verify vendeur exists
    const { data: vendeur, error: vendeurError } = await supabase
      .from("vendeur")
      .select("id")
      .eq("id", id_vendeur)
      .single();

    if (vendeurError || !vendeur) {
      return res.status(404).json({ error: "Vendeur not found" });
    }

    const { data, error } = await supabase
      .from("paiement_vendeur")
      .insert([{
        id_vendeur,
        montant: parseFloat(montant),
        methode,
        note: note ?? null
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Paiement vendeur enregistré avec succès", paiement: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all payouts made to a vendeur
exports.getHistoriquePaiements = async (req, res) => {
  try {
    const { id_vendeur } = req.params;

    const { data, error } = await supabase
      .from("paiement_vendeur")
      .select("id, montant, methode, note, date")
      .eq("id_vendeur", id_vendeur)
      .order("date", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const total_paye = data.reduce((sum, p) => sum + parseFloat(p.montant), 0).toFixed(2);

    res.status(200).json({ paiements: data, total_paye: parseFloat(total_paye) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};