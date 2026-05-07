"use client";

import { useState, useRef } from "react";

interface DocumentUploadProps {
  onUploadSuccess: (documentId: string, fileName: string, chunkCount: number) => void;
}

export default function DocumentUpload({
  onUploadSuccess,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    fileName: string;
    chunkCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    const validTypes = ["application/pdf", "text/plain", "text/markdown", "application/json"];
    const maxSize = 50 * 1024 * 1024; // 50 MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF, TXT, or MD file");
      return;
    }

    if (file.size > maxSize) {
      setError("File size must be less than 50 MB");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const successMsg = {
        message: `Document uploaded! ${data.chunkCount} chunks indexed`,
        fileName: data.fileName,
        chunkCount: data.chunkCount,
      };

      setSuccess(successMsg);
      onUploadSuccess(data.documentId, data.fileName, data.chunkCount);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      {/* Drag and drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-all p-8 text-center ${
          dragActive
            ? "border-blue-400 bg-blue-500/10"
            : "border-slate-600 bg-slate-700/20 hover:border-slate-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          accept=".pdf,.txt,.md,.json"
          disabled={uploading}
          className="sr-only"
          id="file-upload"
        />

        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm font-medium text-white mb-1">
            {uploading ? "Uploading..." : "Drag and drop your file here"}
          </p>
          <p className="text-xs text-slate-400">
            or click to select from your computer
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Supported: PDF, TXT, Markdown (max 50 MB)
          </p>
        </label>

        {uploading && (
          <div className="absolute inset-0 rounded-xl bg-black/30 flex items-center justify-center">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/50 p-3 animate-in fade-in-50 duration-300">
          <p className="text-sm text-green-200">✅ {success.message}</p>
          <p className="text-xs text-green-300/70 mt-1">
            {success.fileName} is now ready for queries
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-3 animate-in fade-in-50 duration-300">
          <p className="text-sm text-red-200">❌ {error}</p>
        </div>
      )}

      {/* File input button (alternative) */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-600 transition-all font-medium text-sm"
      >
        {uploading ? "Uploading..." : "Choose File"}
      </button>
    </div>
  );
}
