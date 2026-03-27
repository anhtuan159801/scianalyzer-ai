import React, { useState } from "react";
import {
  PenTool, 
  FileSearch, 
  Search, 
  Hash, 
  Quote, 
  Database, 
  ShieldCheck,
  Sparkles,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { analyzeDocument, type ApiKeys } from "../services/llmService";
import Markdown from "react-markdown";
import { motion } from "motion/react";

interface ToolViewProps {
  tool: string;
  documentText: string;
  apiKeys: ApiKeys;
}

export const ToolView: React.FC<ToolViewProps> = ({ tool, documentText, apiKeys }) => {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleAction = async (customPrompt?: string) => {
    setIsLoading(true);
    setResult(null);
    try {
      let finalPrompt = customPrompt || "";
      
      switch (tool) {
        case "writer":
        case "report":
          finalPrompt = `Dựa trên tài liệu này, hãy viết một đoạn văn về chủ đề: ${prompt || "tổng quan nghiên cứu"}. Hãy viết theo phong cách học thuật.`;
          break;
        case "lit-review":
        case "review":
          finalPrompt = "Hãy thực hiện một bài đánh giá tài liệu (Literature Review) chi tiết cho tài liệu này, bao gồm: bối cảnh, các nghiên cứu liên quan được trích dẫn, và vị trí của nghiên cứu này trong lĩnh vực.";
          break;
        case "topics":
        case "search":
          finalPrompt = "Hãy liệt kê 10 chủ đề hoặc từ khóa quan trọng nhất trong tài liệu này và giải thích ngắn gọn tại sao chúng quan trọng.";
          break;
        case "paraphraser":
          finalPrompt = `Hãy diễn đạt lại (paraphrase) đoạn văn sau đây từ tài liệu để tránh đạo văn nhưng vẫn giữ nguyên ý nghĩa khoa học: ${prompt}`;
          break;
        case "citation":
          finalPrompt = "Hãy tạo trích dẫn cho tài liệu này theo các định dạng: APA, MLA, và Vancouver.";
          break;
        case "extract":
        case "analyse":
          finalPrompt = "Hãy trích xuất các dữ liệu định lượng, con số, bảng biểu hoặc các phát hiện cụ thể từ tài liệu này dưới dạng danh sách.";
          break;
        case "detector":
          finalPrompt = "Hãy phân tích văn bản này và đưa ra đánh giá về khả năng văn bản được tạo bởi AI (AI-generated content). Đưa ra tỷ lệ phần trăm ước tính và các dấu hiệu nhận biết.";
          break;
        case "diagram":
          finalPrompt = "Hãy mô tả cấu trúc của một sơ đồ (diagram) hoặc quy trình (workflow) dựa trên nội dung tài liệu này. Sử dụng ngôn ngữ mô tả rõ ràng để người dùng có thể vẽ lại.";
          break;
      }

      const response = await analyzeDocument(documentText, finalPrompt, apiKeys);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getToolInfo = () => {
    switch (tool) {
      case "writer": return { icon: PenTool, title: "AI Writer", desc: "Viết nội dung học thuật mới dựa trên tài liệu." };
      case "lit-review": return { icon: FileSearch, title: "Literature Review", desc: "Phân tích sâu bối cảnh và vị trí nghiên cứu." };
      case "topics": return { icon: Search, title: "Find Topics", desc: "Khám phá các chủ đề và từ khóa cốt lõi." };
      case "paraphraser": return { icon: Hash, title: "Paraphraser", desc: "Diễn đạt lại văn bản để tránh đạo văn." };
      case "citation": return { icon: Quote, title: "Citation Generator", desc: "Tạo trích dẫn chuẩn khoa học." };
      case "extract": return { icon: Database, title: "Extract Data", desc: "Trích xuất các con số và dữ liệu quan trọng." };
      case "detector": return { icon: ShieldCheck, title: "AI Detector", desc: "Kiểm tra khả năng văn bản do AI tạo ra." };
      default: return { icon: Sparkles, title: "AI Tool", desc: "Công cụ hỗ trợ nghiên cứu." };
    }
  };

  const info = getToolInfo();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <info.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{info.title}</h3>
            <p className="text-sm text-gray-500">{info.desc}</p>
          </div>
        </div>

        {(tool === "writer" || tool === "paraphraser") && (
          <div className="mb-4">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={tool === "writer" ? "Nhập chủ đề bạn muốn viết..." : "Dán đoạn văn bạn muốn diễn đạt lại..."}
              className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] transition-all"
            />
          </div>
        )}

        <button 
          onClick={() => handleAction()}
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? "Đang xử lý..." : "Bắt đầu phân tích"}
        </button>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kết quả phân tích</span>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Đã sao chép" : "Sao chép"}
            </button>
          </div>
          <div className="p-6 prose prose-sm max-w-none text-gray-700 leading-relaxed markdown-body">
            <Markdown>{result}</Markdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};
