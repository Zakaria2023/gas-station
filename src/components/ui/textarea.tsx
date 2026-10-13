import { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = ({ invalid = false, className = "", ...props }: TextareaProps) => (
  <textarea
    aria-invalid={invalid || undefined}
    className={`w-full rounded-control border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-faint focus:outline-none focus:ring-4 focus:ring-primary/12 ${
      invalid ? "border-danger" : "border-hairline focus:border-primary"
    } ${className}`}
    {...props}
  />
);
