import React, { useMemo, useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import { analyzeDocument, type ApiKeys } from "../services/llmService";
import { TOOL_CONFIG, type ToolId } from "../lib/toolConfig";

interface DocumentData {
  filename: string;
  text: string;
  numpages: number;
}

interface ToolViewProps {
  tool: ToolId;
  documents: DocumentData[];
  apiKeys: ApiKeys;
}

const MAX_CORPUS_CHARS = 28000;
const MAX_CHARS_PER_DOC = 6000;

function buildCorpus(documents: DocumentData[]) {
  let remaining = MAX_CORPUS_CHARS;

  return documents
    .slice(0, 8)
    .map((doc, index) => {
      if (remaining <= 0) {
        return null;
      }

      const excerpt = doc.text.slice(0, Math.min(MAX_CHARS_PER_DOC, remaining));
      remaining -= excerpt.length;

      return `### Tài liệu ${index + 1}: ${doc.filename}
Số trang: ${doc.numpages}
Nội dung trích:
${excerpt}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildPrompt(tool: ToolId, userInput: string, hasDocuments: boolean) {
  switch (tool) {
    case "writer":
      return hasDocuments
        ? `Dựa trên toàn bộ tài liệu nguồn đã cung cấp, hãy viết nội dung học thuật theo yêu cầu sau: ${userInput || "Viết một đoạn tổng quan nghiên cứu ngắn gọn, có cấu trúc rõ ràng."}`
        : `Không có tài liệu nguồn. Hãy viết nội dung học thuật theo yêu cầu sau và nói rõ đây là bản nháp không grounded theo tài liệu: ${userInput || "Viết một đoạn tổng quan nghiên cứu ngắn gọn, có cấu trúc rõ ràng."}`;
    case "chat-pdf":
      return `Hãy trả lời câu hỏi sau dựa trên toàn bộ các tài liệu đã cung cấp. Nếu tài liệu không đủ thông tin thì nói rõ điều đó: ${userInput || "Tóm tắt nội dung chính của toàn bộ thư viện tài liệu."}`;
    case "lit-review":
      return `Hãy viết một literature review tổng hợp dựa trên toàn bộ tài liệu đã tải lên.
Yêu cầu bổ sung của người dùng: ${userInput || "Tập trung vào bối cảnh nghiên cứu, phương pháp, phát hiện chính, hạn chế và khoảng trống nghiên cứu."}
Kết quả cần có:
1. Bối cảnh chung
2. Nhóm hướng nghiên cứu chính
3. So sánh phương pháp giữa các tài liệu
4. Điểm nhất quán và điểm mâu thuẫn
5. Hạn chế lặp lại giữa các nghiên cứu
6. Khoảng trống nghiên cứu`;
    case "matrix":
      return `Hãy tạo một literature review matrix bằng bảng markdown dựa trên toàn bộ tài liệu đã tải lên.
Tiêu chí ưu tiên của người dùng: ${userInput || "Không có tiêu chí bổ sung."}
Mỗi hàng là một tài liệu. Các cột cần có:
- Nguồn / tài liệu
- Năm
- Mục tiêu nghiên cứu
- Phương pháp / thiết kế nghiên cứu
- Mẫu / dữ liệu / ngữ cảnh
- Kết quả chính
- Hạn chế
- Khoảng trống hoặc giá trị cho nghiên cứu tiếp theo
Sau bảng, thêm phần tóm tắt ngắn các mẫu hình nổi bật trên toàn bộ ma trận. Nếu thiếu dữ liệu ở cột nào thì ghi "Không rõ".`;
    case "topics":
      return `Hãy phân tích toàn bộ tài liệu đã tải lên và liệt kê 10 chủ đề hoặc cụm từ khóa quan trọng nhất.
Yêu cầu bổ sung: ${userInput || "Ưu tiên các chủ đề có tính tổng quát cao và lặp lại giữa nhiều tài liệu."}
Mỗi mục cần có:
- tên chủ đề
- tài liệu nào liên quan
- vì sao chủ đề đó quan trọng`;
    case "paraphraser":
      return `Hãy diễn đạt lại đoạn văn sau bằng văn phong học thuật rõ ràng, giữ nguyên ý nghĩa nhưng tránh trùng lặp câu chữ. Nếu cần, hãy đưa ra 2 phiên bản khác nhau:
${userInput}`;
    case "citation":
      return hasDocuments && !userInput.trim()
        ? `Hãy tạo danh sách trích dẫn cho toàn bộ tài liệu đã tải lên theo các định dạng APA, MLA và Vancouver. Nếu metadata thiếu, hãy nêu rõ phần không xác định.`
        : `Hãy tạo trích dẫn theo APA, MLA và Vancouver từ thông tin sau. Nếu dữ liệu thiếu thì nêu rõ phần còn thiếu:
${userInput}`;
    case "extract":
      return `Hãy trích xuất dữ liệu và phát hiện quan trọng từ toàn bộ tài liệu đã tải lên.
Yêu cầu bổ sung: ${userInput || "Ưu tiên số liệu định lượng, thiết kế nghiên cứu, dataset, biến đầu ra, và kết quả nổi bật."}
Trả lời dưới dạng danh sách có cấu trúc theo từng tài liệu rồi phần tổng hợp chéo tài liệu.`;
    case "detector":
      return `Hãy phân tích đoạn văn sau và đánh giá mức độ có khả năng được tạo bởi AI.
Kết quả cần có:
1. Đánh giá tổng quan
2. Các dấu hiệu ngôn ngữ đáng chú ý
3. Những điểm không thể kết luận chắc chắn
4. Mức ước tính phần trăm chỉ mang tính tham khảo
Đoạn văn:
${userInput}`;
    default:
      return userInput;
  }
}

export const ToolView: React.FC<ToolViewProps> = ({ tool, documents, apiKeys }) => {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userInput, setUserInput] = useState("");
  const info = TOOL_CONFIG[tool];
  const hasDocuments = documents.length > 0;

  const corpusText = useMemo(() => buildCorpus(documents), [documents]);

  const handleAction = async () => {
    if (info.acceptsUserText && (tool === "paraphraser" || tool === "detector") && !userInput.trim()) {
      setResult("Vui lòng nhập văn bản trước khi chạy công cụ này.");
      return;
    }

    if (info.requiresDocuments && !hasDocuments) {
      setResult("Công cụ này cần ít nhất một tài liệu trong thư viện.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const prompt = buildPrompt(tool, userInput.trim(), hasDocuments);
      const contextText =
        hasDocuments && corpusText
          ? corpusText
          : `Người dùng không cung cấp tài liệu nguồn. Hãy xử lý dựa trên yêu cầu sau:\n${userInput.trim()}`;

      const response = await analyzeDocument(contextText, prompt, apiKeys);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;

    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <info.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{info.title}</h3>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white border text-gray-600">
            {documents.length} tài liệu trong thư viện
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white border text-gray-600">
            {info.requiresDocuments ? "Dùng toàn bộ thư viện" : "Không bắt buộc tài liệu"}
          </span>
        </div>

        {info.acceptsUserText && (
          <div className="mb-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={info.placeholder}
              className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] transition-all"
            />
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? "Đang xử lý..." : info.primaryAction}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Kết quả phân tích
            </span>
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
