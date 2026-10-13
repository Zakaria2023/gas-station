import { CircleAlert } from "lucide-react";

type FormErrorProps = {
  message?: string;
};

export const FormError = ({ message }: FormErrorProps) =>
  message ? (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control bg-danger-tint px-3.5 py-3 text-sm font-medium text-danger"
    >
      <CircleAlert size={18} className="mt-px shrink-0" />
      {message}
    </p>
  ) : null;
