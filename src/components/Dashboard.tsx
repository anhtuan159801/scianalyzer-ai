import React from "react";
import { 
  BookOpen, 
  PenTool, 
  Share2, 
  Search, 
  Database, 
  FileCheck, 
  FileText, 
  BarChart3,
  Zap,
  Library,
  GraduationCap,
  Globe,
  Code,
  FileSearch,
  FileJson,
  Presentation,
  FileCode,
  Image as ImageIcon,
  Layout as LayoutIcon,
  PieChart
} from "lucide-react";
import { cn } from "../lib/utils";

interface ToolItem {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  id?: string;
}

const actionTools: ToolItem[] = [
  { id: "lit-review", icon: BookOpen, label: "Review Literature", color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "writer", icon: PenTool, label: "Write a Draft", color: "text-red-600", bgColor: "bg-red-50" },
  { id: "diagram", icon: Share2, label: "Generate Diagram", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  { id: "search", icon: Search, label: "Search Papers", color: "text-pink-600", bgColor: "bg-pink-50" },
  { id: "extract", icon: Database, label: "Extract Data", color: "text-green-600", bgColor: "bg-green-50" },
  { id: "review", icon: FileCheck, label: "Review my Writing", color: "text-orange-600", bgColor: "bg-orange-50" },
  { id: "report", icon: FileText, label: "Write a Report", color: "text-rose-600", bgColor: "bg-rose-50" },
  { id: "analyse", icon: BarChart3, label: "Analyse Data", color: "text-amber-600", bgColor: "bg-amber-50" },
];

const sourceTools: ToolItem[] = [
  { icon: Zap, label: "Deep Review", color: "text-blue-500", bgColor: "bg-blue-50" },
  { icon: Library, label: "Zotero Library", color: "text-red-500", bgColor: "bg-red-50" },
  { icon: GraduationCap, label: "Mendeley Library", color: "text-orange-500", bgColor: "bg-orange-50" },
  { icon: Globe, label: "Pubmed", color: "text-cyan-600", bgColor: "bg-cyan-50" },
  { icon: Search, label: "Google Scholar", color: "text-blue-600", bgColor: "bg-blue-50" },
  { icon: FileSearch, label: "ArXiv", color: "text-red-600", bgColor: "bg-red-50" },
  { icon: Code, label: "Python Library", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { icon: FileJson, label: "Grants.gov", color: "text-indigo-600", bgColor: "bg-indigo-50" },
];

const outputTools: ToolItem[] = [
  { icon: FileText, label: "Word document", color: "text-blue-700", bgColor: "bg-blue-50" },
  { icon: Presentation, label: "PPT presentation", color: "text-orange-600", bgColor: "bg-orange-50" },
  { icon: FileCode, label: "LaTeX Manuscript", color: "text-gray-700", bgColor: "bg-gray-50" },
  { icon: ImageIcon, label: "LaTeX Poster", color: "text-red-700", bgColor: "bg-red-50" },
  { icon: BarChart3, label: "Data Visualisation", color: "text-blue-500", bgColor: "bg-blue-50" },
  { icon: FileCheck, label: "PDF Report", color: "text-red-600", bgColor: "bg-red-50" },
  { icon: LayoutIcon, label: "Website", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  { icon: PieChart, label: "Infographic", color: "text-green-600", bgColor: "bg-green-50" },
];

interface DashboardProps {
  onToolClick: (toolId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onToolClick }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold text-gray-500 mb-2">Build your task</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* I WANT TO */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">I WANT TO</h3>
          <div className="space-y-3">
            {actionTools.map((tool, i) => (
              <button 
                key={i}
                onClick={() => tool.id && onToolClick(tool.id)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", tool.bgColor)}>
                  <tool.icon className={cn("w-5 h-5", tool.color)} />
                </div>
                <span className="text-sm font-medium text-gray-700">{tool.label}</span>
              </button>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Show More
          </button>
        </div>

        {/* USE */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">USE</h3>
          <div className="space-y-3">
            {sourceTools.map((tool, i) => (
              <button 
                key={i}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", tool.bgColor)}>
                  <tool.icon className={cn("w-5 h-5", tool.color)} />
                </div>
                <span className="text-sm font-medium text-gray-700">{tool.label}</span>
              </button>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Show More
          </button>
        </div>

        {/* MAKE A */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">MAKE A</h3>
          <div className="space-y-3">
            {outputTools.map((tool, i) => (
              <button 
                key={i}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", tool.bgColor)}>
                  <tool.icon className={cn("w-5 h-5", tool.color)} />
                </div>
                <span className="text-sm font-medium text-gray-700">{tool.label}</span>
              </button>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            Show More
          </button>
        </div>
      </div>
    </div>
  );
};
