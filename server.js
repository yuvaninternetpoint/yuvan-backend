// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ✅ Allow requests from your frontend
app.use(cors({
  origin: [
    "https://yuvan-frontend.onrender.com",  // Render frontend
    "http://localhost:3000"                 // Local testing
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://<your_mongo_connection_string>", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" }
});

const User = mongoose.model("User", userSchema);

// ✅ Middleware for authentication
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid token" });
  }
}

// ✅ Default route
app.get("/", (req, res) => {
  res.send("✅ Backend running fine on Render!");
});

// ✅ Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const role = email === "yuvan.internetpoint@gmail.com" ? "admin" : "user";

    const user = new User({ email, password: hashed, role });
    await user.save();

    res.json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// ✅ Protected Admin Route
app.get("/api/admin", auth, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
  res.json({ message: "Welcome to Admin Panel" });
});

// ✅ Protected User Dashboard
app.get("/api/dashboard", auth, (req, res) => {
  res.json({ message: `Welcome ${req.user.email}, your role is ${req.user.role}` });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
