import React from "react";
import { Info, Key, Shield, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ApiKeys } from "../services/llmService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  setApiKeys: React.Dispatch<React.SetStateAction<ApiKeys>>;
  onSave: () => void;
}

const fields: Array<{
  key: keyof ApiKeys;
  label: string;
  placeholder: string;
}> = [
  { key: "groq", label: "Groq API Key", placeholder: "gsk_..." },
  { key: "openrouter", label: "OpenRouter API Key", placeholder: "sk-or-..." },
  { key: "huggingface", label: "Hugging Face API Key", placeholder: "hf_..." },
  { key: "gemini", label: "Gemini API Key", placeholder: "AIza..." },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  setApiKeys,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Cấu hình API Keys</h3>
                <p className="text-xs text-gray-500">
                  Thứ tự fallback: Groq - OpenRouter - Hugging Face - Gemini
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Các khóa được lưu cục bộ trong trình duyệt. Ứng dụng sẽ tự động thử theo thứ tự ưu
                tiên và chỉ fallback sang provider kế tiếp nếu provider trước đó lỗi.
              </p>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={apiKeys[field.key]}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Lưu cấu hình
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
