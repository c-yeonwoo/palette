/**
 * ChannelSelector — F02 채팅 채널 드롭다운
 */
import { Globe, Lock, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  CHANNEL_OPTIONS,
  type Channel,
} from "../../../lib/conversation-visibility";
import { cn } from "../ui/utils";

const CHANNEL_ICONS: Record<Channel, React.ElementType> = {
  public: Globe,
  matchmaker_to_user: Lock,
  user_to_matchmaker: Lock,
};

interface ChannelSelectorProps {
  value: Channel;
  onChange: (ch: Channel) => void;
  className?: string;
}

export function ChannelSelector({ value, onChange, className }: ChannelSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = CHANNEL_OPTIONS.find((o) => o.value === value) ?? CHANNEL_OPTIONS[0];
  const Icon = CHANNEL_ICONS[value];

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface shadow-hairline text-body-sm font-medium text-text-primary hover:shadow-soft transition-shadow"
        aria-label="채널 선택"
        aria-expanded={open}
      >
        <Icon className="w-3.5 h-3.5 text-text-tertiary" />
        {current.label}
        <ChevronDown className={cn("w-3.5 h-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 z-20 w-64 bg-surface shadow-overlay rounded-xl overflow-hidden">
            {CHANNEL_OPTIONS.map((opt) => {
              const OptIcon = CHANNEL_ICONS[opt.value];
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                    isSelected ? "bg-brand-soft" : "hover:bg-surface-sunken",
                  )}
                >
                  <OptIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isSelected ? "text-brand" : "text-text-tertiary")} />
                  <div>
                    <p className={cn("text-body-sm font-semibold", isSelected ? "text-brand" : "text-text-primary")}>
                      {opt.label}
                    </p>
                    <p className="text-caption text-text-tertiary mt-0.5">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
