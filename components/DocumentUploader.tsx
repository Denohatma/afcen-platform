"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentUploaderProps {
  assetId: string;
  onUploadComplete?: () => void;
}

const DOC_TYPES = [
  { value: "TECHNICAL_REPORT", label: "Technical Report" },
  { value: "FINANCIAL_REPORT", label: "Financial Report" },
  { value: "REGULATORY_FILING", label: "Regulatory Filing" },
  { value: "PPA", label: "PPA" },
  { value: "CONCESSION_AGREEMENT", label: "Concession Agreement" },
  { value: "IC_TEMPLATE", label: "IC Template" },
  { value: "OTHER", label: "Other" },
];

type UploadStatus = "idle" | "uploading" | "extracting" | "done" | "error";

export function DocumentUploader({
  assetId,
  onUploadComplete,
}: DocumentUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState("OTHER");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|xlsx|txt|csv)$/i)) {
      setError("Unsupported file type. Upload PDF, DOCX, XLSX, TXT, or CSV.");
      return;
    }
    setSelectedFile(file);
    setError(null);
  }, []);

  async function handleUpload() {
    if (!selectedFile) return;

    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", docType);

      setStatus("extracting");

      const res = await fetch(`/api/assets/${assetId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setStatus("done");
      setSelectedFile(null);
      onUploadComplete?.();

      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, XLSX, TXT, CSV
            </p>
          </div>
        )}

        <input
          type="file"
          accept=".pdf,.docx,.xlsx,.txt,.csv"
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Controls */}
      {selectedFile && (
        <div className="flex items-center gap-3">
          <Select value={docType} onValueChange={(v) => v && setDocType(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleUpload}
            disabled={status === "uploading" || status === "extracting"}
          >
            {status === "uploading"
              ? "Uploading..."
              : status === "extracting"
                ? "Extracting text..."
                : "Upload & Extract"}
          </Button>
        </div>
      )}

      {/* Status messages */}
      {status === "done" && (
        <p className="text-sm text-emerald-600">
          Document uploaded and text extracted successfully.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
