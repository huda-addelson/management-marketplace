import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const first = total ? (currentPage - 1) * pageSize + 1 : 0;
  const last = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--line)] px-4 py-3.5 text-xs text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p>
        Menampilkan <strong className="text-[var(--ink)]">{first}-{last}</strong> dari{" "}
        <strong className="text-[var(--ink)]">{total}</strong> data
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        {onPageSizeChange ? (
          <Select
            aria-label="Jumlah data per halaman"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 w-[76px] rounded-[0.7rem] py-0 text-xs"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </Select>
        ) : null}
        <span className="min-w-[82px] text-center font-semibold">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
