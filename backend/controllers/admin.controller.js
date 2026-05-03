const supabase = require("../db");

exports.getAllProduits = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("produit")
      .select(`
        *,
        magasin ( nom_magasin ),
        type ( nom, categorie ( nom ) )
      `)
      .order("date_ajout", { ascending: false });

    if (error) throw error;
    res.status(200).json({ produits: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("produit").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCommandes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commande")
      .select(`
        *,
        client!commande_id_client_fkey ( utilisateur!client_id_fkey ( nom_utilisateur, email ) ),
        adresse:id_adrs ( ville, pays ),
        ligne_commande ( qte, prix_at_time, produit:id_produit ( nom_produit ) )
      `)
      .order("date_commande", { ascending: false });

    if (error) throw error;
    res.status(200).json({ commandes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCommande = async (req, res) => {
  try {
    const { id } = req.params;
    // Note: Deleting a commande might require deleting related rows (ligne_commande, paiement, etc.) 
    // or we can just cancel it. The user said "supprimer", so we try to delete.
    // Assuming ON DELETE CASCADE is set in DB. If not, we might need to handle it.
    const { error } = await supabase.from("commande").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Commande supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
