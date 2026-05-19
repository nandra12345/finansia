"use client";

import { Bold, Italic, List, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
}

function runCommand(command: string) {
  document.execCommand(command);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (document.activeElement === editor) {
      return;
    }

    editor.innerHTML = value;
  }, [value]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/40 p-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => runCommand("bold")}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => runCommand("italic")}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => runCommand("underline")}>
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => runCommand("insertUnorderedList")}>
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        ref={editorRef}
        className="min-h-[260px] rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(event) => {
          onChange((event.target as HTMLDivElement).innerHTML);
        }}
      />

      <style jsx>{`
        div[contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

