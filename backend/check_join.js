const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking full query...");
    
    const { data, error } = await supabase
      .from("signalement")
      .select(`
        id,
        motif,
        date,
        client (
          utilisateur ( nom_utilisateur, email )
        ),
        produit:id_produit ( id, nom_produit ),
        avis:id_avis ( id, contenu, auteur )
      `)
      .limit(5);

    if (error) {
        console.log("ERROR:", error);
    } else {
        console.log("SUCCESS:", data.length, "items found");
        if (data.length > 0) console.log("Example:", JSON.stringify(data[0], null, 2));
    }
}

check();
