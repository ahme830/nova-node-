const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking user profiles...");
    
    const { data, error } = await supabase
      .from("utilisateur")
      .select("id, nom_utilisateur, photo_url")
      .not("photo_url", "is", null)
      .limit(5);

    if (error) {
        console.log("ERROR:", error);
    } else {
        console.log("Users with photo_url:", data);
    }
}

check();
