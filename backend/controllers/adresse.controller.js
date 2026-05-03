const supabase = require("../db");

exports.getAdresses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("adresse")
      .select("id, numero_rue, nom_rue, complement_adresse, code_postal, ville, region, pays")
      .eq("id_client", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ adresses: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAdresse = async (req, res) => {
  try {
    const { numero_rue, nom_rue, complement_adresse, code_postal, ville, region, pays } = req.body;

    if (!nom_rue || !code_postal || !ville || !pays) {
      return res.status(400).json({ error: "nom_rue, code_postal, ville, and pays are required" });
    }

    const { data, error } = await supabase
      .from("adresse")
      .insert([{
        id_client: req.user.id,
        numero_rue:          numero_rue          ?? null,
        nom_rue,
        complement_adresse:  complement_adresse  ?? null,
        code_postal,
        ville,
        region:              region              ?? null,
        pays
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Adresse ajoutée", adresse: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAdresse = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("adresse")
      .delete()
      .eq("id", id)
      .eq("id_client", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Adresse supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};