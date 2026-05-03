const supabase = require("../db");

exports.getFavoris = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("favoriser")
      .select(`
        produit:id_produit (
          id,
          nom_produit,
          prix,
          image_url,
          discount,
          qte_dispo
        )
      `)
      .eq("id_client", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    // Unwrap the nested produit objects for cleaner response
    const favoris = data.map(f => f.produit);

    res.status(200).json({ favoris });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addFavori = async (req, res) => {
  try {
    const { id_produit } = req.body;

    if (!id_produit) return res.status(400).json({ error: "id_produit is required" });

    // Check product exists
    const { data: produit, error: produitError } = await supabase
      .from("produit")
      .select("id")
      .eq("id", id_produit)
      .single();

    if (produitError || !produit) {
      return res.status(404).json({ error: "Produit not found" });
    }

    // Insert — PK constraint will reject duplicates
    const { error } = await supabase
      .from("favoriser")
      .insert([{ id_client: req.user.id, id_produit }]);

    if (error) {
      // Postgres unique/PK violation code
      if (error.code === "23505") {
        return res.status(400).json({ error: "Already in favorites" });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Produit ajouté aux favoris" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFavori = async (req, res) => {
  try {
    const { id_produit } = req.params;

    const { error } = await supabase
      .from("favoriser")
      .delete()
      .eq("id_client", req.user.id)
      .eq("id_produit", id_produit);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Produit retiré des favoris" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearFavoris = async (req, res) => {
  try {
    const { error } = await supabase
      .from("favoriser")
      .delete()
      .eq("id_client", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Liste des favoris vidée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};