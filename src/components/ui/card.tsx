import { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export const Card = ({
  title,
  description,
  action,
  children,
  className = "",
  padded = true,
}: CardProps) => (
  <section className={`rounded-card bg-surface shadow-card ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={padded ? "p-4" : ""}>{children}</div>
  </section>
);
