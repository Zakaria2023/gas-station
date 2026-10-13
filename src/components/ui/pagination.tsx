import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCount } from "@/utils/text";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** The link for a page number, keeping whatever else is in the URL. */
  hrefFor: (page: number) => string;
};

const BUTTON =
  "flex min-h-11 items-center gap-1 rounded-control bg-surface px-4 text-sm font-bold text-ink shadow-card hover:bg-hover";

/** Newer and older pages; right to left, so "newer" (back) points right. */
export const Pagination = ({ page, pageCount, hrefFor }: PaginationProps) =>
  pageCount <= 1 ? null : (
    <nav aria-label="الصفحات" className="flex items-center justify-between gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={BUTTON}>
          <ChevronRight size={18} />
          الأحدث
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted tabular">
        صفحة {formatCount(page)} من {formatCount(pageCount)}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={BUTTON}>
          الأقدم
          <ChevronLeft size={18} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
