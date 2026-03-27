import React, { Suspense, lazy, useMemo, useState } from "react";
import {
  ArrowLeft,
  Book,
  BookOpen,
  ChevronRight,
  Database,
  FileSearch,
  FileText,
  Hash,
  Home,
  Info,
  Library,
  MessageSquare,
  Notebook,
  PenTool,
  Quote,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dashboard } from "./components/Dashboard";
import { FileUpload } from "./components/FileUpload";
import { cn } from "./lib/utils";
import type { ApiKeys } from "./services/llmService";

const ChatPanel = lazy(() =>
  import("./components/ChatPanel").then((module) => ({ default: module.ChatPanel })),
);
const SettingsModal = lazy(() =>
  import("./components/SettingsModal").then((module) => ({ default: module.SettingsModal })),
);
const SummaryPanel = lazy(() =>
  import("./components/SummaryPanel").then((module) => ({ default: module.SummaryPanel })),
);
const ToolView = lazy(() =>
  import("./components/ToolView").then((module) => ({ default: module.ToolView })),
);

interface DocumentData {
  filename: string;
  text: string;
  numpages: number;
  info?: Record<string, unknown>;
  summary?: string;
}

type RightTab = "chat" | "summary" | "info";
type LeftTab =
  | "dashboard"
  | "library"
  | "notebooks"
  | "gallery"
  | "writer"
  | "chat-pdf"
  | "lit-review"
  | "topics"
  | "paraphraser"
  | "citation"
  | "extract"
  | "detector"
  | "diagram"
  | "search"
  | "review"
  | "report"
  | "analyse";

const DOCUMENT_TOOL_TABS = new Set<LeftTab>([
  "writer",
  "chat-pdf",
  "lit-review",
  "topics",
  "paraphraser",
  "citation",
  "extract",
  "detector",
  "diagram",
  "search",
  "review",
  "report",
  "analyse",
]);

const DOCUMENT_PREVIEW_TABS = new Set<LeftTab>(["library"]);

function getToolLabel(tab: LeftTab) {
  switch (tab) {
    case "writer":
    case "report":
      return "AI Writer";
    case "chat-pdf":
      return "Chat with PDF";
    case "lit-review":
    case "review":
      return "Literature Review";
    case "topics":
    case "search":
      return "Find Topics";
    case "paraphraser":
      return "Paraphraser";
    case "citation":
      return "Citation Generator";
    case "extract":
    case "analyse":
      return "Extract Data";
    case "detector":
      return "AI Detector";
    case "diagram":
      return "Generate Diagram";
    default:
      return "Document Analysis";
  }
}

function LoadingPane() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-gray-400">Đang tải...</div>
  );
}

export default function App() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("summary");
  const [leftTab, setLeftTab] = useState<LeftTab>("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    groq: localStorage.getItem("groq_api_key") || "",
    openrouter: localStorage.getItem("openrouter_api_key") || "",
    huggingface: localStorage.getItem("huggingface_api_key") || "",
    gemini: localStorage.getItem("gemini_api_key") || "",
  });

  const currentDoc = selectedDocIndex !== null ? documents[selectedDocIndex] ?? null : null;
  const needsDocument = DOCUMENT_TOOL_TABS.has(leftTab) || DOCUMENT_PREVIEW_TABS.has(leftTab);

  const metadataEntries = useMemo(() => {
    if (!currentDoc?.info) {
      return [];
    }

    return Object.entries(currentDoc.info).filter(
      ([, value]) => typeof value === "string" && value,
    ) as Array<[string, string]>;
  }, [currentDoc]);

  const handleUploadSuccess = (newDocs: DocumentData[]) => {
    setDocuments((prev) => {
      const next = [...prev, ...newDocs];
      if (selectedDocIndex === null && newDocs.length > 0) {
        setSelectedDocIndex(prev.length);
      }
      return next;
    });
    setLeftTab("library");
  };

  const updateDocumentSummary = (index: number, summary: string) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], summary };
      return next;
    });
  };

  const saveApiKeys = () => {
    localStorage.setItem("groq_api_key", apiKeys.groq);
    localStorage.setItem("openrouter_api_key", apiKeys.openrouter);
    localStorage.setItem("huggingface_api_key", apiKeys.huggingface);
    localStorage.setItem("gemini_api_key", apiKeys.gemini);
    setIsSettingsOpen(false);
  };

  const renderCenterContent = () => {
    if (leftTab === "dashboard") {
      return (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full"
        >
          <Dashboard onToolClick={(toolId) => setLeftTab(toolId as LeftTab)} />
        </motion.div>
      );
    }

    if (leftTab === "notebooks" || leftTab === "gallery") {
      return (
        <motion.div
          key={leftTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="h-full flex flex-col items-center justify-center text-center p-8"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            {leftTab === "notebooks" ? (
              <Notebook className="w-10 h-10 text-gray-300" />
            ) : (
              <Users className="w-10 h-10 text-gray-300" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {leftTab === "notebooks" ? "My Notebooks" : "Agent Gallery"}
          </h3>
          <p className="text-gray-500 max-w-md">
            Khu vực này chưa được triển khai chức năng. Hiện tại bạn có thể tải tài liệu lên và
            dùng các công cụ phân tích ở thanh bên trái.
          </p>
        </motion.div>
      );
    }

    if (!currentDoc && leftTab === "library") {
      return (
        <motion.div
          key="upload"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="h-full flex flex-col items-center justify-center"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Thư viện tài liệu</h2>
            <p className="text-gray-500">Tải lên các tài liệu nghiên cứu để bắt đầu phân tích.</p>
          </div>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </motion.div>
      );
    }

    if (!currentDoc && needsDocument) {
      return (
        <motion.div
          key={`empty-${leftTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="h-full flex flex-col items-center justify-center text-center p-8"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa chọn tài liệu</h3>
          <p className="text-gray-500 max-w-sm">
            Hãy mở thư viện và tải lên hoặc chọn một tệp PDF trước khi dùng công cụ này.
          </p>
          <button
            onClick={() => setLeftTab("library")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
          >
            Mở thư viện
          </button>
        </motion.div>
      );
    }

    if (!currentDoc) {
      return null;
    }

    return (
      <motion.div
        key={`${leftTab}-${selectedDocIndex ?? "none"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {getToolLabel(leftTab)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{currentDoc.filename}</h2>
              <p className="text-gray-500 mt-1">Số trang: {currentDoc.numpages}</p>
            </div>
            <button
              onClick={() => {
                setLeftTab("dashboard");
                setSelectedDocIndex(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>

          <div className="space-y-8">
            {DOCUMENT_TOOL_TABS.has(leftTab) ? (
              <Suspense fallback={<LoadingPane />}>
                <ToolView tool={leftTab} documentText={currentDoc.text} apiKeys={apiKeys} />
              </Suspense>
            ) : (
              <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Nội dung tài liệu
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed max-h-[600px] overflow-y-auto pr-4 custom-scrollbar whitespace-pre-wrap">
                  {currentDoc.text.length > 50000
                    ? `${currentDoc.text.slice(0, 50000)}...`
                    : currentDoc.text}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SciAnalyzer AI</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm trong thư viện..."
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm border-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
            />
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
            <span className="text-sm font-bold">AT</span>
          </button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        <aside
          className={cn(
            "bg-white border-r transition-all duration-300 flex flex-col",
            isSidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden",
          )}
        >
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <nav className="space-y-1">
              <button
                onClick={() => setLeftTab("dashboard")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "dashboard"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={() => setLeftTab("library")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "library"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Library className="w-4 h-4" />
                <span>My Library</span>
              </button>

              {documents.length > 0 && (
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-100 ml-2">
                  {documents.map((doc, idx) => (
                    <button
                      key={`${doc.filename}-${idx}`}
                      onClick={() => {
                        setLeftTab("library");
                        setSelectedDocIndex(idx);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-xs truncate transition-all",
                        selectedDocIndex === idx
                          ? "bg-blue-100 text-blue-800 font-semibold"
                          : "text-gray-500 hover:bg-gray-50",
                      )}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setLeftTab("notebooks")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "notebooks"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Notebook className="w-4 h-4" />
                <span>My Notebooks</span>
              </button>
              <button
                onClick={() => setLeftTab("gallery")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "gallery"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Users className="w-4 h-4" />
                <span>Agent Gallery</span>
              </button>

              <div className="h-px bg-gray-100 my-4 mx-2" />

              <button
                onClick={() => setLeftTab("writer")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "writer"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <PenTool className="w-4 h-4" />
                <span>AI Writer</span>
              </button>
              <button
                onClick={() => setLeftTab("chat-pdf")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "chat-pdf"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with PDF</span>
              </button>
              <button
                onClick={() => setLeftTab("lit-review")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "lit-review"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <FileSearch className="w-4 h-4" />
                <span>Literature Review</span>
              </button>
              <button
                onClick={() => setLeftTab("topics")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "topics"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Search className="w-4 h-4" />
                <span>Find Topics</span>
              </button>
              <button
                onClick={() => setLeftTab("paraphraser")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "paraphraser"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Hash className="w-4 h-4" />
                <span>Paraphraser</span>
              </button>
              <button
                onClick={() => setLeftTab("citation")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "citation"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Quote className="w-4 h-4" />
                <span>Citation Generator</span>
              </button>
              <button
                onClick={() => setLeftTab("extract")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "extract"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Database className="w-4 h-4" />
                <span>Extract Data</span>
              </button>
              <button
                onClick={() => setLeftTab("detector")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  leftTab === "detector"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>AI Detector</span>
              </button>

              <div className="h-px bg-gray-100 my-4 mx-2" />

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Cấu hình API</span>
              </button>
            </nav>
          </div>

          <div className="p-4 border-t">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Dung lượng
              </p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[15%]" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Đã dùng 150MB / 1GB</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 flex relative overflow-hidden bg-gray-50">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-l-0 rounded-r-lg p-1 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronRight
              className={cn("w-4 h-4 transition-transform", isSidebarOpen && "rotate-180")}
            />
          </button>

          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">{renderCenterContent()}</AnimatePresence>
          </div>

          {currentDoc && needsDocument && (
            <aside className="w-[400px] bg-white border-l flex flex-col">
              <div className="flex border-b">
                <button
                  onClick={() => setRightTab("summary")}
                  className={cn(
                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    rightTab === "summary"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  Tóm tắt
                </button>
                <button
                  onClick={() => setRightTab("chat")}
                  className={cn(
                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    rightTab === "chat"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  <MessageSquare className="w-3 h-3" />
                  Hỏi đáp
                </button>
                <button
                  onClick={() => setRightTab("info")}
                  className={cn(
                    "flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    rightTab === "info"
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  <Info className="w-3 h-3" />
                  Thông tin
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {rightTab === "summary" && (
                    <motion.div
                      key={`summary-${selectedDocIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <Suspense fallback={<LoadingPane />}>
                        <SummaryPanel
                          documentText={currentDoc.text}
                          existingSummary={currentDoc.summary}
                          onSummaryGenerated={(summary) =>
                            updateDocumentSummary(selectedDocIndex!, summary)
                          }
                          apiKeys={apiKeys}
                        />
                      </Suspense>
                    </motion.div>
                  )}

                  {rightTab === "chat" && (
                    <motion.div
                      key={`chat-${selectedDocIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <Suspense fallback={<LoadingPane />}>
                        <ChatPanel
                          documentText={currentDoc.text}
                          summary={currentDoc.summary}
                          apiKeys={apiKeys}
                        />
                      </Suspense>
                    </motion.div>
                  )}

                  {rightTab === "info" && (
                    <motion.div
                      key={`info-${selectedDocIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full p-6"
                    >
                      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                        <Book className="w-4 h-4" />
                        Metadata tài liệu
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                            Tên file
                          </p>
                          <p className="text-sm font-medium text-gray-800 break-all">
                            {currentDoc.filename}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                            Số trang
                          </p>
                          <p className="text-sm font-medium text-gray-800">{currentDoc.numpages}</p>
                        </div>
                        {metadataEntries.map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-4 rounded-xl border">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                              {key}
                            </p>
                            <p className="text-sm font-medium text-gray-800 break-all">{value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          )}
        </section>
      </main>

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          onSave={saveApiKeys}
        />
      </Suspense>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }

        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3 {
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #111827;
        }
        .markdown-body h1 {
          font-size: 1.25rem;
        }
        .markdown-body h2 {
          font-size: 1.125rem;
        }
        .markdown-body h3 {
          font-size: 1rem;
        }
        .markdown-body p {
          margin-bottom: 1em;
        }
        .markdown-body ul,
        .markdown-body ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .markdown-body li {
          margin-bottom: 0.5em;
        }
        .markdown-body strong {
          font-weight: 600;
          color: #111827;
        }
      `}</style>
    </div>
  );
}
