require("dotenv").config();

console.log("ENV Loaded:", {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.slice(0, 6) + "...",
});
const { createClient } = require("@supabase/supabase-js");
console.log("URL check:", process.env.SUPABASE_URL); 
const supabase = createClient(
  process.env.SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

console.log("Connected to Supabase");

module.exports = supabase;
