const supabase = require("../db");

// 1. GET THE CART
exports.getPanier = async (req, res) => {
  try {
    const client_id = req.user.id;

    const { data: panierData, error } = await supabase
      .from("panier")
      .select(`
        id_client,
        total_panier,
        item (
          qte,
          prix_at_time,
          produit (
            id,
            nom_produit,
            prix,
            image_url,
            qte_dispo,
            magasin ( nom_magasin ),
            type ( nom, categorie ( nom ) )
          )
        )
      `)
      .eq("id_client", client_id)
      .single(); 

    if (error) {
      if (error.code === 'PGRST116') return res.status(200).json({ panier: null, total: 0 });
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ 
      panier: panierData, 
      total: panierData.total_panier 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. ADD TO CART
exports.addToPanier = async (req, res) => {
  try {
    const { produit_id, quantite = 1 } = req.body;
    const client_id = req.user.id;

    const { data: produit, error: pErr } = await supabase
      .from("produit")
      .select("qte_dispo")
      .eq("id", produit_id)
      .single();

    if (pErr || !produit) return res.status(404).json({ error: "Produit not found" });

    if (produit.qte_dispo < quantite) return res.status(400).json({ error: "Not enough stock" });

    const { data: existingPanier } = await supabase
      .from("panier")
      .select("id_client")
      .eq("id_client", client_id)
      .single();
     
    if (!existingPanier) {
      await supabase.from("panier").insert([{ id_client: client_id }]);
    }

    const { data: existingItem } = await supabase
      .from("item")
      .select("qte")
      .eq("id_panier", client_id)
      .eq("id_produit", produit_id)
      .single();

      const alreadyInCart = existingItem?.qte ?? 0;

if (produit.qte_dispo < alreadyInCart + quantite) {
  return res.status(400).json({ error: "Not enough stock" });
}
    if (existingItem) {
      const { data, error } = await supabase
        .from("item")
        .update({ qte: existingItem.qte + quantite })
        .eq("id_panier", client_id)
        .eq("id_produit", produit_id)
        .select().single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ message: "Quantity updated", item: data });
    } else {
      const { data, error } = await supabase
        .from("item")
        .insert([{ id_panier: client_id, id_produit: produit_id, qte: quantite }])
        .select().single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ message: "Added to cart", item: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. UPDATE QUANTITY (RE-ADDED)
exports.updateQuantite = async (req, res) => {
  try {
    console.log("im in update")
    const { produit_id } = req.params;
    const { quantite } = req.body;
    const client_id = req.user.id;
console.log("so you want");
console.log(quantite);
    if (!quantite || quantite < 1) return res.status(400).json({ error: "quantite must be at least 1" });

    const { data: produit } = await supabase
      .from("produit")
      .select("qte_dispo")
      .eq("id", produit_id)
      .single();

    if (!produit) return res.status(404).json({ error: "Produit not found" });
        console.log("you want to buy ");
    console.log(quantite);
    console.log("but there is only");
    console.log(produit.qte_dispo);
    if (quantite > produit.qte_dispo) return res.status(400).json({ error: "Not enough stock" });

    const { data, error } = await supabase
      .from("item")
      .update({ qte: quantite })
      .eq("id_panier", client_id)
      .eq("id_produit", produit_id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: "Quantity updated", item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. REMOVE FROM CART (RE-ADDED)
exports.removeFromPanier = async (req, res) => {
  try {
    const { produit_id } = req.params;
    const client_id = req.user.id;

    const { error } = await supabase
      .from("item")
      .delete()
      .eq("id_panier", client_id)
      .eq("id_produit", produit_id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};