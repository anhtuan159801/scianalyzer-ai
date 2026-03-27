import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { motion } from "motion/react";
import * as XLSX from "xlsx";
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

interface MatrixRow {
  source: string;
  title: string;
  year: string;
  objective: string;
  methodology: string;
  sample_or_context: string;
  key_findings: string;
  limitations: string;
  research_gap: string;
  topic_fit: string;
}

interface MatrixPayload {
  matrix: MatrixRow[];
  synthesis: string;
}

interface MatrixInput {
  criteria: string;
  topic: string;
  goal: string;
}

type SourceMode = "library" | "text";
type CitationStyle = "APA 7" | "MLA 9" | "Vancouver" | "IEEE" | "Chicago";

const MAX_CORPUS_CHARS = 28000;
const MAX_CHARS_PER_DOC = 6000;
const CITATION_STYLES: CitationStyle[] = ["APA 7", "MLA 9", "Vancouver", "IEEE", "Chicago"];

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

function buildPrompt(
  tool: ToolId,
  userInput: string,
  hasDocuments: boolean,
  sourceMode: SourceMode,
  citationStyle: CitationStyle,
) {
  switch (tool) {
    case "writer":
      return sourceMode === "library" && hasDocuments
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
      return `Hãy phân tích tài liệu này để điền chính xác một hàng trong literature review matrix.
Thông tin định hướng từ người dùng:
${userInput || "Không có tiêu chí bổ sung."}

Trả về DUY NHẤT một JSON object hợp lệ, không có markdown fence, không có giải thích ngoài JSON.
Schema bắt buộc:
{
  "source": "Tác giả, cơ quan hoặc nguồn tài liệu. Nếu không xác định được thì dùng tên file",
  "title": "Tiêu đề bài báo hoặc tài liệu. Nếu không xác định được thì ghi Không rõ",
  "year": "Năm công bố",
  "objective": "Mục tiêu nghiên cứu",
  "methodology": "Phương pháp hoặc thiết kế nghiên cứu",
  "sample_or_context": "Mẫu, dữ liệu hoặc ngữ cảnh nghiên cứu",
  "key_findings": "Kết quả chính",
  "limitations": "Hạn chế",
  "research_gap": "Khoảng trống hoặc giá trị tiếp theo. Nếu tác giả không nêu trực tiếp, hãy suy luận có cơ sở từ mục tiêu, phương pháp, mẫu, kết quả và hạn chế",
  "topic_fit": "Mức độ tương thích với đề tài của người dùng: Rất cao, Cao, Trung bình, Thấp, hoặc Chưa đánh giá; kèm 1 câu giải thích ngắn"
}

Không được bỏ trống field nào. Nếu thiếu dữ liệu ở ô nào thì ghi "Không rõ".`;
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
      return sourceMode === "library" && hasDocuments && !userInput.trim()
        ? `Hãy tạo danh sách trích dẫn cho toàn bộ tài liệu đã tải lên theo đúng duy nhất chuẩn ${citationStyle}.
Yêu cầu nghiêm ngặt:
- Không trộn nhiều chuẩn với nhau
- Không tự bịa metadata
- Giữ đúng thứ tự trường, dấu câu và cách viết hoa theo chuẩn ${citationStyle}
- Những thành phần cần in nghiêng theo chuẩn thì dùng markdown italic, ví dụ *Journal Title* hoặc *Book Title*
- Nếu thiếu metadata thì ghi rõ trường còn thiếu dưới mỗi mục
Trả về kết quả dưới dạng danh sách rõ ràng, mỗi tài liệu một mục.`
        : `Hãy tạo trích dẫn theo đúng duy nhất chuẩn ${citationStyle} từ thông tin sau.
Yêu cầu nghiêm ngặt:
- Không trộn nhiều chuẩn với nhau
- Không tự bịa metadata
- Giữ đúng thứ tự trường, dấu câu và cách viết hoa theo chuẩn ${citationStyle}
- Những thành phần cần in nghiêng theo chuẩn thì dùng markdown italic, ví dụ *Journal Title* hoặc *Book Title*
- Nếu dữ liệu thiếu thì nêu rõ phần còn thiếu
Thông tin đầu vào:
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

function buildMatrixInstruction(input: MatrixInput) {
  return [
    input.criteria ? `Tiêu chí ưu tiên của ma trận: ${input.criteria}` : "",
    input.topic ? `Tên đề tài của người dùng: ${input.topic}` : "",
    input.goal ? `Mục tiêu nghiên cứu của người dùng: ${input.goal}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const ToolView: React.FC<ToolViewProps> = ({ tool, documents, apiKeys }) => {
  const [result, setResult] = useState<string | null>(null);
  const [matrixPayload, setMatrixPayload] = useState<MatrixPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [matrixTopic, setMatrixTopic] = useState("");
  const [matrixGoal, setMatrixGoal] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("APA 7");
  const info = TOOL_CONFIG[tool];
  const hasDocuments = documents.length > 0;
  const canSelectSourceMode = tool === "writer" || tool === "citation";

  const corpusText = useMemo(() => buildCorpus(documents), [documents]);

  useEffect(() => {
    setResult(null);
    setMatrixPayload(null);
    setCopied(false);
    setUserInput("");
    setMatrixTopic("");
    setMatrixGoal("");
    setCitationStyle("APA 7");
    setSourceMode(tool === "writer" || tool === "citation" ? (hasDocuments ? "library" : "text") : "text");
  }, [tool, hasDocuments]);

  const handleAction = async () => {
    if (info.acceptsUserText && (tool === "paraphraser" || tool === "detector") && !userInput.trim()) {
      setResult("Vui lòng nhập văn bản trước khi chạy công cụ này.");
      return;
    }

    if (info.requiresDocuments && !hasDocuments) {
      setResult("Công cụ này cần ít nhất một tài liệu trong thư viện.");
      return;
    }

    if (sourceMode === "text" && (tool === "writer" || tool === "citation") && !userInput.trim()) {
      setResult("Vui lòng nhập nội dung hoặc metadata trước khi chạy công cụ này.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setMatrixPayload(null);

    try {
      if (tool === "matrix") {
        const matrix = await buildOverviewMatrix(documents, apiKeys, {
          criteria: userInput.trim(),
          topic: matrixTopic.trim(),
          goal: matrixGoal.trim(),
        });
        setMatrixPayload(matrix);
        setResult(matrix.synthesis || "Đã tạo ma trận tổng quan.");
      } else {
        const prompt = buildPrompt(tool, userInput.trim(), hasDocuments, sourceMode, citationStyle);
        const contextText =
          sourceMode === "library" && hasDocuments && corpusText
            ? corpusText
            : `Người dùng không cung cấp tài liệu nguồn. Hãy xử lý dựa trên yêu cầu sau:\n${userInput.trim()}`;

        const response = await analyzeDocument(contextText, prompt, apiKeys);
        setResult(response);
      }
    } catch (error) {
      console.error(error);
      setResult("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportMatrixToExcel = () => {
    if (!matrixPayload?.matrix.length) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      matrixPayload.matrix.map((row) => ({
        "Nguồn / tài liệu": row.source,
        "Tiêu đề": row.title,
        "Năm": row.year,
        "Mục tiêu nghiên cứu": row.objective,
        "Phương pháp / thiết kế nghiên cứu": row.methodology,
        "Mẫu / dữ liệu / ngữ cảnh": row.sample_or_context,
        "Kết quả chính": row.key_findings,
        "Hạn chế": row.limitations,
        "Khoảng trống / giá trị tiếp theo": row.research_gap,
        "Mức độ tương thích với đề tài": row.topic_fit,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Overview Matrix");

    if (matrixPayload.synthesis) {
      const synthesisSheet = XLSX.utils.aoa_to_sheet([["Tổng hợp nổi bật"], [matrixPayload.synthesis]]);
      XLSX.utils.book_append_sheet(workbook, synthesisSheet, "Synthesis");
    }

    XLSX.writeFile(workbook, "overview-matrix.xlsx");
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
            <info.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{info.title}</h3>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {canSelectSourceMode ? (
            <>
              <button
                type="button"
                onClick={() => setSourceMode("library")}
                disabled={!hasDocuments}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  sourceMode === "library"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-600"
                } ${!hasDocuments ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {documents.length} tài liệu trong thư viện
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("text")}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  sourceMode === "text"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-600"
                }`}
              >
                Không bắt buộc tài liệu
              </button>
            </>
          ) : (
            <>
              <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {documents.length} tài liệu trong thư viện
              </span>
              <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {info.requiresDocuments ? "Dùng toàn bộ thư viện" : "Không bắt buộc tài liệu"}
              </span>
            </>
          )}
        </div>

        {tool === "citation" && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Chọn chuẩn trích dẫn
            </p>
            <div className="flex flex-wrap gap-2">
              {CITATION_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setCitationStyle(style)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                    citationStyle === style
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        )}

        {tool === "matrix" && (
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tên đề tài của bạn
              </label>
              <input
                value={matrixTopic}
                onChange={(e) => setMatrixTopic(e.target.value)}
                placeholder="Ví dụ: Ứng dụng AI trong giáo dục đại học"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Mục tiêu nghiên cứu của bạn
              </label>
              <input
                value={matrixGoal}
                onChange={(e) => setMatrixGoal(e.target.value)}
                placeholder="Ví dụ: xác định hướng nghiên cứu, khoảng trống và tài liệu phù hợp nhất"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {info.acceptsUserText && (
          <div className="mb-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                tool === "matrix"
                  ? "Nhập tiêu chí ưu tiên của ma trận, ví dụ: chỉ tập trung vào phương pháp, biến số, kết quả học tập, đạo đức AI..."
                  : info.placeholder
              }
              className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isLoading ? "Đang xử lý..." : info.primaryAction}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b bg-gray-50 p-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Kết quả phân tích</span>
            <div className="flex items-center gap-4">
              {tool === "matrix" && matrixPayload?.matrix.length ? (
                <button
                  onClick={exportMatrixToExcel}
                  className="text-xs font-medium text-gray-500 transition-colors hover:text-blue-600"
                >
                  Xuất Excel
                </button>
              ) : null}
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 transition-colors hover:text-blue-600"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
            </div>
          </div>

          {tool === "matrix" && matrixPayload ? (
            <div className="space-y-6 p-6">
              {matrixPayload.matrix.length ? (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Nguồn / tài liệu</th>
                        <th className="px-4 py-3 text-left font-semibold">Tiêu đề</th>
                        <th className="px-4 py-3 text-left font-semibold">Năm</th>
                        <th className="px-4 py-3 text-left font-semibold">Mục tiêu nghiên cứu</th>
                        <th className="px-4 py-3 text-left font-semibold">Phương pháp</th>
                        <th className="px-4 py-3 text-left font-semibold">Mẫu / dữ liệu / ngữ cảnh</th>
                        <th className="px-4 py-3 text-left font-semibold">Kết quả chính</th>
                        <th className="px-4 py-3 text-left font-semibold">Hạn chế</th>
                        <th className="px-4 py-3 text-left font-semibold">Khoảng trống / giá trị tiếp theo</th>
                        <th className="px-4 py-3 text-left font-semibold">Mức độ tương thích với đề tài</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {matrixPayload.matrix.map((row, index) => (
                        <tr key={`${row.source}-${index}`} className="align-top">
                          <td className="px-4 py-3 font-medium text-gray-900">{row.source}</td>
                          <td className="px-4 py-3">{row.title}</td>
                          <td className="px-4 py-3">{row.year}</td>
                          <td className="px-4 py-3">{row.objective}</td>
                          <td className="px-4 py-3">{row.methodology}</td>
                          <td className="px-4 py-3">{row.sample_or_context}</td>
                          <td className="px-4 py-3">{row.key_findings}</td>
                          <td className="px-4 py-3">{row.limitations}</td>
                          <td className="px-4 py-3">{row.research_gap}</td>
                          <td className="px-4 py-3">{row.topic_fit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h4 className="mb-2 text-sm font-bold text-amber-900">Chưa tạo được hàng ma trận</h4>
                  <p className="text-sm leading-relaxed text-amber-800">
                    Hệ thống chưa trích xuất được đủ trường để dựng ma trận từ các tài liệu hiện tại. Nếu tình trạng này lặp lại, nhiều khả năng PDF không có text layer rõ hoặc nội dung trích quá nhiễu.
                  </p>
                </div>
              )}

              <div className="rounded-xl border bg-gray-50 p-5">
                <h4 className="mb-3 text-sm font-bold text-gray-900">Tổng hợp nổi bật</h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <Markdown>{matrixPayload.synthesis || "Không có thông tin đủ để tổng hợp."}</Markdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="markdown-body prose prose-sm max-w-none p-6 leading-relaxed text-gray-700">
              <Markdown>{result}</Markdown>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

async function buildOverviewMatrix(
  documents: DocumentData[],
  apiKeys: ApiKeys,
  matrixInput: MatrixInput,
): Promise<MatrixPayload> {
  const rows: MatrixRow[] = [];
  const matrixInstruction = buildMatrixInstruction(matrixInput);

  for (const document of documents) {
    const contextText = `Tên file: ${document.filename}
Số trang: ${document.numpages}
Nội dung trích:
${document.text.slice(0, MAX_CHARS_PER_DOC)}`;

    const response = await analyzeDocument(
      contextText,
      buildPrompt("matrix", matrixInstruction, true, "library", "APA 7"),
      apiKeys,
    );
    rows.push(parseMatrixRow(response, document.filename, matrixInput));
  }

  const synthesisSeed = rows
    .map(
      (row, index) =>
        `Tài liệu ${index + 1}: ${row.source} | ${row.title} | ${row.year} | ${row.objective} | ${row.methodology} | ${row.sample_or_context} | ${row.key_findings} | ${row.limitations} | ${row.research_gap} | ${row.topic_fit}`,
    )
    .join("\n");

  const synthesis = await analyzeDocument(
    synthesisSeed,
    `Hãy viết phần tổng hợp nổi bật từ ma trận tài liệu sau.
Yêu cầu bổ sung:
${matrixInstruction || "Không có yêu cầu bổ sung."}

Format kết quả bằng Markdown rõ ràng, dùng đúng các tiêu đề sau:
## Mẫu hình chung
- gạch đầu dòng ngắn, trực diện
## Khác biệt giữa các nghiên cứu
- gạch đầu dòng ngắn, trực diện
## Khoảng trống nghiên cứu quan trọng
- gạch đầu dòng ngắn, trực diện
## Hàm ý cho đề tài của người dùng
- gạch đầu dòng ngắn, trực diện

Nếu tác giả không nêu trực tiếp khoảng trống nghiên cứu, hãy suy luận có cơ sở từ mục tiêu, phương pháp, mẫu, kết quả và hạn chế.`,
    apiKeys,
  );

  return { matrix: rows, synthesis };
}

function parseMatrixRow(raw: string, fallbackSource: string, matrixInput: MatrixInput): MatrixRow {
  const normalized = raw.trim();
  const jsonCandidate = normalized.startsWith("{")
    ? normalized
    : normalized.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonCandidate) {
    return buildFallbackMatrixRow(fallbackSource, matrixInput);
  }

  try {
    const row = JSON.parse(jsonCandidate) as Partial<MatrixRow>;
    return {
      source: String(row.source || fallbackSource || "Không rõ"),
      title: String(row.title || "Không rõ"),
      year: String(row.year || "Không rõ"),
      objective: String(row.objective || "Không rõ"),
      methodology: String(row.methodology || "Không rõ"),
      sample_or_context: String(row.sample_or_context || "Không rõ"),
      key_findings: String(row.key_findings || "Không rõ"),
      limitations: String(row.limitations || "Không rõ"),
      research_gap: String(row.research_gap || "Không rõ"),
      topic_fit: String(
        row.topic_fit || (matrixInput.topic || matrixInput.goal ? "Chưa đánh giá rõ mức độ tương thích" : "Chưa đánh giá"),
      ),
    };
  } catch {
    return buildFallbackMatrixRow(fallbackSource, matrixInput);
  }
}

function buildFallbackMatrixRow(source: string, matrixInput: MatrixInput): MatrixRow {
  return {
    source: source || "Không rõ",
    title: "Không rõ",
    year: "Không rõ",
    objective: "Không rõ",
    methodology: "Không rõ",
    sample_or_context: "Không rõ",
    key_findings: "Không rõ",
    limitations: "Không rõ",
    research_gap: "Không rõ",
    topic_fit: matrixInput.topic || matrixInput.goal ? "Chưa đánh giá rõ mức độ tương thích" : "Chưa đánh giá",
  };
}
