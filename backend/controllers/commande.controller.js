// controllers/commande.controller.js  (updated with automatic notifications)
const supabase = require("../db");
const { onOrderPlaced, onOrderStatusChanged, notify, NOTIF } = require("../utils/notification.helper");

const STATUTS_EN_COURS   = ["en_cours"];
const STATUTS_HISTORIQUE = ["completer", "annulee"];
const METHODES_VALIDES   = ["carteVisa", "carteDahabia", "paypal", "virement", "cash"];

exports.passerCommande = async (req, res) => {
  try {
    const { id_adrs, methode_paiement } = req.body;

    if (!id_adrs) return res.status(400).json({ error: "id_adrs (adresse de livraison) is required" });
    if (!methode_paiement) return res.status(400).json({ error: "methode_paiement is required" });
    if (!METHODES_VALIDES.includes(methode_paiement)) {
      return res.status(400).json({ error: `methode_paiement must be one of: ${METHODES_VALIDES.join(", ")}` });
    }

    // Verify address belongs to this client
    const { data: adresse, error: adresseError } = await supabase
      .from("adresse")
      .select("id")
      .eq("id", id_adrs)
      .eq("id_client", req.user.id)
      .single();
    if (adresseError || !adresse) return res.status(404).json({ error: "Adresse not found or does not belong to you" });

    // Get cart items
    const { data: items, error: itemsError } = await supabase
      .from("item")
      .select(`qte, prix_at_time, produit:id_produit ( id, nom_produit, qte_dispo )`)
      .eq("id_panier", req.user.id);

    if (itemsError) return res.status(400).json({ error: itemsError.message });
    if (!items || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    // Stock validation
    for (const item of items) {
      if (item.qte > item.produit.qte_dispo) {
        return res.status(400).json({
          error: `Alerte Stock: La quantité demandée pour "${item.produit.nom_produit}" (${item.qte}) dépasse le stock disponible (${item.produit.qte_dispo}). Veuillez ajuster votre panier.`
        });
      }
    }

    const montant_total = parseFloat(
      items.reduce((sum, item) => sum + item.qte * item.prix_at_time, 0).toFixed(2)
    );

    // Create commande
    const { data: commande, error: commandeError } = await supabase
      .from("commande")
      .insert([{ id_client: req.user.id, id_adrs, montant_total, statut_commande: "en_cours" }])
      .select()
      .single();
    if (commandeError) return res.status(400).json({ error: commandeError.message });

    // Insert ligne_commande
    const lignes = items.map(item => ({
      id_commande: commande.id,
      id_produit: item.produit.id,
      qte: item.qte,
      prix_at_time: item.prix_at_time
    }));
    const { error: lignesError } = await supabase.from("ligne_commande").insert(lignes);
    if (lignesError) return res.status(400).json({ error: lignesError.message });

    // Create paiement record
    const { error: paiementError } = await supabase.from("paiement").insert([{
      id_commande: commande.id,
      montant: montant_total,
      methode_paiement,
      statut_paiement: "en_attente"
    }]);
    if (paiementError) return res.status(400).json({ error: paiementError.message });

    // Decrement stock
    for (const item of items) {
      await supabase
        .from("produit")
        .update({ qte_dispo: item.produit.qte_dispo - item.qte })
        .eq("id", item.produit.id);
    }

    // Clear cart
    await supabase.from("item").delete().eq("id_panier", req.user.id);
    await supabase.from("panier").update({ total_panier: 0 }).eq("id_client", req.user.id);

    // 🔔 AUTO-NOTIFICATIONS: notify client + all vendors involved
    await onOrderPlaced(commande, lignes).catch(err =>
      console.error("[passerCommande] Notification error:", err.message)
    );

    res.status(201).json({
      message: "Commande passée avec succès",
      commande_id: commande.id,
      montant_total,
      statut: commande.statut_commande
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommandeById = async (req, res) => {
  try {
    const { id } = req.params;
    let query = supabase
      .from("commande")
      .select(`
        id, statut_commande, montant_total, date_commande,
        adresse:id_adrs ( numero:numero_rue, rue:nom_rue, complement:complement_adresse, code_postal, ville, region, pays ),
        ligne_commande ( qte, prix_at_time, produit:id_produit ( id, nom_produit, image_url ) ),
        livraison ( statut_livraison, numero_suivi, date_expedition, date_livraison ),
        paiement ( methode_paiement, statut_paiement, date_paiement ),
        client:id_client ( user:utilisateur!client_id_fkey ( nom:nom_utilisateur, email ) )
      `)
      .eq("id", id);

    if (req.user.role === 'customer') {
      query = query.eq("id_client", req.user.id);
    }

    const { data, error } = await query.single();

    if (error || !data) return res.status(404).json({ error: "Commande not found" });

    // Map nested user data to order.utilisateur for frontend compatibility
    const formatted = {
      ...data,
      utilisateur: data.client?.user || {}
    };

    res.status(200).json({ commande: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restoreStock = async (commandeId) => {
  try {
    const { data: lignes, error: fetchError } = await supabase
      .from("ligne_commande")
      .select("id_produit, qte")
      .eq("id_commande", commandeId);
    if (fetchError || !lignes) return;
    for (const ligne of lignes) {
      const { data: p, error: pErr } = await supabase
        .from("produit").select("qte_dispo").eq("id", ligne.id_produit).single();
      if (!pErr && p) {
        await supabase.from("produit")
          .update({ qte_dispo: p.qte_dispo + ligne.qte })
          .eq("id", ligne.id_produit);
      }
    }
  } catch (err) {
    console.error("Stock restoration failed:", err);
  }
};

exports.annulerCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: commande, error: fetchError } = await supabase
      .from("commande")
      .select("id, statut_commande, id_client")
      .eq("id", id)
      .eq("id_client", req.user.id)
      .single();
    if (fetchError || !commande) return res.status(404).json({ error: "Commande not found" });

    if (commande.statut_commande !== "en_cours" && commande.statut_commande !== "acceptee") {
      return res.status(400).json({ error: `Cannot cancel a commande with status "${commande.statut_commande}"` });
    }

    const { error } = await supabase.from("commande").update({ statut_commande: "annulee" }).eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    await restoreStock(id);

    // 🔔 AUTO-NOTIFICATION: inform the client
    await notify(commande.id_client, NOTIF.orderCancelled(id)).catch(() => {});

    res.status(200).json({ message: "Commande annulée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistorique = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commande")
      .select(`
        id, statut_commande, montant_total, date_commande,
        adresse:id_adrs ( ville, pays ),
        ligne_commande ( qte, prix_at_time, produit:id_produit ( id, nom_produit, image_url ) )
      `)
      .eq("id_client", req.user.id)
      .in("statut_commande", STATUTS_HISTORIQUE)
      .order("date_commande", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ historique: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommandesEnCours = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("commande")
      .select(`
        id, statut_commande, montant_total, date_commande,
        adresse:id_adrs ( ville, pays ),
        ligne_commande ( qte, prix_at_time, produit:id_produit ( id, nom_produit, image_url ) ),
        livraison ( statut_livraison, numero_suivi )
      `)
      .eq("id_client", req.user.id)
      .in("statut_commande", STATUTS_EN_COURS)
      .order("date_commande", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ commandes_en_cours: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommandes = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from("commande")
      .select(`
        id, statut_commande, montant_total, date_commande,
        client!commande_id_client_fkey ( utilisateur!client_id_fkey ( nom_utilisateur, email ) ),
        adresse:id_adrs ( ville, pays ),
        ligne_commande ( qte, prix_at_time, produit:id_produit ( nom_produit ) ),
        livraison ( statut_livraison, numero_suivi ),
        paiement ( methode_paiement, statut_paiement )
      `, { count: "exact" })
      .order("date_commande", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (statut) query = query.eq("statut_commande", statut);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ commandes: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCommandesByVendeur = async (req, res) => {
  try {
    const vendeurId = req.params.id;

    const { data: magasin, error: magError } = await supabase
      .from("magasin").select("id").eq("id_vendeur", vendeurId).single();
    if (magError || !magasin) return res.status(200).json({ commandes: [] });

    const { data: produits, error: prodError } = await supabase
      .from("produit").select("id").eq("id_magasin", magasin.id);
    if (prodError || !produits || produits.length === 0) return res.status(200).json({ commandes: [] });

    const productIds = produits.map(p => p.id);

    const { data: lignes, error: ligneError } = await supabase
      .from("ligne_commande").select("id_commande").in("id_produit", productIds);
    if (ligneError || !lignes || lignes.length === 0) return res.status(200).json({ commandes: [] });

    const commandeIds = [...new Set(lignes.map(l => l.id_commande))];

    const { data: commandes, error: cmdError } = await supabase
      .from("commande")
      .select(`
        id, statut_commande, montant_total, date_commande,
        client:id_client ( user:utilisateur!client_id_fkey ( nom_utilisateur, email ) ),
        adresse:id_adrs (ville, pays),
        ligne_commande ( qte, prix_at_time, produit:id_produit (id, nom_produit, image_url) )
      `)
      .in("id", commandeIds)
      .order("date_commande", { ascending: false });
    if (cmdError) return res.status(400).json({ error: cmdError.message });

    const formatted = (commandes || []).map(c => {
      const userInfo = c.client?.user || {};
      return { ...c, statut: c.statut_commande, client_nom: userInfo.nom_utilisateur || "Client", client_email: userInfo.email || "", items: c.ligne_commande || [] };
    });

    res.status(200).json({ commandes: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatutCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const validStatuts = ["en_cours", "acceptee", "completer", "annulee"];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ error: `statut must be one of: ${validStatuts.join(", ")}` });
    }

    // Get current status + client info for notifications
    const { data: currentCmd, error: fetchError } = await supabase
      .from("commande")
      .select("statut_commande, id_client")
      .eq("id", id)
      .single();
    if (fetchError || !currentCmd) return res.status(404).json({ error: "Commande not found" });

    const { data, error } = await supabase
      .from("commande")
      .update({ statut_commande: statut })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("[updateStatutCommande] Update error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    // Restore stock if transitioning to annulée
    if (statut === "annulee" && currentCmd.statut_commande !== "annulee") {
      await restoreStock(id);
    }

    // 🔔 AUTO-NOTIFICATION: inform the client of the status change
    await onOrderStatusChanged(id, statut, currentCmd.id_client).catch(() => {});

    res.status(200).json({ message: "Statut updated", commande: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};