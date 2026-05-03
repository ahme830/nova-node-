const supabase = require("../db");

const verifyAdmin = async (req, res, next) => {
  console.log("Request reached verifyAdmin!");
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Check admin table
  const { data: admin, error: adminError } = await supabase
    .from("admin")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (adminError || !admin) {
    return res.status(403).json({ error: "Access denied — admins only" });
  }

  req.user  = data.user;
  req.token = token;
  console.log('everything is good')
  next();
};

module.exports = verifyAdmin;