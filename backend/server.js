require("dotenv").config();
const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/auth.routes");
const clientRoutes = require('./routes/client.routes');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const magasinRoutes = require("./routes/magasin.routes");
const produitRoutes =require("./routes/produit.routes");
const panierRoutes =require("./routes/panier.routes");
const commandeRoutes = require("./routes/commande.routes");
const favorisRoutes = require("./routes/favoris.routes");
const avisRoutes = require("./routes/avis.routes");
const notificationRoutes = require("./routes/notification.route");
const signalementRoutes = require("./routes/signalement.routes");
const adresseRoutes = require("./routes/adresse.routes");
const predictionRoutes = require("./routes/prediction.routes");
const adminRoutes        = require("./routes/admin.routes");
const catalogRoutes = require("./routes/catalog.routes");
const chatRoutes = require("./routes/chat.routes");
const contactRoutes = require("./routes/contact.routes");

const app = express();
const PORT = process.env.PORT || 5001;

// Configuration CORS unifiée
app.use(cors({
    origin: '*', // Accepts requests from any origin (including your Live Server)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] // Explicitly allows your JWT token header!
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(` ${req.method} ${req.originalUrl}`);
  console.log(` Body:`, req.body ? JSON.stringify(req.body, null, 2) : 'EMPTY');
  console.log('---');
  next();
});

app.get("/", (req, res) => {
  console.log(' ROOT ROUTE HIT');
  res.send("Backend is working");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "nova-node-api" });
});

app.use("/api/auth", (req, res, next) => {
  console.log(' AUTH ROUTES HIT:', req.method, req.path);
  next();
}, authRoutes);

app.use("/api/clients", (req, res, next) => {
  console.log(' CLIENT ROUTES HIT:', req.method, req.path);
  next();
}, clientRoutes);

app.use("/api/utilisateurs", (req, res, next) => {
  console.log(' UTILISATEUR ROUTES HIT:', req.method, req.path);
  next();
}, utilisateurRoutes);

app.use("/api/magasins", magasinRoutes);
app.use("/api/magasin",  magasinRoutes);

app.use("/api/produits", produitRoutes);
app.use("/api/produit",  produitRoutes);

app.use("/api/paniers",  panierRoutes);
app.use("/api/panier",   panierRoutes);

app.use("/api/commandes", commandeRoutes);
app.use("/api/commande",  commandeRoutes);

app.use("/api/favoris", favorisRoutes);
app.use("/api/avis", avisRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/notification",  notificationRoutes);

app.use("/api/signalements", signalementRoutes);
app.use("/api/signalement",  signalementRoutes);

app.use("/api/adresses", adresseRoutes);
app.use("/api/adresse",  adresseRoutes);

app.use("/api/predictions", predictionRoutes);
app.use("/api/prediction",  predictionRoutes);

app.use("/api/admin",         adminRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  console.log(' 404 NOT FOUND:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found', url: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.message);
  console.error(' STACK:', err.stack);
  res.status(500).json({ 
    error: 'Server error', 
    details: err.message || 'Unknown error'
  });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(` Server running on http://0.0.0.0:${PORT}`);
    console.log(' Debug mode: ACTIVE');
  });
}

module.exports = app;