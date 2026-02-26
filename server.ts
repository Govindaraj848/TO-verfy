import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy route for Design MRP Detail to avoid CORS issues
  app.get("/api/proxy/design-mrp", async (req, res) => {
    const { designNumber } = req.query;
    if (!designNumber) {
      return res.status(400).json({ error: "designNumber is required" });
    }

    try {
      const targetUrl = `https://wms-prod.technoboost.in/api/product-item/get-design-mrp-detail?designNumber=${designNumber}`;
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from upstream" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
