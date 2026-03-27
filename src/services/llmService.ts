export interface ApiKeys {
  groq: string;
  openrouter: string;
  huggingface: string;
  gemini: string;
}

interface AnalyzeRequest {
  text: string;
  prompt: string;
  apiKeys: ApiKeys;
  summary?: string;
  messages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface AnalyzeResponse {
  text: string;
  provider: "groq" | "openrouter" | "huggingface" | "gemini";
  model: string;
}

async function requestLlm(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch("/api/llm/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Không thể tạo phản hồi từ LLM.");
  }

  return data as AnalyzeResponse;
}

export async function analyzeDocument(text: string, prompt: string, apiKeys: ApiKeys) {
  const result = await requestLlm({ text, prompt, apiKeys });
  return result.text;
}

export async function summarizeDocument(text: string, apiKeys: ApiKeys) {
  const prompt = `Hãy tóm tắt tài liệu này theo cấu trúc sau:
1. Tóm tắt ngắn gọn (plain language summary)
2. Vấn đề nghiên cứu chính
3. Các đóng góp chính
4. Phương pháp nghiên cứu
5. Kết quả quan trọng
6. Hạn chế`;

  const result = await requestLlm({ text, prompt, apiKeys });
  return result.text;
}

export async function chatWithDocument(
  text: string,
  question: string,
  apiKeys: ApiKeys,
  summary?: string,
  messages?: AnalyzeRequest["messages"],
) {
  const result = await requestLlm({
    text,
    prompt: question,
    apiKeys,
    summary,
    messages,
  });

  return result.text;
}
