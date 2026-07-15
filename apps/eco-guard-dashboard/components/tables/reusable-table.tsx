import { Column, ReusableTableProps } from "./types";
import { cn } from "@/lib/utils";

export function ReusableTable<T>({
  data,
  columns,
  getRowKey,
  emptyText = "No data available",
  isLoading = false,
}: ReusableTableProps<T>) {
  return (
    <div className="overflow-hidden bg-white rounded border border-slate-100 shadow">
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 md:px-6 py-4 md:py-5 text-left text-[10px] md:text-xs font-extrabold text-foreground uppercase tracking-widest border-b-2 border-primary/10 whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row)}
                  className="hover:bg-primary/5 transition-colors group even:bg-slate-50/50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 md:px-6 py-3 md:py-4 text-[11px] md:text-sm font-medium text-slate-700 whitespace-nowrap">
                      {col.render
                        ? col.render(row, index)
                        : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
