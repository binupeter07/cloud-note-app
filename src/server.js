const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const os = require("os");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// prove the file is running
console.log("📦 Booting server.js...");
console.log("ENV PORT =", PORT);
console.log("ENV MONGO_URI =", MONGO_URI || "(missing)");

// connect (non-blocking)
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const noteSchema = new mongoose.Schema({ title: String, content: String });
const Note = mongoose.model("Note", noteSchema);

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to my Note App!",
    host: os.hostname(),
    time: new Date().toISOString(),
  });
});

app.post("/notes", async (req, res, next) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json(note);
  } catch (e) { next(e); }
});

app.get("/notes", async (_req, res, next) => {
  try {
    const notes = await Note.find();
  res.json(notes);
  } catch (e) { next(e); }
});

app.get("/health", (_req, res) => res.status(200).send("ok"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
