import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { summarizeDocument, type ApiKeys } from "../services/llmService";
import { cn } from "../lib/utils";

interface SummaryPanelProps {
  documentText: string;
  existingSummary?: string;
  onSummaryGenerated: (summary: string) => void;
  apiKeys: ApiKeys;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ 
  documentText, 
  existingSummary, 
  onSummaryGenerated,
  apiKeys
}) => {
  const [summary, setSummary] = useState<string | null>(existingSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await summarizeDocument(documentText, apiKeys);
      const finalSummary = result || "Không thể tạo tóm tắt.";
      setSummary(finalSummary);
      onSummaryGenerated(finalSummary);
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi tạo tóm tắt. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentText && !existingSummary && !summary) {
      generateSummary();
    } else if (existingSummary) {
      setSummary(existingSummary);
    }
  }, [documentText, existingSummary]);

  return (
    <div className="flex flex-col h-full bg-white border-l">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Tóm tắt thông minh</h3>
        </div>
        <button 
          onClick={generateSummary}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
          title="Làm mới tóm tắt"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Đang phân tích sâu...</h4>
            <p className="text-gray-500 text-sm max-w-xs">
              Hệ thống đang đọc và tổng hợp các ý chính từ tài liệu của bạn.
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tạo tóm tắt</h4>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button 
              onClick={generateSummary}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : summary ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed markdown-body"
          >
            <Markdown>{summary}</Markdown>
          </motion.div>
        ) : null}
      </div>

      <div className="p-4 border-t bg-blue-50/50">
        <div className="flex items-center gap-2 text-blue-700">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-medium">Tóm tắt dựa trên 100% nội dung tài liệu</span>
        </div>
      </div>
    </div>
  );
};
