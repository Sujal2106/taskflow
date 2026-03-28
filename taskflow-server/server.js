// server.js — This is the main file that starts your backend server

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const taskRoutes = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
// cors: allows your React app (port 5173) to talk to this server (port 5000)
app.use(cors({ 
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://taskflow-forntend.onrender.com"
  ],
  credentials: true
}));
// express.json: lets Express read JSON data sent from React
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
// Any request starting with /api/tasks will go to routes/tasks.js
app.use("/api/tasks", taskRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
// Visit http://localhost:5000 to confirm server is running
app.get("/", (req, res) => {
  res.json({ message: "TaskFlow API is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

// ─── Connect to MongoDB (Optional) ─────────────────────────────────────────────
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      console.log("⚠️  Server will run without database");
    });
} else {
  console.log("⚠️  MONGO_URI not set - running without database");
}

// ─── Start server ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});