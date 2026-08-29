import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, TriangleAlert, X } from "lucide-react";

const toastEvents = new EventTarget();

export const emitToast = (detail) => {
  toastEvents.dispatchEvent(new CustomEvent("toast", { detail }));
};

const toastConfig = {
  success: {
    icon: CheckCircle2,
    border: "border-green-500",
    progress: "bg-green-500",
    iconColor: "text-green-500",
  },
  error: {
    icon: XCircle,
    border: "border-red-500",
    progress: "bg-red-500",
    iconColor: "text-red-500",
  },
  warning: {
    icon: TriangleAlert,
    border: "border-amber-500",
    progress: "bg-amber-500",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    border: "border-blue-500",
    progress: "bg-blue-500",
    iconColor: "text-blue-500",
  },
};

const Toast = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const listener = (event) => {
      setToast({
        ...event.detail,
        key: Date.now(),
      });
    };
    toastEvents.addEventListener("toast", listener);
    return () => {
      toastEvents.removeEventListener("toast", listener);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] w-80 overflow-hidden rounded-xl border-l-4 bg-white shadow-xl animate-toast-in ${config.border}`}
    >
      <div
        className={`flex items-start justify-between px-4 pt-3 ${
          toast.onClick ? "cursor-pointer" : ""
        }`}
        onClick={() => {
          if (toast.onClick) {
            toast.onClick();
            setToast(null);
          }
        }}
      >
        <div className="flex gap-2.5">
          <Icon size={18} className={`${config.iconColor} mt-0.5`} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {toast.title}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">{toast.message}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setToast(null);
          }}
          className="text-gray-400 transition-colors hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
      <div className={`mt-3 h-1 ${config.progress}`}>
        <div className="h-full bg-white/30 animate-toast-progress" />
      </div>
    </div>
  );
};

export default Toast;
