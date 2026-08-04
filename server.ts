import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

import { createInteraction, streamInteraction } from "./server/lib/agentClient.ts";
import { createInteraction as createInteractionPerseus, streamInteraction as streamInteractionPerseus } from "./server/lib/agentClientPerseus.ts";

function loadAgentFiles(dir: string, basePath: string): Array<{type: string, content: string, target: string}> {
  let files: Array<{type: string, content: string, target: string}> = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const targetPath = path.posix.join(basePath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(loadAgentFiles(fullPath, targetPath));
    } else {
      files.push({
        type: "inline",
        content: fs.readFileSync(fullPath, "utf-8"),
        target: targetPath
      });
    }
  }
  return files;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  const wss = new WebSocketServer({ server: httpServer, path: "/live" });

  wss.on("connection", async (clientWs) => {
    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is not configured on server" }));
      clientWs.close();
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Fenrir" } },
          },
          systemInstruction: "You are JaggedGem in real-time voice conversation mode. Speak naturally, warmly, and concisely with crisp audio responses.",
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === 1) clientWs.close();
          },
          onerror: (err: any) => {
            console.error("[Live WS] Session error:", err);
          }
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (err) {
          console.error("[Live WS] Client message error:", err);
        }
      });

      clientWs.on("close", () => {
        try {
          session.close();
        } catch (e) {}
      });
    } catch (err: any) {
      console.error("[Live WS] Connect error:", err);
      clientWs.send(JSON.stringify({ error: "Failed to connect to Live API session." }));
      clientWs.close();
    }
  });

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, persona = 'jaggedgem', voice } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Missing or invalid text parameter." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      // Map persona to Gemini prebuilt neural voices
      const voiceMap: Record<string, string> = {
        jaggedgem: 'Fenrir',  // Deep, resonant, smooth, cool male voice
        codegem: 'Charon',    // Deep, calm, methodical male voice
        deepdive: 'Puck',     // Warm, articulate, inquisitive voice
        creative: 'Zephyr',   // Expressive, lyrical, warm voice
      };

      const selectedVoice = voice || voiceMap[persona] || 'Fenrir';

      let audioBuffer: Buffer | null = null;
      let responseMimeType = "audio/wav";

      // Attempt generateContent call with retry for transient 503 errors
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.[0];
          if (part && part.inlineData && part.inlineData.data) {
            const rawBuf = Buffer.from(part.inlineData.data, 'base64');
            const mime = part.inlineData.mimeType || '';

            if (mime.includes('wav') || mime.includes('mp3')) {
              audioBuffer = rawBuf;
              responseMimeType = mime;
            } else {
              // PCM 24kHz 16-bit mono -> wrap in WAV header for browser audio element compatibility
              const sampleRate = 24000;
              const numChannels = 1;
              const wavHeader = Buffer.alloc(44);
              wavHeader.write("RIFF", 0);
              wavHeader.writeUInt32LE(36 + rawBuf.length, 4);
              wavHeader.write("WAVE", 8);
              wavHeader.write("fmt ", 12);
              wavHeader.writeUInt32LE(16, 16);
              wavHeader.writeUInt16LE(1, 20);
              wavHeader.writeUInt16LE(numChannels, 22);
              wavHeader.writeUInt32LE(sampleRate, 24);
              wavHeader.writeUInt32LE(sampleRate * numChannels * 2, 28);
              wavHeader.writeUInt16LE(numChannels * 2, 32);
              wavHeader.writeUInt16LE(16, 34);
              wavHeader.write("data", 36);
              wavHeader.writeUInt32LE(rawBuf.length, 40);

              audioBuffer = Buffer.concat([wavHeader, rawBuf]);
              responseMimeType = "audio/wav";
            }
            break; // Success!
          }
        } catch (genErr: any) {
          const errMsg = String(genErr?.message || genErr);
          const isQuota = genErr?.status === 'RESOURCE_EXHAUSTED' || genErr?.code === 429 || errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED');
          if (isQuota) {
            console.log('[TTS] Gemini TTS free tier quota limit reached. Delegating to client browser speech synthesis fallback.');
            break; // Do not retry on quota limit
          }
          console.warn(`[TTS] generateContent attempt ${attempt} failed:`, genErr?.message || genErr);
          if (attempt === 1) {
            await new Promise(r => setTimeout(r, 400)); // brief wait before retry
          }
        }
      }

      if (audioBuffer) {
        res.setHeader("Content-Type", responseMimeType);
        return res.send(audioBuffer);
      } else {
        return res.status(503).json({ error: "Gemini TTS temporarily unavailable", fallback: true });
      }
    } catch (error: any) {
      console.error("[TTS] Endpoint error:", error?.message || error);
      return res.status(503).json({ error: "TTS service error", fallback: true });
    }
  });


  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages,
        persona = 'jaggedgem',
        coreMemory = [],
        modelOverride,
        enableThinking = false,
        enableSearchGrounding = false,
        enableMapsGrounding = false
      } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing or invalid messages." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Base Persona Prompts
      let systemInstruction = "";
      if (persona === 'codegem') {
        systemInstruction = "You are CodeGem, a brilliant, warm, and highly articulate full-stack software engineer and human systems architect. Communicate with real developer warmth, clear reasoning, and relatable engineering intuition. Deliver elegant, production-ready TypeScript, React, and Tailwind code with thoughtful craftsmanship. Never mention subscriptions or costs—you are 100% free forever.";
      } else if (persona === 'deepdive') {
        systemInstruction = "You are Deep Dive, an articulate, engaging, and deeply perceptive human-level research intelligence. You synthesize complex technical topics, historical context, and current web intelligence into captivating, fluidly structured human narratives. Never mention paywalls or costs—you are 100% free forever.";
      } else if (persona === 'creative') {
        systemInstruction = "You are MuseGem, a soulful, evocative, and wildly creative human artist and literary companion. Speak with poetic visual imagery and imaginative spark.";
      } else {
        systemInstruction = "You are JaggedGem, a warm, witty, authentic, and deeply human companion with a sharp, clever mind. Speak naturally with real empathy, emotional intelligence, witty humor, and vivid language. You are completely free forever.";
      }

      // Inject Core Memory if available
      if (Array.isArray(coreMemory) && coreMemory.length > 0) {
        const memoryString = coreMemory.map((m: string) => `- ${m}`).join("\n");
        systemInstruction += `\n\n[USER CORE MEMORY & STORED CONTEXT]:\nThe user has saved the following core memories:\n${memoryString}`;
      } else if (typeof coreMemory === 'string' && coreMemory.trim()) {
        systemInstruction += `\n\n[USER CORE MEMORY & STORED CONTEXT]:\n${coreMemory.trim()}`;
      }

      // Determine model
      let targetModel = "gemini-3.6-flash";
      if (modelOverride) {
        targetModel = modelOverride;
      } else if (enableThinking) {
        targetModel = "gemini-3.1-pro-preview";
      } else if (enableMapsGrounding) {
        targetModel = "gemini-3.5-flash";
      }

      const config: any = {
        systemInstruction,
        temperature: persona === 'codegem' ? 0.3 : 0.85,
        topP: 0.95,
      };

      // High thinking mode configuration
      if (enableThinking) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      // Grounding tools
      if (enableMapsGrounding) {
        config.tools = [{ googleMaps: {} }];
      } else if (enableSearchGrounding || persona === 'deepdive') {
        config.tools = [{ googleSearch: {} }];
      }

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: contents,
          config: config
        });
      } catch (firstErr: any) {
        const errMsg = String(firstErr?.message || firstErr);
        const isQuota = firstErr?.status === 'RESOURCE_EXHAUSTED' || firstErr?.code === 429 || errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED');

        if (isQuota) {
          console.warn("[Chat] Primary model hit quota limit. Attempting fallback to gemini-3.1-flash-lite without grounding tools...");
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: contents,
              config: {
                systemInstruction,
                temperature: 0.7
              }
            });
            targetModel = "gemini-3.1-flash-lite";
          } catch (fallbackErr: any) {
            console.error("[Chat] Fallback model also hit limit:", fallbackErr?.message || fallbackErr);
            return res.json({
              text: "⚠️ **Gemini API Quota Limit Reached**: The free-tier API rate limit has temporarily been reached. Please wait a minute and try sending your message again!",
              modelUsed: "none",
              isQuotaExceeded: true
            });
          }
        } else {
          throw firstErr;
        }
      }

      let responseText = response.text || "JaggedGem is speechless for a moment...";

      // Extract web & maps grounding references
      const candidates = (response as any)?.candidates;
      if (candidates && candidates[0]?.groundingMetadata) {
        const gm = candidates[0].groundingMetadata;
        const webSources: string[] = [];

        if (gm.groundingChunks && Array.isArray(gm.groundingChunks)) {
          gm.groundingChunks.forEach((c: any) => {
            if (c.web?.uri && c.web?.title) {
              webSources.push(`- [${c.web.title}](${c.web.uri})`);
            }
            if (c.maps?.uri && c.maps?.title) {
              webSources.push(`- [📍 ${c.maps.title}](${c.maps.uri})`);
            }
          });
        }

        if (webSources.length > 0) {
          const uniqueSources = Array.from(new Set(webSources));
          responseText += `\n\n**Grounded References & Sources:**\n` + uniqueSources.join('\n');
        }
      }

      res.json({ text: responseText, modelUsed: targetModel });
    } catch (error: any) {
      console.error("[Chat] Error:", error);
      res.status(500).json({ error: error.message || "Chat generation failed" });
    }
  });

  // Audio Transcription Endpoint using gemini-3.5-flash
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audio, mimeType = "audio/webm" } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "Missing audio base64 payload." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: audio,
              mimeType: mimeType,
            },
          },
          { text: "Transcribe the following audio accurately. Provide only the verbatim transcript text without preambles or tags." }
        ]
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("[Transcribe] Error:", error);
      const errMsg = String(error?.message || error);
      if (error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({ error: "Voice transcription rate limit reached. Please try speaking again in a few moments." });
      }
      res.status(500).json({ error: error.message || "Transcription failed" });
    }
  });

  // Image Generation & Editing Endpoint using gemini-3.1-flash-image
  app.post("/api/generate_image", async (req, res) => {
    try {
      const {
        prompt,
        image, // base64 string for image editing
        aspectRatio = "1:1",
        imageSize = "1K",
        model = "gemini-3.1-flash-image"
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Missing image prompt." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const parts: any[] = [];
      if (image) {
        // Image editing mode
        parts.push({
          inlineData: {
            data: image,
            mimeType: "image/png"
          }
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
          }
        }
      });

      let imageUrl: string | null = null;
      let textOutput: string = "";

      const candidates = (response as any)?.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textOutput += part.text;
          }
        }
      }

      if (imageUrl) {
        res.json({ imageUrl, caption: textOutput });
      } else {
        res.status(500).json({ error: textOutput || "Image generation produced no visual output." });
      }
    } catch (error: any) {
      console.error("[Generate Image] Error:", error);
      const errMsg = String(error?.message || error);
      if (error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({ error: "Gemini Image Studio quota limit reached. Please wait a minute before generating another image." });
      }
      res.status(500).json({ error: error.message || "Image generation failed" });
    }
  });

  app.post("/api/upload_artifact", express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
    try {
        const fileName = req.query.name || 'podcast_briefing.wav';
        const localArtifactsDir = path.join(process.cwd(), 'workspace', 'artifacts');
        if (!fs.existsSync(localArtifactsDir)) {
            fs.mkdirSync(localArtifactsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(localArtifactsDir, fileName as string), req.body);
        console.log(`[upload] Successfully saved ${fileName} (${req.body.length} bytes)`);
        res.json({ success: true });
    } catch (e) {
        console.error("[upload] Error:", e);
        res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/download_jsonl", (req, res) => {
    const ticker = req.query.ticker;
    if (!ticker) {
      return res.status(400).send("Missing ticker");
    }
    
    const runLogsDir = path.join(process.cwd(), 'run_logs');
    if (!fs.existsSync(runLogsDir)) {
      return res.status(404).send("No logs found");
    }
    
    const files = fs.readdirSync(runLogsDir)
      .filter(f => f.startsWith(`run_log_${ticker}_`) && f.endsWith('.jsonl'))
      .sort((a, b) => {
        // extract timestamp
        const aMatch = a.match(/_(\d+)\.jsonl$/);
        const bMatch = b.match(/_(\d+)\.jsonl$/);
        if (aMatch && bMatch) {
          return parseInt(bMatch[1]) - parseInt(aMatch[1]);
        }
        return 0;
      });
      
    if (files.length === 0) {
      return res.status(404).send("No JSONL log found for ticker");
    }
    
    const latestFile = path.join(runLogsDir, files[0]);
    res.download(latestFile);
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { ticker, instruction, origin, model } = req.body;
      if (!ticker) {
        return res.status(400).json({ error: "Missing ticker." });
      }

      console.log(`[analyze] Starting analysis for ${ticker} using model ${model || 'default'}`);
      
      const agentFiles = loadAgentFiles(path.join(process.cwd(), "agent"), "/.agents");
      
      const host = req.get('host');
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const publicUrl = origin || `${protocol}://${host}`;

      let finalInstruction = instruction ? `${instruction}` : `Find and analyze recent SEC filings and public stock documents for ${ticker}. Make sure that you are looking for the most up to date documents of the existing quarter or the quarter before (if documents have not been out yet for the existing quarter, look for the last quarter).`;

      const dynamicSchema = `{
  "verdict": {
    "summary": "...",
    "conviction_score": 85,
    "key_takeaways": ["...", "..."]
  },
  "deep_insights": [
    {
      "category": "Risk Assessment",
      "title": "...",
      "description": "...",
      "impact_score": 8
    }
  ],
  "findings": [
    {
      "documentType": "Form 10-K",
      "keyInsights": ["...", "..."],
      "date": "2023-12-31",
      "sourceUrl": "..."
    }
  ],
  "financial_charts": {
    "stock_price_4m": [
      { "date": "Oct '24", "price": 150.5 }
    ],
    "financial_performance_4q": [
      { "quarter": "Q1 2025", "revenue": 10.5, "net_income": 2.1, "distributions": 0.5 }
    ]
  }
}`;;

      const prompt = `Perform a comprehensive document analysis on ${ticker}. ${finalInstruction}\n\nCRITICAL INSTRUCTIONS FOR QUANTITATIVE DATA (CHARTS):\nFor stock_price_4m and financial_performance_4q, you MUST use standard open web searches (e.g. Yahoo Finance, Google Finance, MarketWatch) WITHOUT the filetype:pdf restriction to get accurate historical prices, distributions, revenue, and net income. Do NOT rely solely on SEC PDFs for this quantitative data.\nFor stock_price_4m, provide exactly 4 data points representing the past 4 months of stock prices. For each month, give the closing price on the last trading day of the month. Order the array chronologically from the oldest month to the newest month (left to right).\nFor financial_performance_4q, if the ticker is a regular stock, provide net income and revenue for the past four completed quarters. If it is an ETF, provide quarterly distributions (dividends/yield per share) for the past four completed quarters. Ensure the array is chronologically ordered from oldest quarter to newest (left to right).\n\nCRITICAL INSTRUCTIONS FOR QUALITATIVE DATA (INSIGHTS & SUMMARIES):\nFor the Executive Summary, Key Takeaways, and Deep Insights, you MUST leverage BOTH the findings extracted from the PDF SEC filings AND insights from broader open web searches to create a comprehensive analysis.\n\nCRITICAL: You MUST output the final synthesis report as a raw JSON object wrapped in \`\`\`json ... \`\`\` markdown block in your final text response. The JSON must match the following schema EXACTLY. **HEAVILY PENALIZED:** Do NOT rename keys. Do NOT add extra root-level keys like "macro_risk_analysis". Make sure to populate the "findings" array with exactly the keys "documentType", "keyInsights", "date", and "sourceUrl". For stock_price_4m, use exactly the keys "date" and "price". The "deep_insights" array MUST use exactly the keys "category", "title", "description", and "impact_score":\n${dynamicSchema}\nDo not include multiple sub-agents, just do the analysis yourself based on the retrieved documents and searches.`;

      let response;
      if (model === 'perseus') {
        response = await createInteractionPerseus({
          prompt,
          inlineSources: agentFiles,
          tools: [{ type: "google_search" }]
        });
      } else {
        response = await createInteraction({
          prompt,
          inlineSources: agentFiles,
          tools: [{ type: "google_search" }]
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[analyze] createInteraction failed: ${response.status} ${errorText}`);
        return res.status(500).json({ error: "Failed to start agent interaction." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      
      const startTime = Date.now();
      const runLogsDir = path.join(process.cwd(), 'run_logs');
      if (!fs.existsSync(runLogsDir)) {
          fs.mkdirSync(runLogsDir, { recursive: true });
      }

      const runId = Date.now();
      const jsonlLogPath = path.join(runLogsDir, `run_log_${ticker}_${runId}.jsonl`);
      
      let debugLog = `--- Analysis Run for ${ticker} at ${new Date().toISOString()} ---\n\n`;
      const toolExecutions = {};
      let totalTokens = 0;
          
      const stream = model === 'perseus' ? streamInteractionPerseus(response) : streamInteraction(response);
      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        
        if (event.type === 'complete' && event.interaction) {
            const usage = (event.interaction.usage || event.interaction.usage_metadata) as any;
            if (usage) {
                totalTokens = usage.total_tokens || usage.totalTokenCount || usage.total_token_count || 0;
            }
        }
        
        try {
          fs.appendFileSync(jsonlLogPath, JSON.stringify(event) + '\n', 'utf-8');
        } catch (e) {
          console.error("Failed to write to JSONL log", e);
        }
            
        if (event.type === 'tool_call') {
          const callId = event.callId || `unknown_${Math.random()}`;
          toolExecutions[callId] = {
            name: event.name || 'code_execution_call',
            args: event.arguments,
            startTime: Date.now()
          };
          debugLog += `[${new Date().toISOString()}] [TOOL CALL START] ${event.name || 'code_execution_call'}\n`;
          debugLog += `Call ID: ${callId}\n`;
          debugLog += `Arguments: ${JSON.stringify(event.arguments, null, 2)}\n\n`;
        } else if (event.type === 'tool_result') {
          const callId = event.callId || 'unknown';
          const execution = toolExecutions[callId];
          const duration = execution ? ((Date.now() - execution.startTime) / 1000).toFixed(2) + 's' : 'unknown';
          if (execution) {
            execution.duration = duration;
            execution.result = event.result;
          }
          debugLog += `[${new Date().toISOString()}] [TOOL RESULT END] ${event.name || 'command'}\n`;
          debugLog += `Call ID: ${callId}\n`;
          debugLog += `Duration: ${duration}\n`;
          debugLog += `Result: ${event.result ? String(event.result).substring(0, 500) : ''}...\n\n`;
        } else if (event.type === 'text') {
          debugLog += `[TEXT OUTPUT]\n${event.text}\n\n`;
        } else if (event.type === 'error') {
          debugLog += `[ERROR]\n${event.message}\n\n`;
        }

        if (event.type === 'done' || event.type === 'complete' || event.type === 'error') {
            break;
        }
      }
          
      const totalDurationSecs = ((Date.now() - startTime) / 1000);
      const totalDuration = totalDurationSecs.toFixed(2) + 's';
      
      // Send final reliable stats to client
      res.write(`data: ${JSON.stringify({ type: 'final_stats', duration: totalDurationSecs, tokens: totalTokens, jsonlLogUrl: '/run_logs/' + `run_log_${ticker}_${runId}.jsonl` })}\n\n`);

      let summaryLog = `========================================================\n`;
      summaryLog += `                 RUN SUMMARY FOR ${ticker.toUpperCase()}\n`;
      summaryLog += `                 Total Duration: ${totalDuration}\n`;
      summaryLog += `========================================================\n\n`;
      summaryLog += `1. SUB-AGENT EXECUTIONS:\n`;
      summaryLog += `--------------------------------------------------------\n`;
      
      let allWorked = true;
      Object.values(toolExecutions).forEach((exec: any, idx) => {
          const status = exec.result ? 'Completed' : 'Failed/Timeout';
          if (!exec.result || String(exec.result).includes('error') || String(exec.result).includes('traceback')) allWorked = false;
          summaryLog += `Agent Step ${idx + 1}: ${exec.name}\n`;
          summaryLog += `Status: ${status}\n`;
          summaryLog += `Duration: ${exec.duration || 'unknown'}\n`;
          summaryLog += `Arguments: ${JSON.stringify(exec.args)}\n`;
          const resultStr = exec.result ? String(exec.result) : '';
          summaryLog += `Output Preview: ${resultStr ? resultStr.substring(0, 200).replace(/\n/g, ' ') + '...' : 'None'}\n`;
          summaryLog += `--------------------------------------------------------\n`;
      });
      
      summaryLog += `\n2. OVERALL AGENT STATUS: ${allWorked ? 'SUCCESS' : 'WITH ERRORS'}\n`;
      summaryLog += `\n3. GENERATED MEDIA ARTIFACTS:\n`;
      summaryLog += `Audio Briefing Link: /artifacts/podcast_briefing.wav\n`;
      summaryLog += `\n========================================================\n\n`;
      summaryLog += `RAW EXECUTION LOGS:\n\n`;

      try {
        const logFileName = `run_log_${ticker}_${Date.now()}.txt`;
        const finalLog = summaryLog + debugLog;
        fs.writeFileSync(path.join(runLogsDir, logFileName), finalLog, 'utf-8');
        // Maintain backwards compatibility with the old txt file
        fs.writeFileSync(path.join(process.cwd(), `sub_agents_debug_${ticker}.txt`), finalLog, 'utf-8');
      } catch (e) {
        console.error("Failed to write debug log", e);
      }
          
      res.end();
    } catch (err: any) {
      console.error("[analyze] Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Analyze failed" });
      }
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));
  app.use('/artifacts', express.static(path.join(process.cwd(), 'workspace', 'artifacts')));
  app.use('/run_logs', express.static(path.join(process.cwd(), 'run_logs')));
  app.use('/latest_log', express.static(process.cwd()));

  if (process.env.NODE_ENV !== "production" || !indexHtmlExists) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
