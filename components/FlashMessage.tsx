type FlashVariant = "success" | "error" | "warning" | "info";

const variantClass: Record<FlashVariant, string> = {
  success: "status-success",
  error: "status-danger",
  warning: "status-warning",
  info: "status-info"
};

export function FlashMessage({
  message,
  variant = "info",
  className = ""
}: {
  message?: string | null;
  variant?: FlashVariant;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-2xl border p-4 text-sm font-semibold ${variantClass[variant]} ${className}`}
    >
      {message}
    </div>
  );
}
