const supabase = require("../db");

exports.getAvisByProduit = async (req, res) => {
  try {
    const { id_produit } = req.params;

const { data, error } = await supabase
  .from("avis")
  .select(`
    id,
    note,
    contenu,
    date,
    client:id_client (
      user:utilisateur!client_id_fkey ( 
        nom:nom_utilisateur, 
        photo_url 
      )
    )
  `)
  .eq("id_produit", id_produit)
  .order("date", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
 
    const formatted = (data || []).map(a => ({
      ...a,
      auteur: a.client?.user?.nom || "Client",
      photo_auteur: a.client?.user?.photo_url
    }));

    const nb_avis   = formatted.length;
    const note_moyenne = nb_avis > 0
      ? (formatted.reduce((sum, a) => sum + a.note, 0) / nb_avis).toFixed(1)
      : null;

    res.status(200).json({ avis: formatted, note_moyenne, nb_avis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitAvis = async (req, res) => {
  try {
    const { id_produit, note, contenu } = req.body;

    if (!id_produit || !note) {
      return res.status(400).json({ error: "id_produit and note are required" });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ error: "note must be between 1 and 5" });
    }

    // Check the client actually bought this product (optional but good practice)
    // One review per client per product — check for existing
    const { data: existing } = await supabase
      .from("avis")
      .select("id")
      .eq("id_client",  req.user.id)
      .eq("id_produit", id_produit)
      .single();

    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from("avis")
        .update({ note, contenu: contenu ?? null })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ message: "Avis mis à jour", avis: data });
    }

    const { data, error } = await supabase
      .from("avis")
      .insert([{
        id_client:  req.user.id,
        id_produit,
        note,
        contenu: contenu ?? null
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Avis soumis avec succès", avis: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvis = async (req, res) => {
  try {
    const { id_produit, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
 
    let query = supabase
      .from("avis")
      .select(`
        id,
        note,
        contenu,
        date,
        client:id_client (
          user:utilisateur!client_id_fkey ( 
            nom:nom_utilisateur, 
            email 
          )
        ),
        produit:id_produit ( id, nom_produit )
      `, { count: "exact" })
      .order("date", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
 
    if (id_produit) query = query.eq("id_produit", id_produit);
 
    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
 
    const formatted = (data || []).map(a => ({
      ...a,
      auteur: a.client?.user?.nom || "Client",
      email_auteur: a.client?.user?.email
    }));

    res.status(200).json({ avis: formatted, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
exports.deleteAvis = async (req, res) => {
  try {
    const { id } = req.params;
 
    const { error } = await supabase.from("avis").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
 
    res.status(200).json({ message: "Avis supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
