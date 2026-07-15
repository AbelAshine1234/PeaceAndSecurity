import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export function DashboardPagination({
  page,
  totalPages,
  total,
  onPageChange,
  limit,
  onLimitChange,
}: DashboardPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
      <div className="flex items-center gap-2 order-2 sm:order-1">
        <span className="text-[12px] md:text-[13px] text-slate-600 font-medium">
          Rows per page:
        </span>
        <Select
          value={String(limit)}
          onValueChange={(v) => onLimitChange(Number(v))}
        >
          <SelectTrigger className="h-[30px] w-auto gap-2 rounded-md border-none bg-slate-100/80 hover:bg-slate-200/80 text-[12px] md:text-[13px] font-medium shadow-none focus:ring-0">
            <SelectValue placeholder={limit} />
          </SelectTrigger>
          <SelectContent className="rounded border-slate-100 shadow-xl min-w-[70px]">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-slate-400 font-bold ml-2 hidden sm:inline">
          Total: {total}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-3 order-1 sm:order-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-30"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;

            // Show first, last, and active page + neighbors
            // We'll use CSS to hide some of these on mobile for a cleaner look
            const isNearCurrent = Math.abs(pageNum - page) <= 1;
            const isFirstOrLast = pageNum === 1 || pageNum === totalPages;

            if (!isNearCurrent && !isFirstOrLast && totalPages > 5) {
              if (pageNum === 2 && page > 3) return <span key="start-dots" className="px-1 text-slate-400 text-xs hidden sm:inline">...</span>;
              if (pageNum === totalPages - 1 && page < totalPages - 2) return <span key="end-dots" className="px-1 text-slate-400 text-xs hidden sm:inline">...</span>;
              return null;
            }

            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 text-[12px] md:text-[13px] font-bold transition-all rounded",
                  page === pageNum
                    ? "bg-primary text-white hover:bg-primary/90 border-none shadow-md shadow-primary/20 scale-105"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary",
                  // On mobile, hide pages that aren't first, last, or current
                  !isFirstOrLast && pageNum !== page && "hidden sm:flex"
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-30"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
