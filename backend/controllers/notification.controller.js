const supabase = require("../db");

// NOTE: The `notification` table has no `lu` (read) column in the current schema.
// If you want mark-as-read, run this migration first:
//   ALTER TABLE public.notification ADD COLUMN lu boolean NOT NULL DEFAULT false;
// The controller is written assuming that column will be added.

exports.getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notification")
      .select("id, contenu, date, lu")
      .eq("id_client", req.user.id)
      .order("date", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const non_lues = data.filter(n => !n.lu).length;

    res.status(200).json({ notifications: data, non_lues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("notification")
      .update({ lu: true })
      .eq("id", id)
      .eq("id_client", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from("notification")
      .update({ lu: true })
      .eq("id_client", req.user.id)
      .eq("lu", false);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Toutes les notifications marquées comme lues" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};