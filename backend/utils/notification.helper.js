// utils/notification.helper.js
// Automatically creates notifications in the DB.
// Import and call these from any controller that needs to notify users.

const supabase = require("../db");

/**
 * Create a single notification for one user.
 */
const notify = async (id_client, contenu) => {
  try {
    const { error } = await supabase
      .from("notification")
      .insert([{ id_client, contenu }]);
    if (error) console.error("[notify] Insert error:", error.message);
  } catch (err) {
    console.error("[notify] Unexpected error:", err.message);
  }
};

/**
 * Notify multiple users at once.
 */
const notifyMany = async (notifications) => {
  // notifications = [{ id_client, contenu }, ...]
  try {
    if (!notifications || notifications.length === 0) return;
    const { error } = await supabase.from("notification").insert(notifications);
    if (error) console.error("[notifyMany] Insert error:", error.message);
  } catch (err) {
    console.error("[notifyMany] Unexpected error:", err.message);
  }
};

/**
 * Resolve the vendor's user ID from a product ID.
 * Used to notify the vendor when their product is ordered.
 */
const getVendeurIdFromProduct = async (id_produit) => {
  try {
    const { data, error } = await supabase
      .from("produit")
      .select("magasin!inner(id_vendeur)")
      .eq("id", id_produit)
      .single();
    if (error || !data) return null;
    return data.magasin?.id_vendeur || null;
  } catch {
    return null;
  }
};

// ─── Pre-built notification messages ────────────────────────────────────────

const NOTIF = {
  // Client notifications
  orderPlaced: (total, currency = "DZD") =>
    `✅ Votre commande de ${parseFloat(total).toLocaleString("fr-DZ")} ${currency} a été passée avec succès. Nous la traitons dès maintenant.`,

  orderAccepted: (orderId) =>
    `🏪 Votre commande #${String(orderId).substring(0, 8).toUpperCase()} a été acceptée par le vendeur.`,

  orderCompleted: (orderId) =>
    `🎉 Votre commande #${String(orderId).substring(0, 8).toUpperCase()} a été livrée. Merci de votre confiance !`,

  orderCancelled: (orderId) =>
    `❌ Votre commande #${String(orderId).substring(0, 8).toUpperCase()} a été annulée. Votre stock a été restitué.`,

  orderCancelledByAdmin: (orderId) =>
    `⚠️ Votre commande #${String(orderId).substring(0, 8).toUpperCase()} a été annulée par l'administration.`,

  // Vendor notifications
  newOrderReceived: (orderId, itemCount, total) =>
    `🛒 Nouvelle commande #${String(orderId).substring(0, 8).toUpperCase()} reçue — ${itemCount} article(s) — ${parseFloat(total).toLocaleString("fr-DZ")} DZD. Traitez-la dès que possible.`,

  orderCancelledByClient: (orderId) =>
    `↩️ La commande #${String(orderId).substring(0, 8).toUpperCase()} a été annulée par le client. Le stock a été restitué.`,

  // Store notifications
  storeApproved: (storeName) =>
    `🎊 Félicitations ! Votre magasin "${storeName}" a été validé. Vous pouvez maintenant mettre en ligne vos produits.`,

  storeSuspended: (storeName) =>
    `⛔ Votre magasin "${storeName}" a été suspendu par l'administration. Contactez-nous pour plus d'informations.`,
};

// ─── High-level helpers ──────────────────────────────────────────────────────

/**
 * Called when a client places an order.
 * Notifies the client + each distinct vendor.
 */
const onOrderPlaced = async (commande, lignes) => {
  // Notify client
  await notify(commande.id_client, NOTIF.orderPlaced(commande.montant_total));

  // Notify each vendor who has products in this order
  const vendeurSet = new Set();
  for (const ligne of lignes) {
    const vendeurId = await getVendeurIdFromProduct(ligne.id_produit);
    if (vendeurId && !vendeurSet.has(vendeurId)) {
      vendeurSet.add(vendeurId);
      await notify(
        vendeurId,
        NOTIF.newOrderReceived(commande.id, lignes.length, commande.montant_total)
      );
    }
  }
};

/**
 * Called when an order status changes.
 * Notifies the client (and potentially the vendor).
 */
const onOrderStatusChanged = async (commandeId, newStatus, clientId, vendeurId = null) => {
  const shortId = commandeId;

  switch (newStatus) {
    case "acceptee":
      await notify(clientId, NOTIF.orderAccepted(shortId));
      break;
    case "completer":
      await notify(clientId, NOTIF.orderCompleted(shortId));
      break;
    case "annulee":
      await notify(clientId, NOTIF.orderCancelled(shortId));
      if (vendeurId) {
        await notify(vendeurId, NOTIF.orderCancelledByClient(shortId));
      }
      break;
    default:
      break;
  }
};

/**
 * Called when admin validates or suspends a store.
 */
const onStoreStatusChanged = async (vendeurId, storeName, newStatus) => {
  if (newStatus === "actif") {
    await notify(vendeurId, NOTIF.storeApproved(storeName));
  } else if (newStatus === "suspendu") {
    await notify(vendeurId, NOTIF.storeSuspended(storeName));
  }
};

module.exports = {
  notify,
  notifyMany,
  onOrderPlaced,
  onOrderStatusChanged,
  onStoreStatusChanged,
  NOTIF,
};