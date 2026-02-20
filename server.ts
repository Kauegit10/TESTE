import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("database.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    description TEXT,
    image TEXT,
    category TEXT,
    whatsapp_number TEXT
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "admin");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { username, password } = req.body;
    try {
      db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Product Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  async function resolveImageUrl(url: string): Promise<string> {
    if (url.includes("ibb.co/") && !url.includes("i.ibb.co/")) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        // Look for og:image or direct link in the HTML
        const match = html.match(/<meta property="og:image" content="(https:\/\/i\.ibb\.co\/[^"]+)"/);
        if (match && match[1]) {
          return match[1];
        }
      } catch (e) {
        console.error("Error resolving image URL:", e);
      }
    }
    return url;
  }

  app.post("/api/products", async (req, res) => {
    const { name, price, description, image, category, whatsapp_number, admin_password } = req.body;
    // Simple admin check for demo purposes
    if (admin_password !== 'admin123') return res.status(403).json({ error: "Unauthorized" });
    
    const resolvedImage = await resolveImageUrl(image);
    
    const result = db.prepare("INSERT INTO products (name, price, description, image, category, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?)")
      .run(name, price, description, resolvedImage, category, whatsapp_number);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { admin_password } = req.body;
    if (admin_password !== 'admin123') return res.status(403).json({ error: "Unauthorized" });
    
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
