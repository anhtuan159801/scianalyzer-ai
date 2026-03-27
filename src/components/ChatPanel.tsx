import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import Markdown from "react-markdown";
import { chatWithDocument, type ApiKeys } from "../services/llmService";
import { cn } from "../lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  documentText: string;
  summary?: string;
  apiKeys: ApiKeys;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ documentText, summary, apiKeys }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Chào bạn. Tôi đã sẵn sàng hỗ trợ phân tích tài liệu này. Bạn muốn hỏi điều gì?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    if (!apiKeys.groq && !apiKeys.openrouter && !apiKeys.huggingface && !apiKeys.gemini) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thiếu API key LLM. Hãy mở phần Cấu hình API và nhập ít nhất một khóa trước khi chat.",
        },
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithDocument(documentText, userMessage, apiKeys, summary, messages);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response || "Tôi chưa thể trả lời ở thời điểm này.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Đã có lỗi khi kết nối tới Gemini. Hãy kiểm tra API key và thử lại.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l">
      <div className="p-4 border-b flex items-center gap-2 bg-gray-50/50">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Hỏi đáp AI</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 max-w-[90%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "user" ? "bg-blue-100" : "bg-gray-100",
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none",
              )}
            >
              <div className="markdown-body prose prose-sm max-w-none">
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-gray-100 text-gray-400 text-sm italic">
              Đang suy nghĩ...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Hỏi về tài liệu này..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none min-h-[44px] max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          AI có thể mắc sai lầm. Hãy kiểm tra lại các thông tin quan trọng.
        </p>
      </div>
    </div>
  );
};
