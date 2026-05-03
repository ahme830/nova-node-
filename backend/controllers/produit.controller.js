const supabase = require("../db");
const { cloudinary } = require("../middleware/upload");

exports.searchProduits = async (req, res) => {
  try {
    const { search, categorie, minPrice, maxPrice, sortBy, inStock, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("produit")
      .select(`
        *,
        type!inner (
          nom,
          categorie!inner ( nom )
        ),
        magasin (
          nom_magasin,
          statut
        )
      `, { count: "exact" });

    // Filter by search string on nom_produit, description, or type
    if (search) {
      // First, check if the search term matches any 'type' (e.g. "carte graphique")
      const { data: matchedTypes } = await supabase
        .from('type')
        .select('id')
        .ilike('nom', `%${search}%`);
        
      const typeIds = matchedTypes?.map(t => t.id) || [];
      
      if (typeIds.length > 0) {
        query = query.or(`nom_produit.ilike.%${search}%,description.ilike.%${search}%,id_type.in.(${typeIds.join(',')})`);
      } else {
        query = query.or(`nom_produit.ilike.%${search}%,description.ilike.%${search}%`);
      }
    }

    if (categorie) {
      const catList = categorie.split(',');
      query = query.in("type.categorie.nom", catList);
    }

    // Filter by price range
    if (minPrice) {
      query = query.gte("prix", parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte("prix", parseFloat(maxPrice));
    }

    // Filter by availability
    if (inStock === 'true') {
      query = query.gt("qte_dispo", 0);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        query = query.order("prix", { ascending: true });
        break;
      case 'price-desc':
        query = query.order("prix", { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order("date_ajout", { ascending: false });
        break;
    }

    const { data, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({
      produits: data,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProduitById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("produit")
      .select(`
        id,
        nom_produit,
        description,
        prix,
        qte_dispo,
        image_url,
        date_ajout,
        type (
          nom,
          categorie ( nom )
        ),
        magasin ( 
          id, 
          nom_magasin, 
          description 
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Produit not found" });

    const { data: avisData } = await supabase
      .from("avis")
      .select("note")
      .eq("id_produit", id); 

    const nb_avis = avisData?.length || 0;
    const avgNote = nb_avis > 0
        ? (avisData.reduce((sum, a) => sum + a.note, 0) / nb_avis).toFixed(1)
        : null;

    res.status(200).json({ 
      produit: { 
        ...data, 
        note_moyenne: avgNote, 
        nb_avis: nb_avis 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduit = async (req, res) => {
  try {
    const { id } = req.params;

    // --- 🛡️ SECURITY CHECK START ---
    const { data: produit, error: fetchError } = await supabase
      .from("produit")
      .select("image_url, id_magasin")
      .eq("id", id)
      .single();

    if (fetchError || !produit) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    const { data: magasinCheck, error: magError } = await supabase
      .from("magasin")
      .select("id_vendeur")
      .eq("id", produit.id_magasin)
      .single();

    if (magError || !magasinCheck || magasinCheck.id_vendeur !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé : vous ne possédez pas ce magasin." });
    }
    // --- 🛡️ SECURITY CHECK END ---

    // Clean up Cloudinary if an image exists
    if (produit.image_url) {
      try {
        const urlParts = produit.image_url.split("/");
        const folder = urlParts[urlParts.length - 2]; 
        const fileName = urlParts[urlParts.length - 1].split(".")[0]; 
        const publicId = `${folder}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error("Cloudinary Cleanup Failed:", cloudErr.message);
      }
    }

    // Delete from related tables
    await Promise.all([
      supabase.from("item").delete().eq("id_produit", id),
      supabase.from("favoriser").delete().eq("id_produit", id),
      supabase.from("avis").delete().eq("id_produit", id),
      supabase.from("signalement").delete().eq("id_produit", id),
      supabase.from("ligne_commande").delete().eq("id_produit", id)
    ]);

    // Final Database deletion
    const { error: deleteError } = await supabase
      .from("produit")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: "Produit et image supprimés avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProduit = async (req, res) => {
  try {
    const { nom_produit, description, prix, qte_dispo, id_type, id_magasin } = req.body;
    
    // 1. Basic validation
    if (!nom_produit || !prix || !qte_dispo || !id_magasin || !id_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- 🛡️ SECURITY CHECK START ---
    const { data: magasinCheck, error: magError } = await supabase
      .from("magasin")
      .select("id_vendeur")
      .eq("id", id_magasin)
      .single();

    if (magError || !magasinCheck || magasinCheck.id_vendeur !== req.user.id) {
      if (req.file) {
        const image_url = req.file.secure_url || req.file.path;
        const urlParts = image_url.split("/");
        const folder = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1].split(".")[0];
        await cloudinary.uploader.destroy(`${folder}/${fileName}`).catch(() => {});
      }
      return res.status(403).json({ error: "Accès refusé : vous ne possédez pas ce magasin." });
    }
    // --- 🛡️ SECURITY CHECK END ---

    // 3. Process the image URL
    let image_url = req.body.image_url || null; 
    if (req.file) {
        image_url = req.file.secure_url || req.file.path || null;
    }

    // 4. Insert into Database
    const { data, error } = await supabase
      .from("produit")
      .insert([
        {
          nom_produit,
          description: description || '',
          prix: parseFloat(prix),
          qte_dispo: parseInt(qte_dispo),
          image_url: image_url,
          id_type: id_type,    
          id_magasin: id_magasin,
          date_ajout: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "Produit ajouté avec succès", produit: data[0] });
  } catch (err) {
    console.error("Upload Error Details:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // --- 🛡️ SECURITY CHECK START ---
    const { data: produitCheck, error: checkError } = await supabase
      .from("produit")
      .select("id_magasin")
      .eq("id", id)
      .single();

    if (checkError || !produitCheck) return res.status(404).json({ error: "Produit introuvable" });

    const { data: magasinCheck, error: magError } = await supabase
      .from("magasin")
      .select("id_vendeur")
      .eq("id", produitCheck.id_magasin)
      .single();

    if (magError || !magasinCheck || magasinCheck.id_vendeur !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé : vous ne possédez pas ce magasin." });
    }
    // --- 🛡️ SECURITY CHECK END ---

    // Process image update if a new file is uploaded
    if (req.file) {
        updates.image_url = req.file.secure_url || req.file.path;
    }

    // Format numbers
    if (updates.prix) updates.prix = parseFloat(updates.prix);
    if (updates.qte_dispo) updates.qte_dispo = parseInt(updates.qte_dispo);

    const { data, error } = await supabase
      .from("produit")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Produit mis à jour avec succès", produit: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all products for a specific store
exports.getByMagasin = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("produit")
      .select(`
        id,
        nom_produit,
        description,
        prix,
        qte_dispo,
        image_url,
        date_ajout,
        type (
          nom,
          categorie ( nom )
        ),
        magasin (
          nom_magasin
        )
      `)
      .eq("id_magasin", id)
      .order("date_ajout", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ produits: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get recommendations based on history
exports.getRecommendations = async (req, res) => {
  try {
    const { viewedProducts = [], recentSearches = [], viewedCategories = [] } = req.body;
    
    let allMatches = [];

    // 1. Match recent searches
    if (recentSearches.length > 0) {
      const searchTerms = recentSearches.slice(0, 3);
      for (const term of searchTerms) {
        const { data: matchedTypes } = await supabase.from('type').select('id').ilike('nom', `%${term}%`);
        const typeIds = matchedTypes?.map(t => t.id) || [];
        
        let q = supabase.from("produit").select(`*, type(nom, categorie(nom)), magasin(nom_magasin)`).limit(10);
        if (typeIds.length > 0) {
          q = q.or(`nom_produit.ilike.%${term}%,description.ilike.%${term}%,id_type.in.(${typeIds.join(',')})`);
        } else {
          q = q.or(`nom_produit.ilike.%${term}%,description.ilike.%${term}%`);
        }
        
        const { data: searchData } = await q;
        if (searchData) allMatches = allMatches.concat(searchData);
      }
    }

    // 2. Match viewed categories
    if (viewedCategories.length > 0) {
      const { data: catData } = await supabase
        .from("produit")
        .select(`*, type!inner(nom, categorie!inner(nom)), magasin(nom_magasin)`)
        .in('type.categorie.nom', viewedCategories.slice(0, 3))
        .limit(10);
      if (catData) allMatches = allMatches.concat(catData);
    }

    // Remove duplicates and recently viewed
    const uniqueMap = new Map();
    allMatches.forEach(p => {
      if (!viewedProducts.includes(p.id)) {
        uniqueMap.set(p.id, p);
      }
    });

    let finalRecommendations = Array.from(uniqueMap.values());

    // 3. Fallback to newest if not enough
    if (finalRecommendations.length < 4) {
      const { data: fallbackData } = await supabase
        .from("produit")
        .select(`*, type(nom, categorie(nom)), magasin(nom_magasin)`)
        .order("date_ajout", { ascending: false })
        .limit(10);
        
      if (fallbackData) {
        fallbackData.forEach(p => {
          if (!uniqueMap.has(p.id) && !viewedProducts.includes(p.id)) {
            finalRecommendations.push(p);
            uniqueMap.set(p.id, p);
          }
        });
      }
    }

    // Shuffle array (Fisher-Yates) for dynamism
    for (let i = finalRecommendations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalRecommendations[i], finalRecommendations[j]] = [finalRecommendations[j], finalRecommendations[i]];
    }

    res.status(200).json({ recommandations: finalRecommendations.slice(0, 8) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};