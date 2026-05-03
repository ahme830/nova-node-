const supabase = require("./db");

async function findAllowed() {
  const testId = "9277563a-485f-4e13-8519-e82883fce45f";
  const candidates = ["en_attente", "validee", "traitee", "acceptee", "livraison", "pret"];
  
  for (const status of candidates) {
    console.log(`Testing status: '${status}'...`);
    const { error } = await supabase
      .from("commande")
      .update({ statut_commande: status })
      .eq("id", testId)
      .select()
      .single();

    if (error) {
      console.log(`  - FAILED: ${error.message}`);
    } else {
      console.log(`  - SUCCESS!! '${status}' is allowed.`);
    }
  }
  process.exit();
}

findAllowed();
