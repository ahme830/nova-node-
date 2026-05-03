// controllers/magasin.controller.js
const supabase = require("../db");
const { onStoreStatusChanged } = require("../utils/notification.helper");
const { cloudinary } = require("../middleware/upload");

// ==========================================
// SELLER ROUTES
// ==========================================

exports.createMagasin = async (req, res) => {
  try {
    const { nom_magasin, description } = req.body;
    
    // We now use req.user.id provided by your auth middleware
    const userId = req.user.id;

    // 1. Check user role
    const { data: profile, error: profileError } = await supabase
      .from("utilisateur").select("role").eq("id", userId).single();
    
    if (profileError) return res.status(400).json({ error: profileError.message });
    if (profile.role === "vendeur") return res.status(400).json({ error: "You already have a store" });
    if (profile.role !== "client") return res.status(403).json({ error: "Only clients can create a store" });

    // 2. Process the uploaded image (if any)
    let photo_url = null;
    if (req.file) {
      photo_url = req.file.secure_url || req.file.path;
    }

    // 3. Upgrade role to vendeur via your custom RPC
    const { error: upgradeError } = await supabase.rpc("upgrade_to_vendeur", {
      user_id: userId
    });
    
    if (upgradeError) {
        // If upgrade fails, delete the uploaded image so it doesn't take up space
        if (req.file) {
            const urlParts = photo_url.split("/");
            await cloudinary.uploader.destroy(`${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1].split(".")[0]}`).catch(() => {});
        }
        return res.status(400).json({ error: upgradeError.message });
    }

    // 4. Create the store
    const { data: magasin, error: magasinError } = await supabase
      .from("magasin")
      .insert([{
        nom_magasin,
        description,
        photo_url,           // Cloudinary URL
        id_vendeur: userId,
        statut: "nonValide" 
      }])
      .select()
      .single();

    if (magasinError) {
        // Cleanup image if DB insert fails
        if (req.file) {
            const urlParts = photo_url.split("/");
            await cloudinary.uploader.destroy(`${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1].split(".")[0]}`).catch(() => {});
        }
        return res.status(400).json({ error: magasinError.message });
    }

    res.status(201).json({ message: "Store created, role upgraded to vendeur", magasin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMagasin = async (req, res) => {
  try {
    const { id } = req.params; // Can be undefined if coming from /mon-magasin
    const userId = req.user.id;
    const updates = req.body;

    // Find the store either by specific ID or by the logged-in vendor's ID
    let query = supabase.from("magasin").select("id, id_vendeur");
    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("id_vendeur", userId);
    }

    const { data: store, error: fetchError } = await query.single();
    
    if (fetchError || !store) {
      return res.status(404).json({ error: "Magasin introuvable" });
    }

    // Allow owner or admin to update
    if (store.id_vendeur !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Process new image if uploaded
    if (req.file) {
      updates.photo_url = req.file.secure_url || req.file.path;
    }

    // Update the store
    const { data, error } = await supabase
      .from("magasin")
      .update(updates)
      .eq("id", store.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Magasin mis à jour avec succès", magasin: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMagasinByVendeur = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("magasin")
      .select(`*, produit ( id, nom_produit, prix, qte_dispo )`)
      .eq("id_vendeur", id)
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ magasin: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ADMIN & PUBLIC ROUTES
// ==========================================

exports.getAllMagasins = async (req, res) => {
  try {
    const { data: magasins, error } = await supabase.from("magasin").select("*");
    if (error) return res.status(400).json({ error: error.message });

    const enriched = await Promise.all(
      magasins.map(async magasin => {
        const { data: utilisateur } = await supabase
          .from("utilisateur").select("nom_utilisateur, email, photo_url").eq("id", magasin.id_vendeur).single();
        return { ...magasin, vendeur_nom: utilisateur?.nom_utilisateur ?? null, vendeur_email: utilisateur?.email ?? null, vendeur_photo: utilisateur?.photo_url ?? null };
      })
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMagasinStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!["actif", "suspendu", "nonValide", "fermer"].includes(statut)) {
      return res.status(400).json({ error: "Invalid statut" });
    }

    // Get current store info before updating (for notification)
    const { data: currentStore } = await supabase
      .from("magasin").select("id_vendeur, nom_magasin, statut").eq("id", id).single();

    const { data, error } = await supabase
      .from("magasin").update({ statut }).eq("id", id).select();
      
    if (error) return res.status(400).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Magasin not found or access denied" });

    // 🔔 AUTO-NOTIFICATION: notify vendor when store status changes
    if (currentStore && currentStore.statut !== statut) {
      await onStoreStatusChanged(currentStore.id_vendeur, currentStore.nom_magasin, statut).catch(() => {});
    }

    res.json({ message: "Magasin statut updated", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.suspendMagasin = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: currentStore } = await supabase
      .from("magasin").select("id_vendeur, nom_magasin").eq("id", id).single();

    const { data, error } = await supabase
      .from("magasin").update({ statut: "suspendu" }).eq("id", id).select().single();
      
    if (error || !data) return res.status(404).json({ error: "Magasin not found" });

    // 🔔 AUTO-NOTIFICATION
    if (currentStore) {
      await onStoreStatusChanged(currentStore.id_vendeur, currentStore.nom_magasin, "suspendu").catch(() => {});
    }

    res.status(200).json({ message: "Magasin suspendu avec succès", magasin: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingStores = async (req, res) => {
  try {
    const { data, error } = await supabase.from("magasin").select("*").eq("statut", "nonValide");
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ stores: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};