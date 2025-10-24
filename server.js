// server.js
import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Database setup
const DB_FILE = "./db.json";
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: [] });

// Initialize database
await db.read();
db.data ||= { users: [] };
await db.write();

// ✅ Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://yuvankaushik.neocities.org", // your frontend domain
      "http://localhost:5500", // optional for local testing
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Yuvan backend is running successfully!");
});

// ✅ Signup route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = db.data.users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  db.data.users.push({ email, password: hashedPassword });
  await db.write();

  res.status(201).json({ message: "User created successfully" });
});

// ✅ Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = db.data.users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({ message: "Login successful", user: { email } });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
