// server.js — Final stable version with MongoDB & Render ready
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 10000;

// --- Middleware ---
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://yuvan-frontend.onrender.com",
      "https://yuvankaushik.neocities.org"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// --- MongoDB Connection ---
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://<your-username>:<your-password>@cluster0.mongodb.net/yuvanDB?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, default: "user" },
});

const User = mongoose.model("User", userSchema);

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Backend working fine ✅");
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Admin login (environment-based)
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASS
    ) {
      return res.json({ success: true, role: "admin" });
    }

    // ✅ Normal user login
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ success: true, role: "user" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
