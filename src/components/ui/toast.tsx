import { CircleCheck } from "lucide-react";

type ToastProps = {
  message: string;
};

/** A short "done" note at the top that fades by itself; pure CSS, no timers. */
export const Toast = ({ message }: ToastProps) => (
  <div
    role="status"
    className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+12px)] left-1/2 z-50 flex animate-toast items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
  >
    <CircleCheck size={18} className="text-[#5ee0a8]" />
    {message}
  </div>
);
