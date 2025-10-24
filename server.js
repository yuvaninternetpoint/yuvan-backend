const express = require("express");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const DB_FILE = path.join(__dirname, "db.json");
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: [] });

async function initDB() {
  await db.read();
  db.data ||= { users: [] };
  await db.write();
}

initDB();

// Root route
app.get("/", (req, res) => {
  res.send("✅ Yuvan backend is running successfully!");
});

// Example route to get users
app.get("/users", async (req, res) => {
  await db.read();
  res.json(db.data.users);
});

// Example route to add a user
app.post("/users", async (req, res) => {
  const user = req.body;
  await db.read();
  db.data.users.push(user);
  await db.write();
  res.status(201).json({ message: "User added successfully", user });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
