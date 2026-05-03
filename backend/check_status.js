const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking commande statuses...");
    
    // Select one row to see what statuses are already there
    const { data, error } = await supabase
      .from("commande")
      .select("statut_commande")
      .limit(10);

    if (error) {
        console.log("ERROR:", error);
    } else {
        const statuses = [...new Set(data.map(c => c.statut_commande))];
        console.log("Existing statuses in DB:", statuses);
    }
}

check();
