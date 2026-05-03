const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking notification table...");
    
    const { data, error } = await supabase
      .from("notification")
      .select("*")
      .limit(1);

    if (error) {
        console.log("ERROR:", error);
    } else {
        console.log("SUCCESS, columns:", Object.keys(data[0] || {}));
    }
}

check();
