"use client";

import { InputHTMLAttributes } from "react";

type DateOverlayProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

/**
 * The phone's own date input, invisible and stretched over its parent (which
 * must be `relative`). The tap lands on the real input, so iOS and Android
 * open their calendar natively — a script call to `showPicker()` from another
 * button is ignored by many phone browsers. Desktop Chrome only opens from its
 * small icon, so a click also asks for the picker, and the icon is stretched
 * over the whole box in globals.css.
 */
export const DateOverlay = ({ onClick, ...props }: DateOverlayProps) => (
  <input
    {...props}
    type="date"
    onClick={(event) => {
      try {
        event.currentTarget.showPicker?.();
      } catch {
        // Already open, or not allowed here: the tap itself still opens it.
      }
      onClick?.(event);
    }}
    className="date-overlay absolute inset-0 block h-full w-full cursor-pointer appearance-none text-base opacity-0"
  />
);
