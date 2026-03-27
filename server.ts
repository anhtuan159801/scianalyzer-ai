import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import { createRequire } from "module";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

type ProviderName = "groq" | "openrouter" | "huggingface" | "gemini";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GenerateRequestBody {
  text?: string;
  prompt?: string;
  summary?: string;
  messages?: Message[];
  apiKeys?: Partial<Record<ProviderName, string>>;
}

interface ProviderConfig {
  name: ProviderName;
  model: string;
  apiKey?: string;
}

const MAX_DOCUMENT_CHARS = 30000;
const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
  },
  {
    name: "openrouter",
    model: process.env.OPENROUTER_MODEL || "openrouter/auto",
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  {
    name: "huggingface",
    model: process.env.HUGGINGFACE_MODEL || "meta-llama/Llama-3.1-8B-Instruct:cerebras",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  },
  {
    name: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
  },
];

function getDocumentContext(text: string) {
  return text.slice(0, MAX_DOCUMENT_CHARS);
}

function buildMessages(body: GenerateRequestBody) {
  const documentContext = getDocumentContext(body.text || "");
  const baseInstruction = `Bạn là trợ lý phân tích tài liệu khoa học.
Chỉ trả lời dựa trên nội dung tài liệu được cung cấp.
Nếu tài liệu không chứa thông tin, hãy nói rõ điều đó.
Không tự bịa trích dẫn, số liệu hay kết luận.
${body.summary ? `Bản tóm tắt hiện có: ${body.summary}` : "Chưa có bản tóm tắt."}
Nội dung tài liệu (30k ký tự đầu):
${documentContext}`;

  const priorMessages = (body.messages || []).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }));

  return {
    systemInstruction: baseInstruction,
    messages: [
      ...priorMessages,
      {
        role: "user" as const,
        content: body.prompt || "",
      },
    ],
  };
}

async function callOpenAiCompatible(
  provider: ProviderConfig,
  body: GenerateRequestBody,
  runtimeApiKey?: string,
) {
  const apiKey = runtimeApiKey || provider.apiKey;
  if (!apiKey) {
    throw new Error(`Missing API key for ${provider.name}`);
  }

  const { systemInstruction, messages } = buildMessages(body);

  let url = "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider.name === "groq") {
    url = "https://api.groq.com/openai/v1/chat/completions";
  } else if (provider.name === "openrouter") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers["HTTP-Referer"] = process.env.APP_URL || "http://localhost:3000";
    headers["X-Title"] = "SciAnalyzer AI";
  } else {
    url = "https://router.huggingface.co/v1/chat/completions";
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        ...messages,
      ],
      temperature: 0.4,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string } | string;
  };

  if (!response.ok) {
    const providerError =
      typeof data.error === "string" ? data.error : data.error?.message || response.statusText;
    throw new Error(`${provider.name}: ${providerError}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.name}: empty response`);
  }

  return {
    text: content,
    provider: provider.name,
    model: provider.model,
  };
}

async function callGemini(body: GenerateRequestBody, runtimeApiKey?: string) {
  const apiKey = runtimeApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing API key for gemini");
  }

  const { systemInstruction, messages } = buildMessages(body);
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction,
      temperature: 0.4,
    },
  });

  if (!response.text) {
    throw new Error("gemini: empty response");
  }

  return {
    text: response.text,
    provider: "gemini" as const,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  };
}

async function generateWithFallback(body: GenerateRequestBody) {
  const runtimeKeys = body.apiKeys || {};
  const errors: string[] = [];

  for (const provider of PROVIDERS) {
    try {
      if (provider.name === "gemini") {
        return await callGemini(body, runtimeKeys.gemini);
      }

      return await callOpenAiCompatible(provider, body, runtimeKeys[provider.name]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
    }
  }

  throw new Error(`All providers failed: ${errors.join(" | ")}`);
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "2mb" }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 15 * 1024 * 1024,
    },
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (typeof pdfParse !== "function") {
        throw new Error("PDF parser not initialized correctly");
      }

      const parsed = await pdfParse(req.file.buffer);

      return res.json({
        filename: Buffer.from(req.file.originalname, "latin1").toString("utf8"),
        text: parsed.text,
        info: parsed.info,
        metadata: parsed.metadata,
        numpages: parsed.numpages,
      });
    } catch (error) {
      const err = error as Error & { name?: string };
      const errorName = err.name || "";
      const errorMessage = err.message || "";
      const errorText = `${errorName} ${errorMessage}`;

      let userMessage = "Không thể phân tích tệp PDF.";
      if (/PasswordException|password/i.test(errorText)) {
        userMessage =
          "Tài liệu PDF đang được bảo vệ bằng mật khẩu. Hãy gỡ mật khẩu trước khi tải lên.";
      } else if (/InvalidPDFException|Invalid PDF/i.test(errorText)) {
        userMessage = "Tài liệu PDF không hợp lệ hoặc đã bị hỏng.";
      } else if (/FormatError/i.test(errorText)) {
        userMessage = "Định dạng PDF không được hỗ trợ hoặc tệp đã bị hỏng.";
      } else if (/AbortException/i.test(errorText)) {
        userMessage = "Quá trình phân tích PDF đã bị hủy.";
      } else if (/UnknownErrorException|getException/i.test(errorText)) {
        userMessage = "Đã xảy ra lỗi khi trích xuất dữ liệu từ tệp PDF.";
      }

      console.error("Parse error:", error);

      return res.status(500).json({
        error: userMessage,
        details: err.message || String(error),
      });
    }
  });

  app.post("/api/llm/generate", async (req, res) => {
    try {
      const body = req.body as GenerateRequestBody;

      if (!body.text || !body.prompt) {
        return res.status(400).json({ error: "Missing text or prompt" });
      }

      const result = await generateWithFallback(body);
      return res.json(result);
    } catch (error) {
      console.error("LLM error:", error);
      const message = error instanceof Error ? error.message : "All providers failed";
      return res.status(500).json({ error: message });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api/")) {
      console.error("API error:", err);
      return res.status(500).json({
        error: err.message || "Internal Server Error",
      });
    }

    next(err);
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
