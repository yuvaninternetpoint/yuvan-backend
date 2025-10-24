// server.js (final secure version)
const express = require("express");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Admin credentials are now stored in environment variables (Render settings)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "";

// Middleware
app.use(cors({
  origin: ["https://yuvankaushik.neocities.org"],  // allow your frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());


// Database setup
const DB_FILE = path.join(__dirname, "db.json");
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: [], bills: [] });

// Initialize DB
async function initDB() {
  await db.read();
  db.data ||= { users: [], bills: [] };
  await db.write();
}
initDB();

// Root route
app.get("/", (req, res) => {
  res.send("✅ Yuvan backend is running successfully!");
});

// ========================== API ROUTES =============================== //

// Signup
app.post("/api/signup", async (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass)
    return res.status(400).json({ error: "All fields required" });

  const exists = db.data.users.find((u) => u.email === email);
  if (exists) return res.status(400).json({ error: "User already exists" });

  db.data.users.push({ name, email, pass, role: "user" });
  await db.write();
  res.json({ message: "Signup successful" });
});

// Login (secure with env vars)
app.post("/api/login", async (req, res) => {
  const { email, pass } = req.body;
  if (!email || !pass)
    return res.status(400).json({ error: "Missing credentials" });

  // ✅ Admin login (from Render environment)
  if (ADMIN_EMAIL && ADMIN_PASS && email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    return res.json({ session: { role: "admin", email } });
  }

  // Normal user login
  const user = db.data.users.find((u) => u.email === email && u.pass === pass);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ session: { role: user.role, email: user.email } });
});

// Get customers
app.get("/api/customers", async (req, res) => {
  await db.read();
  res.json(db.data.users);
});

// Get all bills
app.get("/api/bills", async (req, res) => {
  await db.read();
  const { customer } = req.query;
  let bills = db.data.bills;
  if (customer) bills = bills.filter((b) => b.customer === customer);
  res.json(bills);
});

// Get a specific bill by ID
app.get("/api/bills/:id", async (req, res) => {
  await db.read();
  const bill = db.data.bills.find((b) => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  res.json(bill);
});

// ===================================================================== //

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
