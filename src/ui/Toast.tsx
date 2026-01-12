import { useToastStore } from "../state/toastStore";

function Toast() {
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);

  if (!message) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-40">
      <div
        className="notification-expand backdrop-blur-md text-xs px-3 py-1.5 rounded-full"
        style={{
          background: type === "error" ? "var(--color-error-bg)" : "var(--color-bg-elevated)",
          color: type === "error" ? "var(--color-error)" : "var(--color-text-secondary)",
        }}
      >
        {message}
      </div>
    </div>
  );
}

export default Toast;
