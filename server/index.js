const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { ingestFile } = require("./ingest");
const { retrieveAndGenerate } = require("./retrieve");

const app = express();
const PORT = process.env.PORT || 8000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf" || ext === ".txt") {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf and .txt files are allowed"));
    }
  },
});

// Routes
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await ingestFile(req.file.path, req.file.originalname);
    res.json({ success: true, chunks: result.chunkCount });
  } catch (error) {
    console.error("UPLOAD ROUTE ERROR:", error);
    res.status(500).json({ error: error.message || "Failed to process document" });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const result = await retrieveAndGenerate(question);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to generate answer" });
  }
});

app.get("/", (req, res) => {
  res.send("NotebookLM Clone API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
