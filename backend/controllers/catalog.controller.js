// --- catalog.controller.js ---
const supabase = require("../db");

// 1. Create a new Category (e.g., "Vêtements", "Électronique")
exports.createCategorie = async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ error: "Le nom de la catégorie est requis" });
    }

    const { data, error } = await supabase
      .from("categorie")
      .insert([{ nom: nom.trim() }])
      .select()
      .single();

    // Catch uniqueness errors (if category already exists)
    if (error) {
      if (error.code === '23505') { // Postgres unique violation code
        return res.status(400).json({ error: "Cette catégorie existe déjà" });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Catégorie créée avec succès", categorie: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- catalog.controller.js ---

exports.createType = async (req, res) => {
  try {
    const { nom, nom_categorie } = req.body;

    // 1. Validate inputs
    if (!nom || nom.trim() === "") {
      return res.status(400).json({ error: "Le nom du type est requis" });
    }
    if (!nom_categorie || nom_categorie.trim() === "") {
      return res.status(400).json({ error: "Le nom de la catégorie parente est requis" });
    }

    // 2. Find the category ID using the category name
    const { data: category, error: catError } = await supabase
      .from("categorie")
      .select("id")
      .eq("nom", nom_categorie.trim())
      .single();

    // If Supabase can't find a category with that exact name, it throws an error
    if (catError || !category) {
      return res.status(404).json({ 
        error: `La catégorie '${nom_categorie}' n'existe pas. Veuillez la créer d'abord.` 
      });
    }

    // 3. Insert the new type using the retrieved category ID
    const { data, error } = await supabase
      .from("type")
      .insert([{ 
        nom: nom.trim(), 
        id_categorie: category.id 
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Type créé avec succès", type: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- catalog.controller.js (Suite) ---

// 3. Get all Categories (with their nested types)
exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categorie")
      .select(`
        id, 
        nom,
        type ( id, nom ) 
      `)
      .order("nom", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Update/Edit a Category
exports.updateCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ error: "Le nouveau nom de la catégorie est requis" });
    }

    const { data, error } = await supabase
      .from("categorie")
      .update({ nom: nom.trim() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // Catch uniqueness error if they rename it to an existing category
      if (error.code === '23505') { 
        return res.status(400).json({ error: "Une catégorie avec ce nom existe déjà" });
      }
      return res.status(400).json({ error: error.message });
    }

    if (!data) return res.status(404).json({ error: "Catégorie non trouvée" });

    res.status(200).json({ message: "Catégorie mise à jour avec succès", categorie: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Delete a Category
exports.deleteCategorie = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("categorie")
      .delete()
      .eq("id", id);

    if (error) {
      // Catch Foreign Key violation error (e.g., Types are still linked to this Category)
      if (error.code === '23503') {
        return res.status(400).json({ 
          error: "Impossible de supprimer cette catégorie car elle contient des types. Veuillez d'abord supprimer ou déplacer les types associés." 
        });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Catégorie supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// --- catalog.controller.js (Suite) ---

// 1. Get all Types (with their parent category)
exports.getTypes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("type")
      .select(`
        id, 
        nom,
        categorie:id_categorie ( id, nom )
      `)
      .order("nom", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ types: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Update/Edit a Type
exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, nom_categorie } = req.body;

    let updateData = {};

    if (nom && nom.trim() !== "") {
      updateData.nom = nom.trim();
    }

    // If the admin wants to move this type to a different category
    if (nom_categorie && nom_categorie.trim() !== "") {
      const { data: category, error: catError } = await supabase
        .from("categorie")
        .select("id")
        .eq("nom", nom_categorie.trim())
        .single();

      if (catError || !category) {
        return res.status(404).json({ 
          error: `La catégorie '${nom_categorie}' n'existe pas.` 
        });
      }
      updateData.id_categorie = category.id;
    }

    // If nothing was sent to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Aucune donnée de mise à jour fournie" });
    }

    const { data, error } = await supabase
      .from("type")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Type non trouvé" });

    res.status(200).json({ message: "Type mis à jour avec succès", type: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Delete a Type
exports.deleteType = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("type")
      .delete()
      .eq("id", id);

    if (error) {
      // Catch Foreign Key violation error (e.g., Products are still linked to this Type)
      if (error.code === '23503') {
        return res.status(400).json({ 
          error: "Impossible de supprimer ce type car des produits y sont associés. Veuillez d'abord supprimer ou réassigner ces produits." 
        });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Type supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};