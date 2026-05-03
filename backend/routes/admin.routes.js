const express     = require("express");
const router      = express.Router();
const verifyAdmin = require("../middleware/admin.middleware");

const adminCtrl        = require("../controllers/admin.controller");
const statsCtrl       = require("../controllers/stats.controller");
const clientsCtrl     = require("../controllers/client.controller");
const produitsCtrl    = require("../controllers/produit.controller");
const avisCtrl        = require("../controllers/avis.controller");
const commandesCtrl   = require("../controllers/commande.controller");
const magasinsCtrl    = require("../controllers/magasin.controller");
const paiementCtrl    = require("../controllers/paiement.controller");
const predictionsCtrl = require("../controllers/prediction.controller");
const signalementsCtrl = require("../controllers/signalement.controller");
const utilisateurCtrl  = require("../controllers/utilisateur.controller");

// All admin routes require admin token
router.use(verifyAdmin);

// ── Stats ─────────────────────────────────────────────────────
router.get("/stats", statsCtrl.getStats);

// ── Predictions ───────────────────────────────────────────────
router.get("/predictions", predictionsCtrl.getAllPredictions);

// ── Users Management ─────────────────────────────────────────
router.get("/users",            utilisateurCtrl.getAllUtilisateurs);
router.patch("/users/:id/role", clientsCtrl.updateUserRole); 
router.delete("/users/:id",     utilisateurCtrl.deleteUtilisateur);
// ── Stores Management ─────────────────────────────────────────
router.get("/stores/pending",   magasinsCtrl.getPendingStores);
router.patch("/stores/:id/validate", magasinsCtrl.updateMagasinStatut);

// ── Clients ───────────────────────────────────────────────────
//router.get("/clients",                  clientsCtrl.getClients);
//router.get("/clients/:id",              clientsCtrl.getClientById);
//router.put("/clients/:id/bloquer",      clientsCtrl.bloquerClient);
//router.put("/clients/:id/debloquer",    clientsCtrl.debloquerClient);
//status
router.delete("/clients/:id",           clientsCtrl.deleteClient);

// ── Produits ──────────────────────────────────────────────────
router.get("/produits",                 adminCtrl.getAllProduits);
router.delete("/produits/:id",          adminCtrl.deleteProduit);

// ── Avis ──────────────────────────────────────────────────────
router.get("/avis",                     avisCtrl.getAvis);
router.delete("/avis/:id",              avisCtrl.deleteAvis);

// ── Commandes ─────────────────────────────────────────────────
router.get("/commandes",                adminCtrl.getAllCommandes);
router.delete("/commandes/:id",         adminCtrl.deleteCommande);

// ── Magasins ──────────────────────────────────────────────────
//router.get("/magasins",                 magasinsCtrl.getMagasins);
//router.put("/magasins/:id/valider",     magasinsCtrl.validerMagasin);
//router.put("/magasins/:id/suspendre",   magasinsCtrl.suspendMagasin);
//status

// ── Paiement vendeur ──────────────────────────────────────────
router.get("/vendeurs/:id_vendeur/revenue",    paiementCtrl.getVendeurRevenue);
router.get("/vendeurs/:id_vendeur/paiements",  paiementCtrl.getHistoriquePaiements);
router.post("/vendeurs/:id_vendeur/payer",     paiementCtrl.payerVendeur);

// ── Signalements ──────────────────────────────────────────────
router.get("/signalements",             signalementsCtrl.getSignalements);
router.delete("/signalements/:id",      signalementsCtrl.deleteSignalement);

module.exports = router;