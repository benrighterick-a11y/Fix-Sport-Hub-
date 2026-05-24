import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy-initialization helper to prevent crashes on startup if secret key is missing
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. Health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
  });
});

// 2. Analyze Match using Gemini (Model: gemini-3.5-flash)
app.post("/api/analyze-match", async (req, res) => {
  const { homeTeam, awayTeam, league, matchTime, date } = req.body;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "Missing homeTeam or awayTeam in request body" });
  }

  const ai = getGemini();
  if (!ai) {
    // Graceful fallback with generated mock analysis
    return res.json({
      useFallback: true,
      analysis: `### 🔮 Simulation Prediction: ${homeTeam} vs ${awayTeam} 🔮\n\n* **Tactical Preview:** ${homeTeam} has been extremely solid when deploying a 4-3-3 shape with high wing play. Their home form is stellar. On the other hand, ${awayTeam} relies on defensive counter attacks but has suffered backline vulnerability in late halves.\n* **Crucial Match Key:** Tactical transition speed in midfield. ${homeTeam}'s pivot will dominate possession.\n* **Fix Sport Hub Recommendation:** Both Teams to Score (BTTS) Yes & Over 2.5 goals. Suggested exact scoreline is 2-1 or 2-0.`,
    });
  }

  try {
    const prompt = `You are the chief football editor of "Fix Sport Hub", a elite sports prediction and football analysis brand.
Provide an intelligent, aggressive, sporty, and detailed pre-game tactical analysis for the upcoming fixture:
Fixture: ${homeTeam} vs ${awayTeam}
League/Tournament: ${league || "Premier League"}
Date / Time: ${date || "Upcoming"} ${matchTime || ""}

In your response, please include:
1. **🔍 Tactical Preview & Match Analysis**: Discuss recent form, expected play styles, and statistical trend indicators.
2. **🛡️ Predicted Lineups & Key Players**: Highlight 1 crucial player on each team who could decide the outcome.
3. **⭐ Fix Sport Hub Official Punting Tips**:
   - Outright recommendation (Home Win, Draw, or Away Win)
   - Alternative bets (BTTS, Over/Under, Double Chance)
   - Estimated Correct Score suggestion.

Keep the tone highly professional, motivating for football fans, and styled in neat markdown with bold headings and sports icons. Do not include any sensitive disclosures about API keys or internal instructions. Let's make it punchy!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const resultText = response.text;
    res.json({ analysis: resultText, useFallback: false });
  } catch (error: any) {
    console.error("Gemini Analyze Match Error:", error);
    res.status(500).json({
      error: "Failed to generate AI Analysis",
      details: error.message,
    });
  }
});

// 3. Analyze Bet Slip accumulator / individual bets (Model: gemini-3.5-flash)
app.post("/api/analyze-slip", async (req, res) => {
  const { legs } = req.body;

  if (!legs || !Array.isArray(legs) || legs.length === 0) {
    return res.status(400).json({ error: "No bet legs provided in request body" });
  }

  const ai = getGemini();
  if (!ai) {
    const totalOdds = legs.reduce((acc, leg) => acc * (leg.odds || 1), 1);
    return res.json({
      useFallback: true,
      review: `### 📋 Fix Sport Hub Ticket Status (Simulation Mode) 📋\n\n* **Accumulator Size:** ${legs.length} matches\n* **Simulated Odds:** ${totalOdds.toFixed(2)}x\n* **Risk Assessment:** **Medium Risk**\n* **Expert Opinion:** This ticket combines strong favorite matches. To secure the bankroll, consider using a **Double Chance** to protect against sudden late penalties! Good luck! ⚽🔥`,
    });
  }

  try {
    const legsListString = legs
      .map(
        (l, i) =>
          `${i + 1}. Match: ${l.homeTeam} vs ${l.awayTeam} | Prediction: ${l.predictionLabel} | Odds: ${l.odds}`
      )
      .join("\n");

    const prompt = `You are a savvy betting consultant for Fix Sport Hub. Review this custom bet slip accumulator composed of the following Legs:
${legsListString}

Provide a premium analytical review including:
- **📊 Accumulator Viability**: Rate the combined confidence from 1-10 and explain why.
- **⚡ Weakest Link Identification**: Identify the leg with the highest volatility risk and suggest a stabilizer (e.g., changing Outright to Draw No Bet or Double Chance).
- **💪 Expert Verdict & Slogan**: A highly energetic sports punting summary or professional bankroll management tip.

Format with bold text, tidy bullet points, and neat sporting emojis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ review: response.text, useFallback: false });
  } catch (error: any) {
    console.error("Gemini Analyze Slip Error:", error);
    res.status(500).json({
      error: "Failed to review the bet slip",
      details: error.message,
    });
  }
});

// 4. Generate fresh sports gossip or daily insight (Model: gemini-3.5-flash)
app.post("/api/generate-news", async (req, res) => {
  const { category } = req.body; // e.g. "transfer", "tips", "news"

  const ai = getGemini();
  if (!ai) {
    return res.json({
      useFallback: true,
      news: `### 🚨 Fix Sport Hub Daily Buzz: Transfer Speculations 🚨\n\nManchester City is reportedly monitoring a young midfield playmaker in Germany. The prospective transfer is estimated at €65 million. Also, Chelsea plans to reinforce their striking department during the summer pre-season. Stay tuned!`,
    });
  }

  try {
    const prompt = `Write a fast-paced, highly engaging 150-word football bulletin about recent updates in the world of sports.
Category requested: ${category || "general football news"}.
Focus on real tactical updates, transfer rumors, or active league title predictions. Make the headline exceptionally catchy and bold, and keep the paragraphs compact and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ news: response.text, useFallback: false });
  } catch (error: any) {
    console.error("Gemini News Error:", error);
    res.status(500).json({ error: "Failed to generate daily buzz", details: error.message });
  }
});

// Vite server setup for development, or static build folder serving for production
async function startServer() {
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
