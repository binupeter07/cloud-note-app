import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import os from "os";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/myprojectdb";

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

let instanceId = "unknown";
async function fetchInstanceId() {
  try {
    const tokenRes = await axios.put(
      "http://169.254.169.254/latest/api/token",
      null,
      { headers: { "X-aws-ec2-metadata-token-ttl-seconds": "21600" } }
    );
    const token = tokenRes.data;
    const idRes = await axios.get(
      "http://169.254.169.254/latest/meta-data/instance-id",
      { headers: { "X-aws-ec2-metadata-token": token } }
    );
    instanceId = idRes.data;
  } catch (err) {
    console.error("Could not fetch instance ID:", err.message);
  }
}
fetchInstanceId();

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to my Note App!",
    host: os.hostname(),
    time: new Date().toISOString(),
  });
});

app.get("/id", (_req, res) => res.send(`Instance ID: ${instanceId}`));

app.post("/notes", async (req, res, next) => {
  try { const note = await Note.create(req.body); res.status(201).json(note); }
  catch (e) { next(e); }
});

app.get("/notes", async (_req, res, next) => {
  try { const notes = await Note.find(); res.json(notes); }
  catch (e) { next(e); }
});

app.get("/instance", (_req, res) => res.send(`Instance ID: ${instanceId}`));
app.get("/health", (_req, res) => res.status(200).send("ok"));

app.use((err, _req, res, _next) => {
  console.error(err); res.status(500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
