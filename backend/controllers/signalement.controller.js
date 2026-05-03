const supabase = require("../db");

// NOTE: The schema's `signalement` table only has id_produit FK (no vendeur FK).
// Reporting a vendor directly is not in the DB yet.
// If needed, add: ALTER TABLE public.signalement ADD COLUMN id_vendeur uuid REFERENCES public.vendeur(id);

exports.signalerProduit = async (req, res) => {
  try {
    const { id_produit, id_avis, motif } = req.body;

    if (!motif || (!id_produit && !id_avis)) {
      return res.status(400).json({ error: "id_produit or id_avis, and motif are required" });
    }

    // Check duplication
    let existing = null;
    try {
        let query = supabase.from("signalement").select("id").eq("id_client", req.user.id);
        if (id_produit) query = query.eq("id_produit", id_produit);
        if (id_avis) query = query.eq("id_avis", id_avis);

        const { data } = await query.maybeSingle();
        existing = data;
    } catch (e) {
        console.warn("Could not check existing reports (maybe id_avis missing):", e.message);
    }

    if (existing) {
      return res.status(400).json({ error: "Vous avez déjà signalé cet élément" });
    }

    const reportData = {
        id_client: req.user.id,
        motif
    };

    if (id_produit) reportData.id_produit = id_produit;
    if (id_avis) reportData.id_avis = id_avis;

    const { data, error } = await supabase
      .from("signalement")
      .insert([reportData])
      .select()
      .single();

    if (error) {
        if (error.code === '42703' && id_avis) {
            return res.status(400).json({ 
                error: "Le signalement d'avis nécessite une mise à jour de la base de données. Veuillez contacter l'administrateur.",
                sql: "ALTER TABLE signalement ADD COLUMN id_avis UUID REFERENCES avis(id) ON DELETE CASCADE;"
            });
        }
        return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message:         "Signalement enregistré avec succès",
      signalement_id:  data.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getSignalements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
 
    const { data, error, count } = await supabase
      .from("signalement")
      .select(`
        id,
        motif,
        date,
        client!signalement_id_client_fkey (
          utilisateur!client_id_fkey ( nom_utilisateur, email )
        ),
        produit:id_produit ( id, nom_produit ),
        avis:id_avis ( 
          id, 
          contenu,
          client:id_client (
            utilisateur!client_id_fkey ( nom_utilisateur )
          )
        )
      `, { count: "exact" })
      .order("date", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
 
    if (error) return res.status(400).json({ error: error.message });
 
    res.status(200).json({ signalements: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
exports.deleteSignalement = async (req, res) => {
  try {
    const { id } = req.params;
 
    const { error } = await supabase.from("signalement").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
 
    res.status(200).json({ message: "Signalement supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};