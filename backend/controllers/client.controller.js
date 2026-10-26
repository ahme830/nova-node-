
const supabase = require("../db");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const photoUrl = req.file.secure_url || req.file.path;
    if (!photoUrl) {
      return res.status(500).json({ error: "Failed to resolve uploaded image URL" });
    }

    // Save the returned URL to the utilisateur table
    const { data, error } = await supabase
      .from("utilisateur")
      .update({ photo_url: photoUrl })
      .eq("id", req.user.id)
      .select("photo_url")
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Profile picture updated", photo_url: data.photo_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getAllClients = async (req, res) => {
  try {
    // Get all users with their client info for admin dashboard
    const { data, error } = await supabase
      .from("utilisateur")
      .select(`
        id,
        email,
        nom_utilisateur,
        role,
        date_creation,
        photo_url,
        client (
          statut
        )
      `)
      .order("date_creation", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Flatten the response for frontend consumption
    const users = (data || []).map(u => ({
      id: u.id,
      email: u.email,
      nom_utilisateur: u.nom_utilisateur,
      role: u.role,
      date_creation: u.date_creation,
      photo_url: u.photo_url,
      statut: u.client?.[0]?.statut || u.client?.statut || 'actif',
    }));

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateClientStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!["actif", "suspendu", "banni"].includes(statut)) {
      return res.status(400).json({ error: "Invalid statut value" });
    }

    const { data, error } = await supabase
      .from("client")
      .update({ statut })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Client statut updated", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user role in utilisateur table (for admin user management)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["client", "vendeur", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role value" });
    }

    const { data, error } = await supabase
      .from("utilisateur")
      .update({ role })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "User role updated", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("client")
      .select(`
        id,
        statut,
        utilisateur (
          email,
          nom_utilisateur,
          role,
          date_creation
        )
      `)
      .eq("id", id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("utilisateur")
      .select(`
        id, 
        email, 
        nom_utilisateur, 
        date_creation, 
        role, 
        photo_url,
        client (
          statut,
          adresse (
            id,
            numero_rue,
            nom_rue,
            complement_adresse,
            code_postal,
            ville,
            region,
            pays
          )
        )
      `)
      .eq("id", req.user.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Formatting to avoid deeply nested objects in the response
    const formattedProfile = {
      id: data.id,
      email: data.email,
      nom_utilisateur: data.nom_utilisateur,
      date_creation: data.date_creation,
      role: data.role,
      photo_url: data.photo_url,
      // Accessing statut through client
      statut: data.client?.[0]?.statut || data.client?.statut || null,
      // Accessing adresse through client
      adresse: data.client?.[0]?.adresse?.[0] || data.client?.adresse?.[0] || null
    };

    res.status(200).json({ profile: formattedProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
exports.updateProfile = async (req, res) => {
  try {
    const { nom_utilisateur, telephone, adresse } = req.body;
 
    const updates = {};
    if (nom_utilisateur) updates.nom_utilisateur = nom_utilisateur;
    if (telephone)       updates.telephone = telephone;
    if (adresse)         updates.adresse = adresse;
 
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
 
    const { data, error } = await supabase
      .from("utilisateur")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();
 
    if (error) return res.status(400).json({ error: error.message });
 
    res.status(200).json({ message: "Profile updated successfully", profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 exports.changePassword = async (req, res) => {
  try {
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: new_password
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

 
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
 
    // Delete from auth.users will cascade — but only Supabase admin key can do this
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return res.status(400).json({ error: error.message });
 
    res.status(200).json({ message: "Client supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};