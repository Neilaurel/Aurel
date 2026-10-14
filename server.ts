import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import { google } from "googleapis";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { history, bets, bankroll, analysisLogs } from "./src/db/schema.ts";
import { eq, desc, and } from "drizzle-orm";

dotenv.config();

const PORT = 3000;

// Helper to get authorized sheets client
const getSheetsClient = (req?: any) => {
  let token = req?.headers?.authorization;
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  }
  if (!token) {
    token = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }
  if (!token) {
    console.error("[SERVER] GOOGLE_OAUTH_ACCESS_TOKEN is missing from environment variables and request headers.");
    throw new Error("Missing Google OAuth access token. Please ensure you have granted spreadsheet permissions.");
  }
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  return google.sheets({ version: "v4", auth });
};

const USER_AGENTS = [
  // iPhone 15 Pro
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  // Samsung Galaxy S23
  "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  // Chrome on Windows 11
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
  // Safari on MacOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  // Google Pixel 8
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  // Firefox on Android
  "Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0"
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Proxy endpoint to bypass bot detection
  app.post("/api/proxy-fetch", async (req, res) => {
    const { url, headers } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const randomAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    try {
      console.log(`[PROXY] Fetching URL: ${url} with agent: ${randomAgent.substring(0, 50)}...`);
      const response = await axios.get(url, {
        headers: {
          "User-Agent": randomAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          ...headers
        },
        timeout: 10000,
        validateStatus: () => true // Allow non-200 for easier debugging
      });

      res.status(response.status).json({
        data: response.data,
        status: response.status,
        headers: response.headers
      });
    } catch (error: any) {
      console.error("[PROXY ERROR]", error.message);
      res.status(500).json({
        error: "Failed to fetch URL through proxy",
        message: error.message
      });
    }
  });

  // Firecrawl integration endpoints
  app.post("/api/firecrawl/scrape", async (req, res) => {
    const { url, options } = req.body;
    const requestKey = req.headers['x-firecrawl-api-key'] || req.body.apiKey;
    const apiKey = process.env.FIRECRAWL_API_KEY || requestKey || "";

    if (!url) {
      return res.status(400).json({ error: "L'URL est requise pour le scraping." });
    }

    try {
      console.log(`[FIRECRAWL] Scraping URL: ${url} (OnlyMainContent: ${options?.onlyMainContent ?? true})`);
      const response = await axios.post("https://api.firecrawl.dev/v1/scrape", {
        url,
        formats: options?.formats || ["markdown"],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor ?? 0
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        timeout: 45000
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("[FIRECRAWL SCRAPE ERROR]", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: "Erreur lors du scraping Firecrawl",
        details: error.response?.data || error.message
      });
    }
  });

  app.post("/api/firecrawl/crawl", async (req, res) => {
    const { url, options } = req.body;
    const requestKey = req.headers['x-firecrawl-api-key'] || req.body.apiKey;
    const apiKey = process.env.FIRECRAWL_API_KEY || requestKey || "";

    if (!url) {
      return res.status(400).json({ error: "L'URL de départ est requise pour le crawl." });
    }

    try {
      console.log(`[FIRECRAWL] Crawling domain: ${url} (Limit: ${options?.limit || 10})`);
      const response = await axios.post("https://api.firecrawl.dev/v1/crawl", {
        url,
        limit: options?.limit || 10,
        maxDepth: options?.maxDepth || 1,
        allowBackwardLinks: options?.allowBackwardLinks || false
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        timeout: 45000
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("[FIRECRAWL CRAWL ERROR]", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: "Erreur lors du crawl Firecrawl",
        details: error.response?.data || error.message
      });
    }
  });

  app.get("/api/firecrawl/crawl/status/:id", async (req, res) => {
    const { id } = req.params;
    const requestKey = req.headers['x-firecrawl-api-key'];
    const apiKey = process.env.FIRECRAWL_API_KEY || requestKey || "";

    try {
      console.log(`[FIRECRAWL] Getting crawl status for job: ${id}`);
      const response = await axios.get(`https://api.firecrawl.dev/v1/crawl/${id}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        timeout: 15000
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("[FIRECRAWL CRAWL STATUS ERROR]", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: "Erreur lors de la récupération du statut du crawl",
        details: error.response?.data || error.message
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      hasToken: !!process.env.GOOGLE_OAUTH_ACCESS_TOKEN,
      tokenLength: process.env.GOOGLE_OAUTH_ACCESS_TOKEN ? process.env.GOOGLE_OAUTH_ACCESS_TOKEN.length : 0
    });
  });

  // Google Sheets integration
  app.post("/api/sheets/setup", async (req, res) => {
    const { title, data } = req.body;
    try {
      const sheets = getSheetsClient(req);

      // Create a new spreadsheet with explicitly named first sheet
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: `SmartPick Analysis - ${title}` },
          sheets: [
            {
              properties: {
                title: "Sheet1"
              }
            }
          ]
        }
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;

      // Prepare the data for the sheet
      // We'll create a simple key-value table for quantitative data
      const values = [
        ["Variable", "Valeur", "Formule/Note"],
        ...Object.entries(data).map(([key, val]: [string, any]) => {
          if (typeof val === "object" && val !== null) {
            return [key, JSON.stringify(val), ""];
          }
          return [key, val, ""];
        })
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId!,
        range: "Sheet1!A1",
        valueInputOption: "RAW",
        requestBody: { values }
      });

      res.json({ spreadsheetId, url: spreadsheet.data.spreadsheetUrl });
    } catch (error: any) {
      console.error("[SHEETS ERROR]", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sheets/:spreadsheetId", async (req, res) => {
    const { spreadsheetId } = req.params;
    try {
      const sheets = getSheetsClient(req);
      // Get the sheet metadata to find the actual name of the first sheet
      const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetName = spreadsheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:C100`
      });
      res.json({ values: response.data.values });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sheets/:spreadsheetId/update", async (req, res) => {
    const { spreadsheetId } = req.params;
    const { range, values } = req.body;
    try {
      const sheets = getSheetsClient(req);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values }
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Google Drive Upload skeleton
  app.post("/api/drive/upload", async (req, res) => {
    // This is a placeholder for the integration
    res.json({ message: "Drive integration endpoint ready - requires OAuth token handling" });
  });

  // Cloud SQL Database Integration Endpoints
  // History endpoints
  app.get("/api/history", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userHistory = await db.select()
        .from(history)
        .where(eq(history.userId, req.user!.uid))
        .orderBy(desc(history.createdAt));
      res.json(userHistory);
    } catch (error: any) {
      console.error("[GET HISTORY ERROR]", error);
      res.status(500).json({ error: "Impossible de récupérer l'historique.", details: error.message });
    }
  });

  app.post("/api/history", requireAuth, async (req: AuthRequest, res) => {
    const { id, sport, homeTeam, awayTeam, predictionData } = req.body;
    if (!id || !sport || !homeTeam || !awayTeam || !predictionData) {
      return res.status(400).json({ error: "Paramètres manquants pour l'historique (id, sport, teams, predictionData)." });
    }
    try {
      const result = await db.insert(history)
        .values({
          id,
          userId: req.user!.uid,
          sport,
          homeTeam,
          awayTeam,
          predictionData: typeof predictionData === 'string' ? predictionData : JSON.stringify(predictionData),
        })
        .onConflictDoUpdate({
          target: history.id,
          set: {
            sport,
            homeTeam,
            awayTeam,
            predictionData: typeof predictionData === 'string' ? predictionData : JSON.stringify(predictionData),
          }
        })
        .returning();
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error("[POST HISTORY ERROR]", error);
      res.status(500).json({ error: "Impossible de sauvegarder la prédiction.", details: error.message });
    }
  });

  app.delete("/api/history/:id", requireAuth, async (req: AuthRequest, res) => {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "ID invalide." });
    }
    try {
      await db.delete(history)
        .where(and(eq(history.id, id), eq(history.userId, req.user!.uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE HISTORY ERROR]", error);
      res.status(500).json({ error: "Impossible de supprimer la prédiction.", details: error.message });
    }
  });

  // Bets endpoints
  app.get("/api/bets", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userBets = await db.select()
        .from(bets)
        .where(eq(bets.userId, req.user!.uid))
        .orderBy(desc(bets.createdAt));
      res.json(userBets);
    } catch (error: any) {
      console.error("[GET BETS ERROR]", error);
      res.status(500).json({ error: "Impossible de récupérer les paris.", details: error.message });
    }
  });

  app.post("/api/bets", requireAuth, async (req: AuthRequest, res) => {
    const { id, matchName, sport, odds, stake, betType, prediction, status } = req.body;
    if (!id || !matchName || !sport || odds === undefined || stake === undefined || !betType || !prediction) {
      return res.status(400).json({ error: "Paramètres manquants pour le pari (id, matchName, sport, odds, stake, betType, prediction)." });
    }
    try {
      const result = await db.insert(bets)
        .values({
          id,
          userId: req.user!.uid,
          matchName,
          sport,
          odds: odds.toString(),
          stake: stake.toString(),
          betType,
          prediction,
          status: status || 'pending',
        })
        .onConflictDoUpdate({
          target: bets.id,
          set: {
            status: status || 'pending',
            odds: odds.toString(),
            stake: stake.toString(),
            betType,
            prediction,
          }
        })
        .returning();
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error("[POST BETS ERROR]", error);
      res.status(500).json({ error: "Impossible de sauvegarder le pari.", details: error.message });
    }
  });

  app.put("/api/bets/:id", requireAuth, async (req: AuthRequest, res) => {
    const id = req.params.id;
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: "Paramètres invalides." });
    }
    try {
      const result = await db.update(bets)
        .set({ status })
        .where(and(eq(bets.id, id), eq(bets.userId, req.user!.uid)))
        .returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("[PUT BETS ERROR]", error);
      res.status(500).json({ error: "Impossible de mettre à jour le pari.", details: error.message });
    }
  });

  app.delete("/api/bets/:id", requireAuth, async (req: AuthRequest, res) => {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: "ID invalide." });
    }
    try {
      await db.delete(bets)
        .where(and(eq(bets.id, id), eq(bets.userId, req.user!.uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error("[DELETE BETS ERROR]", error);
      res.status(500).json({ error: "Impossible de supprimer le pari.", details: error.message });
    }
  });

  // Bankroll endpoints
  app.get("/api/bankroll", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userBankroll = await db.select()
        .from(bankroll)
        .where(eq(bankroll.userId, req.user!.uid));
      if (userBankroll.length === 0) {
        const defaultBankroll = await db.insert(bankroll)
          .values({
            userId: req.user!.uid,
            initialBalance: "1000.00",
            currentBalance: "1000.00",
            currency: "EUR",
          })
          .returning();
        return res.json(defaultBankroll[0]);
      }
      res.json(userBankroll[0]);
    } catch (error: any) {
      console.error("[GET BANKROLL ERROR]", error);
      res.status(500).json({ error: "Impossible de récupérer la bankroll.", details: error.message });
    }
  });

  app.post("/api/bankroll", requireAuth, async (req: AuthRequest, res) => {
    const { initialBalance, currentBalance, currency } = req.body;
    try {
      const result = await db.insert(bankroll)
        .values({
          userId: req.user!.uid,
          initialBalance: initialBalance !== undefined ? initialBalance.toString() : "1000.00",
          currentBalance: currentBalance !== undefined ? currentBalance.toString() : "1000.00",
          currency: currency || "EUR",
        })
        .onConflictDoUpdate({
          target: bankroll.userId,
          set: {
            initialBalance: initialBalance !== undefined ? initialBalance.toString() : undefined,
            currentBalance: currentBalance !== undefined ? currentBalance.toString() : undefined,
            currency: currency || undefined,
            updatedAt: new Date(),
          },
        })
        .returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("[POST BANKROLL ERROR]", error);
      res.status(500).json({ error: "Impossible de mettre à jour la bankroll.", details: error.message });
    }
  });

  // Analysis Logs endpoints
  app.get("/api/logs", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userLogs = await db.select()
        .from(analysisLogs)
        .where(eq(analysisLogs.userId, req.user!.uid))
        .orderBy(desc(analysisLogs.createdAt));
      res.json(userLogs);
    } catch (error: any) {
      console.error("[GET LOGS ERROR]", error);
      res.status(500).json({ error: "Impossible de récupérer les logs.", details: error.message });
    }
  });

  app.post("/api/logs", requireAuth, async (req: AuthRequest, res) => {
    const { id, matchName, logContent } = req.body;
    if (!id || !matchName || !logContent) {
      return res.status(400).json({ error: "Paramètres manquants pour les logs (id, matchName, logContent)." });
    }
    try {
      const result = await db.insert(analysisLogs)
        .values({
          id,
          userId: req.user!.uid,
          matchName,
          logContent: typeof logContent === 'string' ? logContent : JSON.stringify(logContent),
        })
        .onConflictDoUpdate({
          target: analysisLogs.id,
          set: {
            matchName,
            logContent: typeof logContent === 'string' ? logContent : JSON.stringify(logContent),
          }
        })
        .returning();
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error("[POST LOGS ERROR]", error);
      res.status(500).json({ error: "Impossible de sauvegarder les logs.", details: error.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
}

startServer();
