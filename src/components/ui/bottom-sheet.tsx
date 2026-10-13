"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * A panel that slides up from the bottom, where a thumb already is. Tapping
 * outside it or pressing Escape closes it; the page behind does not scroll.
 */
export const BottomSheet = ({ open, onClose, title, children }: BottomSheetProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-scrim"
      />
      <div className="pb-safe relative flex max-h-[88dvh] w-full max-w-xl animate-sheet-up flex-col rounded-t-[24px] bg-surface shadow-sheet lg:max-h-[80dvh] lg:animate-fade-in lg:rounded-[24px] lg:pb-2">
        <div className="flex justify-center pt-2.5 lg:hidden">
          <span className="h-1.5 w-10 rounded-full bg-hairline" />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-3">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-hairline-soft text-muted active:bg-hairline"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};
