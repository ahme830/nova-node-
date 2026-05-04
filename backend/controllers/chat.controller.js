// controllers/chat.controller.js
// Proxies chat requests to the Google Gemini API (Free Tier)
// Add GEMINI_API_KEY to your .env file

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using Gemini 3.1 Flash Lite - optimized for speed and free tier usage
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Tu es l'Assistant NOVA NODE, un expert technique et conseiller de vente intégré à la marketplace NOVA NODE. Ton objectif est d'aider les utilisateurs à trouver et choisir le bon matériel informatique.

## Règle Absolue (STRICTE)
Ton domaine d'expertise se limite EXCLUSIVEMENT à l'informatique (composants PC, ordinateurs portables, périphériques, réseaux, logiciels) et au processus d'achat sur le site NOVA NODE (commandes, panier, etc.).
Si l'utilisateur te pose une question HORS de ce domaine (par exemple: la politique, la cuisine, la météo, le sport, les blagues générales, l'histoire, la géographie, etc.), tu DOIS OBLIGATOIREMENT REFUSER de répondre poliment, en disant que tu es un assistant spécialisé en informatique et que tu ne peux pas répondre à cette question. N'essaie jamais de contourner cette règle.

## Ton rôle
Tu aides les utilisateurs avec :
- Le choix de composants informatiques (ex: quelle carte graphique pour du montage vidéo ?)
- La vérification de compatibilité entre les pièces (ex: cette carte mère est-elle compatible avec ce processeur ?)
- Des conseils d'achat sur les produits informatiques et les périphériques
- Le processus de commande et les questions générales sur le site NOVA NODE (panier, paiement, livraison)

## Informations clés sur NOVA NODE
**Devise :** Dinar Algérien (DZD)

**Méthodes de paiement acceptées :**
- Carte Visa, Carte Dahabia (CCP), PayPal, Virement bancaire, Cash (paiement à la livraison)

**Options de livraison :**
- Standard Logistics : Gratuit (3-5 jours)
- Warp Transfer (Express) : 1500 DZD (1-2 jours)
- NOVA NODE Prime Instant : 3500 DZD (livraison le jour même)

## Directives de communication
- Sois concis, professionnel et apporte une vraie valeur technique.
- Réponds TOUJOURS dans la langue de l'utilisateur (Français, Anglais ou Arabe).
- Si tu ne sais pas, dis-le clairement. Ne donne pas de fausses informations techniques.

## Actions interactives (IMPORTANT)
Si tu recommandes un produit précis ou une recherche filtrée, tu DOIS ajouter à la fin de ton message un bloc JSON entouré par trois backticks et json contenant les paramètres de recherche.
ATTENTION : Le paramètre "query" doit être EXTRÊMEMENT GÉNÉRIQUE (1 ou 2 mots-clés simples maximum, ex: "macbook", "rtx", "clavier").
Il est TRÈS IMPORTANT d'utiliser le paramètre "categorie" avec EXACTEMENT l'une des valeurs suivantes si tu veux filtrer par catégorie :
- "Audio & Son"
- "Informatique"
- "laptops"
- "Périphériques & Accessoires"
- "Périphériques Gaming"
- "Smartphones & Mobiles"

Exemple de bloc JSON généré si tu conseilles une carte graphique Nvidia RTX :
\`\`\`json
{
  "action": "search",
  "label": "Rechercher cartes graphiques RTX",
  "query": "rtx",
  "categorie": "Informatique",
  "minPrice": 0,
  "maxPrice": 200000
}
\`\`\`
Ne mets qu'un seul bloc d'action par message, et uniquement si c'est pertinent.`;

exports.chat = async (req, res) => {
  try {
    const { messages, userContext, language } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Build dynamic system prompt with user context
    let fullSystemInstruction = SYSTEM_PROMPT;
    if (userContext) {
      fullSystemInstruction += `\n\n## Contexte utilisateur actuel\nNom : ${userContext.name}\nRôle : ${userContext.role}`;
      if (userContext.role === "vendeur") {
        fullSystemInstruction += `\nCet utilisateur est un vendeur — aide-le avec la gestion de son magasin, ses produits et ses commandes.`;
      }
    }
    if (language) {
      const langMap = { fr: "Français", en: "English", ar: "Arabe" };
      fullSystemInstruction += `\n\nLangue préférée de l'utilisateur : ${langMap[language] || language}. Réponds dans cette langue.`;
    }

    if (!GEMINI_API_KEY) {
      // Fallback if no API key — smart rule-based responses
      return res.json({ reply: getFallbackReply(messages[messages.length - 1]?.content || "") });
    }

    // Format messages for Gemini API
    // Gemini uses { role: "user" | "model", parts: [{ text: "..." }] }
    const contents = messages.slice(-15).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Call Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: fullSystemInstruction }]
        },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("[chat] Gemini API error:", err);
      return res.json({ reply: getFallbackReply(messages[messages.length - 1]?.content || "") });
    }

    const data = await response.json();
    
    // Extract text from Gemini response structure
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text 
                || "Je suis désolé, je ne peux pas répondre pour le moment.";

    res.json({ reply });
  } catch (err) {
    console.error("[chat] Error:", err.message);
    res.status(500).json({ 
      error: "Chat service unavailable", 
      reply: "Le service de chat est temporairement indisponible. Veuillez contacter support@nova-node-prime.net" 
    });
  }
};

// Smart fallback when no API key is configured or API fails
function getFallbackReply(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes("commande") || msg.includes("order")) {
    return "Pour passer une commande sur NOVA NODE :\n1. Ajoutez des produits à votre panier\n2. Accédez au panier et cliquez sur 'Passer commande'\n3. Choisissez votre adresse de livraison\n4. Sélectionnez votre méthode de livraison\n5. Confirmez avec votre mode de paiement préféré\n\nBesoin d'aide supplémentaire ? Contactez-nous à contact@nova-node-prime.net";
  }

  if (msg.includes("paiement") || msg.includes("payment") || msg.includes("dahabia") || msg.includes("visa")) {
    return "NOVA NODE accepte les méthodes de paiement suivantes :\n💳 Carte Visa\n🏦 Carte Dahabia (CCP)\n💰 PayPal\n🏧 Virement bancaire\n💵 Cash (paiement à la livraison)\n\nTous les paiements sont sécurisés et simulés en environnement de test.";
  }

  if (msg.includes("livraison") || msg.includes("shipping") || msg.includes("delivery")) {
    return "Options de livraison disponibles :\n📦 Standard Logistics : Gratuit (3-5 jours)\n🚀 Warp Transfer Express : 1 500 DZD (1-2 jours)\n⚡ NOVA NODE Prime Instant : 3 500 DZD (le jour même)\n\nLe suivi de commande est disponible dans votre espace client.";
  }

  if (msg.includes("vendeur") || msg.includes("magasin") || msg.includes("vendre")) {
    return "Pour devenir vendeur sur NOVA NODE :\n1. Créez un compte client\n2. Allez dans 'S'inscrire' et choisissez le rôle 'Vendeur'\n3. Votre magasin sera soumis à validation par notre équipe\n4. Une fois validé, vous pouvez ajouter vos produits\n\nValidation sous 24-48h. Des questions ? contact@nova-node-prime.net";
  }

  if (msg.includes("compte") || msg.includes("profil") || msg.includes("mot de passe")) {
    return "Gestion de votre compte NOVA NODE :\n- Modifier le profil : Menu > Profil\n- Changer le mot de passe : Paramètres > Sécurité\n- Gérer les adresses : Tableau de bord > Adresses\n- Voir les favoris : Menu > Mes favoris\n\nBesoin d'aide technique ? contact@nova-node-prime.net";
  }

  if (msg.includes("annuler") || msg.includes("cancel") || msg.includes("retour")) {
    return "Pour annuler une commande :\n1. Allez dans 'Mes commandes'\n2. Cliquez sur la commande concernée\n3. Le bouton 'Annuler' est disponible tant que la commande est 'En cours'\n\n⚠️ L'annulation n'est possible que pour les commandes non encore expédiées.";
  }

  return "Bonjour ! Je suis l'assistant NOVA NODE. Je peux vous aider avec :\n- 🛒 Passer une commande\n- 📦 Suivre votre livraison\n- 💳 Méthodes de paiement\n- 🏪 Devenir vendeur\n- 👤 Gérer votre compte\n\nPour quel sujet avez-vous besoin d'aide ?";
}