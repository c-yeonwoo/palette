/**
 * MessageComposer — F02 메시지 입력창
 * 채널별 placeholder + F03 content-guard 통합
 */
import { useState, useRef } from "react";
import { Send, AlertTriangle } from "lucide-react";
import { checkMessage } from "../../../lib/content-guard";
import type { Channel } from "../../../data/mock-conversations";
import { cn } from "../ui/utils";

const PLACEHOLDERS: Record<Channel, string> = {
  public:               "모두에게 보낼 메시지를 입력하세요",
  matchmaker_to_user:   "주선자만 볼 수 있는 귀띔이에요",
  user_to_matchmaker:   "주선자에게만 보내는 귀띔이에요",
};

interface MessageComposerProps {
  channel: Channel;
  onSend: (text: string) => void;
  className?: string;
}

export function MessageComposer({ channel, onSend, className }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const { warnings } = checkMessage(val);
    setWarning(warnings[0] ?? "");

    // auto-resize
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { ok } = checkMessage(trimmed);
    if (!ok) return;
    onSend(trimmed);
    setText("");
    setWarning("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className={cn("bg-surface border-t border-border-subtle", className)}>
      {/* 경고 배너 */}
      {warning && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-[hsl(42_92%_96%)] border-b border-[hsl(42_86%_82%)]">
          <AlertTriangle className="w-3.5 h-3.5 text-[hsl(42_72%_40%)] flex-shrink-0 mt-0.5" />
          <p className="text-caption text-[hsl(42_72%_40%)]">{warning}</p>
        </div>
      )}

      <div
        className="flex items-end gap-2 px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[channel]}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl px-3.5 py-2.5 text-body-sm",
            "bg-surface-sunken border border-border-subtle",
            "placeholder:text-text-tertiary text-text-primary",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.4)] focus:border-transparent",
            "transition-all max-h-[120px] overflow-y-auto",
          )}
          style={{ height: "42px" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !!warning}
          className={cn(
            "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all",
            text.trim() && !warning
              ? "bg-brand text-brand-foreground shadow-soft hover:bg-brand/90"
              : "bg-surface-sunken text-text-tertiary",
          )}
          aria-label="메시지 보내기"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
