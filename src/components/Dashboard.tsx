import React from "react";
import { cn } from "../lib/utils";
import { TOOL_DEFINITIONS, type ToolId } from "../lib/toolConfig";

interface DashboardProps {
  onToolClick: (toolId: ToolId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onToolClick }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Build your task</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Các công cụ bên dưới chỉ giữ lại những luồng thực sự dùng được. Công cụ nào cần nguồn sẽ
          dùng toàn bộ tài liệu đã tải lên, công cụ nào không cần nguồn sẽ cho phép bạn nhập văn
          bản trực tiếp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {TOOL_DEFINITIONS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolClick(tool.id)}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                <tool.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{tool.shortLabel}</h3>
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full",
                      tool.requiresDocuments
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {tool.requiresDocuments ? "Uses Library" : "Input Text"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
