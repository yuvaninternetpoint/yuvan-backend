const express = require("express");
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const DB_FILE = path.join(__dirname, 'db.json');
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: [] });

async function initDB() {
  await db.read();
  db.data ||= { users: [] };
  await db.write();
}

initDB();

app.get("/", (req, res) => {
  res.send("✅ Yuvan backend is running successfully!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
