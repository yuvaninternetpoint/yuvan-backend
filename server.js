// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// ------------------------
// MongoDB Connection
// ------------------------
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://<your_mongo_connection_string>";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------------
// User Schema
// ------------------------
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, default: "customer" }, // "admin" or "customer"
});

const User = mongoose.model("User", userSchema);

// ------------------------
// Routes
// ------------------------

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running properly 🚀");
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });
    if (user.password !== password) return res.status(400).json({ success: false, message: "Invalid password" });

    res.json({
      success: true,
      message: "Login successful",
      role: user.role || "customer",
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------------
// Start Server
// ------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
