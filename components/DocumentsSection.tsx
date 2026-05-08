"use client";

import { useState } from "react";
import { DocumentUploader } from "./DocumentUploader";
import { Badge } from "@/components/ui/badge";

interface Doc {
  id: string;
  filename: string;
  documentType: string;
  extractedText: string | null;
  uploadedAt: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  TECHNICAL_REPORT: "Technical Report",
  FINANCIAL_REPORT: "Financial Report",
  REGULATORY_FILING: "Regulatory Filing",
  PPA: "PPA",
  CONCESSION_AGREEMENT: "Concession Agreement",
  IC_TEMPLATE: "IC Template",
  OTHER: "Other",
};

export function DocumentsSection({
  assetId,
  initialDocs,
}: {
  assetId: string;
  initialDocs: Doc[];
}) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);

  async function refreshDocs() {
    const res = await fetch(`/api/assets/${assetId}/documents`);
    if (res.ok) {
      setDocs(await res.json());
    }
  }

  return (
    <div className="space-y-4">
      <DocumentUploader assetId={assetId} onUploadComplete={refreshDocs} />

      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="rounded-lg border p-3 flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{doc.filename}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="text-xs">
                {doc.extractedText ? (
                  <span className="text-afcen-green-600">Extracted</span>
                ) : (
                  <span className="text-afcen-orange-600">Pending extraction</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
