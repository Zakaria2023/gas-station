import { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  /** Quiet text on the other side of the title: the period, a count. */
  meta?: ReactNode;
  /** A link beside the meta, e.g. to the prices. */
  action?: ReactNode;
  /** The tiles; laid out by the card's own width, not the screen's. */
  children: ReactNode;
  /** Anything under the tiles: a notice, a folded breakdown. */
  footer?: ReactNode;
  className?: string;
};

/** The grid every summary uses: two tiles across in a narrow card, four in a wide one. */
export const TILE_GRID = "grid grid-cols-2 gap-2 @2xl:grid-cols-4";

/**
 * The one shape for a block of totals across the app: a title with its
 * period, then tiles. Sized by container, so it reads well in a phone, a side
 * column or across a desktop.
 */
export const SummaryCard = ({ title, meta, action, children, footer, className = "" }: SummaryCardProps) => (
  <section className={`@container rounded-card bg-surface shadow-card ${className}`}>
    <div className="flex items-center justify-between gap-3 px-4 pt-4">
      <h2 className="truncate text-base font-bold text-ink">{title}</h2>
      {(meta || action) && (
        <div className="flex min-w-0 items-center gap-3">
          {meta && <p className="truncate text-sm text-muted">{meta}</p>}
          {action}
        </div>
      )}
    </div>
    <div className="p-3">{children}</div>
    {footer}
  </section>
);
