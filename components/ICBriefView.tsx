import ReactMarkdown from "react-markdown";

interface ICBriefViewProps {
  content: string;
  version: number;
  generatedAt: string;
  generatedBy: string;
}

export function ICBriefView({
  content,
  version,
  generatedAt,
  generatedBy,
}: ICBriefViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Version {version}</span>
        <span>&middot;</span>
        <span>
          Generated {new Date(generatedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>&middot;</span>
        <span>{generatedBy}</span>
      </div>
      <article className="prose prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
