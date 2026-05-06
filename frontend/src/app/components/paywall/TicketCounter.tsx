/**
 * TicketCounter — F13 헤더용 잔여 매칭권 표시
 */
import { Ticket } from "lucide-react";
import { cn } from "../ui/utils";

interface TicketCounterProps {
  balance: number;
  onClick?: () => void;
  className?: string;
}

export function TicketCounter({ balance, onClick, className }: TicketCounterProps) {
  const low = balance <= 1;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors",
        low ? "bg-[hsl(22_92%_96%)]" : "bg-surface shadow-hairline",
        className,
      )}
      aria-label={`매칭권 ${balance}개 보유`}
    >
      <Ticket className={cn("w-3.5 h-3.5", low ? "text-brand" : "text-text-secondary")} />
      <span className={cn("text-caption font-bold", low ? "text-brand" : "text-text-primary")}>
        {balance}
      </span>
    </button>
  );
}
