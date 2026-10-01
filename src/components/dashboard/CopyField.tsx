"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { copyToClipboard } from "@/lib/utils";

interface CopyFieldProps {
  readonly label: string;
  readonly value: string;
  readonly multiline?: boolean;
}

export function CopyField({ label, value, multiline = false }: CopyFieldProps): React.JSX.Element {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  async function handleCopy(): Promise<void> {
    const ok = await copyToClipboard(value);
    if (ok) {
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1_800);
    }
  }

  return (
    <div className="flex items-start gap-3">
      {multiline ? (
        <pre className="min-w-0 flex-1 overflow-x-auto rounded-md border border-white/[0.08] bg-[#0B0F1A] p-3 font-mono text-[12px] leading-relaxed text-[#C3CBDA]">
          {value}
        </pre>
      ) : (
        <code className="min-w-0 flex-1 truncate rounded-md border border-white/[0.08] bg-[#0B0F1A] px-3 py-2 font-mono text-[12.5px] text-[#C3CBDA]">
          {value}
        </code>
      )}

      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={`Copiar ${label}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.12] px-3.5 py-2 text-[13px] text-[#C3CBDA] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C6BFF]"
      >
        {isCopied ? (
          <Check className="size-3.5 text-[#86EFAC]" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
        {isCopied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export default CopyField;