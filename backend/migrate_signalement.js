const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    console.log("Starting migration...");
    
    // Check if column exists by trying to select it
    const { error: checkError } = await supabase.from('signalement').select('id_avis').limit(1);
    
    if (checkError && checkError.code === 'PGRST204') {
        console.log("Column 'id_avis' seems to be missing. Please run this SQL in Supabase SQL Editor:");
        console.log("ALTER TABLE signalement ADD COLUMN id_avis UUID REFERENCES avis(id) ON DELETE CASCADE;");
    } else if (checkError) {
        console.error("Error checking table:", checkError);
    } else {
        console.log("Column 'id_avis' already exists.");
    }
}

migrate();
