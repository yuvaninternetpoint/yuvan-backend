import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// ✅ Allow only your frontend origin for security
app.use(
  cors({
    origin: "https://yuvan-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ MongoDB Connection
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://<username>:<password>@cluster0.mongodb.net/yuvanDB?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Basic test route
app.get("/", (req, res) => {
  res.send("Backend working properly ✅");
});

// ✅ API routes example
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Simple role-based check (demo)
  if (email === "admin@yuvan.com" && password === "admin123") {
    return res.json({ role: "admin", message: "Admin login success" });
  }

  if (email && password) {
    return res.json({ role: "customer", message: "Customer login success" });
  }

  res.status(400).json({ error: "Invalid credentials" });
});

app.post("/api/signup", (req, res) => {
  res.json({ message: "Signup route working ✅" });
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
