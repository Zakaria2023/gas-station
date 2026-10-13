import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
    {icon && (
      <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
        {icon}
      </span>
    )}
    <p className="text-base font-bold text-ink">{title}</p>
    {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
