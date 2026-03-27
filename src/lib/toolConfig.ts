import {
  BookOpen,
  Database,
  FileSearch,
  Hash,
  LayoutGrid,
  MessageSquare,
  PenTool,
  Quote,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type ToolId =
  | "writer"
  | "chat-pdf"
  | "lit-review"
  | "matrix"
  | "topics"
  | "paraphraser"
  | "citation"
  | "extract"
  | "detector";

export interface ToolDefinition {
  id: ToolId;
  icon: LucideIcon;
  title: string;
  shortLabel: string;
  description: string;
  requiresDocuments: boolean;
  acceptsUserText: boolean;
  primaryAction: string;
  placeholder?: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: "lit-review",
    icon: BookOpen,
    title: "Literature Review",
    shortLabel: "Literature Review",
    description: "Tổng hợp và đối chiếu toàn bộ tài liệu đã tải lên thành bài tổng quan.",
    requiresDocuments: true,
    acceptsUserText: true,
    primaryAction: "Tạo literature review",
    placeholder: "Nhập chủ đề, câu hỏi nghiên cứu hoặc góc nhìn bạn muốn tổng quan...",
  },
  {
    id: "matrix",
    icon: LayoutGrid,
    title: "Overview Matrix",
    shortLabel: "Overview Matrix",
    description: "Tạo ma trận tổng quan nhiều tài liệu theo cấu trúc review matrix học thuật.",
    requiresDocuments: true,
    acceptsUserText: true,
    primaryAction: "Tạo ma trận tổng quan",
    placeholder: "Nhập chủ đề hoặc tiêu chí ưu tiên của ma trận, ví dụ: vật liệu, thuật toán, nhóm bệnh, thước đo...",
  },
  {
    id: "writer",
    icon: PenTool,
    title: "AI Writer",
    shortLabel: "AI Writer",
    description: "Viết đoạn học thuật mới. Có thể dựa trên toàn bộ tài liệu hoặc chỉ theo prompt của bạn.",
    requiresDocuments: false,
    acceptsUserText: true,
    primaryAction: "Tạo nội dung",
    placeholder: "Nhập yêu cầu viết, ví dụ: viết phần giới thiệu, viết related work, viết abstract...",
  },
  {
    id: "chat-pdf",
    icon: MessageSquare,
    title: "Chat with Documents",
    shortLabel: "Chat with PDF",
    description: "Đặt câu hỏi và nhận câu trả lời dựa trên toàn bộ thư viện tài liệu đã tải lên.",
    requiresDocuments: true,
    acceptsUserText: true,
    primaryAction: "Đặt câu hỏi",
    placeholder: "Nhập câu hỏi bạn muốn hỏi trên toàn bộ tài liệu...",
  },
  {
    id: "topics",
    icon: Search,
    title: "Find Topics",
    shortLabel: "Find Topics",
    description: "Trích xuất chủ đề, hướng tiếp cận và cụm từ khóa nổi bật từ toàn bộ tài liệu.",
    requiresDocuments: true,
    acceptsUserText: true,
    primaryAction: "Phân tích chủ đề",
    placeholder: "Có thể nhập thêm góc nhìn, ví dụ: chỉ tập trung vào phương pháp, biến đầu ra, hoặc vấn đề nghiên cứu...",
  },
  {
    id: "extract",
    icon: Database,
    title: "Extract Data",
    shortLabel: "Extract Data",
    description: "Trích xuất dữ liệu, số liệu, so sánh hoặc phát hiện quan trọng từ toàn bộ tài liệu.",
    requiresDocuments: true,
    acceptsUserText: true,
    primaryAction: "Trích xuất dữ liệu",
    placeholder: "Nhập rõ dữ liệu cần lấy, ví dụ: sample size, dataset, độ chính xác, biến số lâm sàng...",
  },
  {
    id: "paraphraser",
    icon: Hash,
    title: "Paraphraser",
    shortLabel: "Paraphraser",
    description: "Diễn đạt lại đoạn văn do người dùng nhập, không phụ thuộc thư viện tài liệu.",
    requiresDocuments: false,
    acceptsUserText: true,
    primaryAction: "Paraphrase văn bản",
    placeholder: "Dán đoạn văn cần diễn đạt lại...",
  },
  {
    id: "citation",
    icon: Quote,
    title: "Citation Generator",
    shortLabel: "Citation Generator",
    description: "Tạo trích dẫn từ tài liệu đã tải hoặc từ metadata/bibliography người dùng nhập.",
    requiresDocuments: false,
    acceptsUserText: true,
    primaryAction: "Tạo citation",
    placeholder: "Dán DOI, tiêu đề, metadata tài liệu hoặc để trống để dùng tài liệu đã tải lên...",
  },
  {
    id: "detector",
    icon: ShieldCheck,
    title: "AI Detector",
    shortLabel: "AI Detector",
    description: "Đánh giá đoạn văn do người dùng nhập có dấu hiệu do AI tạo ra hay không.",
    requiresDocuments: false,
    acceptsUserText: true,
    primaryAction: "Phân tích văn bản",
    placeholder: "Dán đoạn văn cần kiểm tra...",
  },
];

export const TOOL_CONFIG = Object.fromEntries(
  TOOL_DEFINITIONS.map((tool) => [tool.id, tool]),
) as Record<ToolId, ToolDefinition>;
