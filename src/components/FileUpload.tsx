import React, { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface FileUploadProps {
  onUploadSuccess: (data: any[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length === 0) {
      setError("Vui lòng chọn ít nhất một file PDF.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress({ current: 0, total: pdfFiles.length });

    const results = [];
    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      setUploadProgress({ current: i + 1, total: pdfFiles.length });
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload file ${file.name} thất bại`);
        }

        const data = await response.json();
        results.push(data);
      } catch (err: any) {
        console.error(err);
        setError(`Lỗi khi tải file ${file.name}: ${err.message}`);
      }
    }

    if (results.length > 0) {
      onUploadSuccess(results);
    }
    setIsLoading(false);
    setUploadProgress(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
          isDragging ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-gray-400 bg-white",
          isLoading && "pointer-events-none opacity-60"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          accept=".pdf"
          multiple
        />

        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">
              Đang phân tích tài liệu ({uploadProgress?.current}/{uploadProgress?.total})...
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tải lên tài liệu nghiên cứu</h3>
            <p className="text-gray-500 text-center max-w-sm">
              Kéo thả các file PDF vào đây hoặc click để chọn từ máy tính
            </p>
          </>
        )}

        {error && (
          <div className="mt-4 flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
