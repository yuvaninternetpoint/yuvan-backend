// server.js — final working version for Render + Neocities
const express = require("express");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// Admin credentials (stored safely in Render Environment)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "";

// ✅ CORS configuration — allows Neocities and local testing
app.use(cors({
  origin: [
    "https://yuvankaushik.neocities.org",
    "http://localhost:5500"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false
}));

app.use(express.json());

// ==================== Database setup ====================
const DB_FILE = path.join(__dirname, "db.json");
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: [], bills: [] });

async function initDB() {
  await db.read();
  db.data ||= { users: [], bills: [] };
  await db.write();
}
initDB();

// ==================== Root route ====================
app.get("/", (req, res) => {
  res.send("✅ Yuvan backend is running successfully and ready to serve requests!");
});

// ==================== API ROUTES ====================

// Signup
app.post("/api/signup", async (req, res) => {
  const { name, email, pass } = req.body;
  if (!name || !email || !pass)
    return res.status(400).json({ error: "All fields required" });

  await db.read();
  const exists = db.data.users.find((u) => u.email === email);
  if (exists) return res.status(400).json({ error: "User already exists" });

  db.data.users.push({ name, email, pass, role: "user" });
  await db.write();
  res.json({ message: "Signup successful" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, pass } = req.body;
  if (!email || !pass)
    return res.status(400).json({ error: "Missing credentials" });

  // Admin login (Render env vars)
  if (ADMIN_EMAIL && ADMIN_PASS && email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    return res.json({ session: { role: "admin", email } });
  }

  await db.read();
  const user = db.data.users.find((u) => u.email === email && u.pass === pass);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ session: { role: user.role, email: user.email } });
});

// Customers
app.get("/api/customers", async (req, res) => {
  await db.read();
  res.json(db.data.users);
});

// Bills
app.get("/api/bills", async (req, res) => {
  await db.read();
  const { customer } = req.query;
  let bills = db.data.bills;
  if (customer) bills = bills.filter((b) => b.customer === customer);
  res.json(bills);
});

app.get("/api/bills/:id", async (req, res) => {
  await db.read();
  const bill = db.data.bills.find((b) => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  res.json(bill);
});

// Default handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ==================== Start server ====================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
