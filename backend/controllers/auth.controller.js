const { createClient } = require("@supabase/supabase-js");
const supabase = require("../db");

function createAuthClient() {
  return createClient(
    process.env.SUPABASE_URL?.trim(),
    (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

exports.registerUser = async (req, res) => {
  try {
    const { email, password, username, role = "client", storeName, storeDescription } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password and username are required" });
    }

    if (role === "vendeur" && !storeName) {
      return res.status(400).json({ error: "Store name is required for vendor registration" });
    }

    if (!["client", "vendeur", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const authClient = createAuthClient();
    const { data, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: { nom_utilisateur: username }
      }
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const user = data.user;
    if (!user) return res.status(400).json({ error: "Signup failed, no user returned" });

    if (role === "vendeur") {
      // 1. Upgrade role
      const { error: upgradeError } = await supabase.rpc("upgrade_to_vendeur", {
        user_id: user.id
      });
      if (upgradeError) return res.status(400).json({ error: upgradeError.message });

      // 2. Create pending store
      const { error: magasinError } = await supabase
        .from("magasin")
        .insert([{
          nom_magasin: storeName,
          description: storeDescription || "",
          id_vendeur: user.id,
          statut: "nonValide"
        }]);

      if (magasinError) {
        console.error("Store Creation Error:", magasinError);
      }
    }

    if (role === "admin") {
      const { error: adminError } = await supabase
        .from("admin")
        .insert([{ id: user.id }]);
      if (adminError) return res.status(400).json({ error: adminError.message });

      await supabase
        .from("utilisateur")
        .update({ role: "admin" })
        .eq("id", user.id);
    }

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
      email: user.email,
      role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.signInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });

    const { data: profile, error: profileError } = await supabase
      .from("utilisateur")
      .select("role, nom_utilisateur, photo_url")
      .eq("id", data.user.id)
      .single();

    if (profileError) return res.status(400).json({ error: profileError.message });

    res.status(200).json({
      message: "Signed in successfully",
      userId: data.user.id,
      email: data.user.email,
      role: profile.role,
      nomUtilisateur: profile.nom_utilisateur,
      photoUrl: profile.photo_url,
      session: data.session
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.signOutUser = async (req, res) => {
  try {
    res.status(200).json({ message: "Signed out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
