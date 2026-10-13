import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const inputClasses = (invalid = false) =>
  `min-h-12 w-full rounded-control border bg-surface px-3.5 text-base text-ink placeholder:text-faint focus:outline-none focus:ring-4 focus:ring-primary/12 disabled:opacity-60 ${
    invalid ? "border-danger" : "border-hairline focus:border-primary"
  }`;

export const Input = ({ invalid = false, className = "", ...props }: InputProps) => (
  <input aria-invalid={invalid || undefined} className={`${inputClasses(invalid)} ${className}`} {...props} />
);
