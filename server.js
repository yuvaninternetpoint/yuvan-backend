// ✅ Final Secure server.js for Render + MongoDB
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Allow your frontend (on Render)
app.use(cors({
  origin: ["https://yuvan-frontend.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ✅ MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://<your_mongodb_connection_string>";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ Define User Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, default: "user" },
});

const User = mongoose.model("User", userSchema);

// ✅ Root route
app.get("/", (req, res) => {
  res.json({ message: "✅ Yuvan Backend is running fine!" });
});

// ✅ Signup Route
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "admin") {
      return res.json({ message: "Admin login successful", role: "admin" });
    } else {
      return res.json({ message: "User login successful", role: "user" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// ✅ Admin check route
app.get("/api/admin", (req, res) => {
  res.json({ message: "Admin panel active" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
