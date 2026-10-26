const supabase = require("../db");

exports.getAllUtilisateurs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("utilisateur")
      .select(`
        id,
        email,
        nom_utilisateur,
        role,
        date_creation,
        photo_url,
        client ( statut ),
        admin ( id )
      `);

    if (error) return res.status(400).json({ error: error.message });


    const enriched = await Promise.all(
      data.map(async (user) => {
        if (user.role === "vendeur") {
          const { data: vendeurData } = await supabase
            .from("vendeur")
            .select("id")
            .eq("id", user.id)
            .single();
          return { ...user, vendeur: vendeurData };
        }
        return { ...user, vendeur: null };
      })
    );

    res.json({ users: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUtilisateurById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("utilisateur")
      .select(`
        id,
        email,
        nom_utilisateur,
        role,
        date_creation,
        client ( statut ),
        admin ( id )
      `)
      .eq("id", id)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    let vendeur = null;
    if (data.role === "vendeur") {
      const { data: vendeurData } = await supabase
        .from("vendeur")
        .select("id")
        .eq("id", id)
        .single();
      vendeur = vendeurData;
    }

    res.json({ ...data, vendeur });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_utilisateur, email } = req.body;
    let { photo_url } = req.body;

    // Handle file upload from multipart/form-data
    if (req.file) {
      photo_url = req.file.secure_url || req.file.path;
    }

    const updateFields = {};
    if (nom_utilisateur !== undefined) updateFields.nom_utilisateur = nom_utilisateur;
    if (email !== undefined) updateFields.email = email;
    if (photo_url !== undefined) updateFields.photo_url = photo_url;

    const { data, error } = await supabase
      .from("utilisateur")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if the user is a vendor and handle their store/products
    const { data: user } = await supabase
      .from("utilisateur")
      .select("role")
      .eq("id", id)
      .single();

    if (user?.role === "vendeur") {
       const { data: magasins } = await supabase.from("magasin").select("id").eq("id_vendeur", id);
       
       if (magasins && magasins.length > 0) {
         const magasinIds = magasins.map(m => m.id);
         
         // Delete items/favorites/avis for all products of these stores
         const { data: products } = await supabase.from("produit").select("id").in("id_magasin", magasinIds);
         if (products && products.length > 0) {
           const productIds = products.map(p => p.id);
           await supabase.from("item").delete().in("id_produit", productIds);
           await supabase.from("favoriser").delete().in("id_produit", productIds);
           await supabase.from("avis").delete().in("id_produit", productIds);
           await supabase.from("ligne_commande").delete().in("id_produit", productIds);
           await supabase.from("produit").delete().in("id", productIds);
         }
         
         // Delete stores
         await supabase.from("magasin").delete().in("id", magasinIds);
       }
    }

    // 2. Clear user-specific data from other tables
    await supabase.from("item").delete().eq("id_panier", id);
    await supabase.from("panier").delete().eq("id_client", id);
    await supabase.from("favoriser").delete().eq("id_client", id);
    await supabase.from("avis").delete().eq("id_client", id);
    await supabase.from("signalement").delete().eq("id_client", id);
    await supabase.from("adresse").delete().eq("id_client", id);

    // 3. Clear role-specific tables
    await supabase.from("client").delete().eq("id", id);
    await supabase.from("vendeur").delete().eq("id", id);
    await supabase.from("admin").delete().eq("id", id);

    // 4. Delete public utilisateur record
    const { error: publicError } = await supabase.from("utilisateur").delete().eq("id", id);
    if (publicError) return res.status(400).json({ error: publicError.message });

    // 5. Delete from Supabase Auth (requires service role key)
    const { createClient } = require("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.warn(`[deleteUtilisateur] Auth deletion failed for ${id}, but public data was cleared:`, authError.message);
    }

    res.status(200).json({ message: "Utilisateur et ses données associés supprimés avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
