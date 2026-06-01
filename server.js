const express = require("express");
const path = require("path");
const app = express();
app.use(express.json({ limit: "1mb" }));
app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "index.html")); });
app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured." });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("LexPost on port " + PORT));
