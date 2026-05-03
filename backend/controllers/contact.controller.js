const supabase = require("../db");

exports.sendContactMessage = async (req, res) => {
  try {
    const { nom, email, sujet, message } = req.body;

    if (!nom || !email || !sujet || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const { data, error } = await supabase
      .from("contact")
      .insert([{ 
        nom, 
        email, 
        sujet, 
        message,
        date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("[sendContactMessage] Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Message envoyé avec succès", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("contact")
      .select("*")
      .order("date", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ messages: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("contact").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: "Message supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
