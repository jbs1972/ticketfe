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
    border: "border-yellow-500",
    progress: "bg-yellow-500",
    iconColor: "text-yellow-500",
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
      className={`
        fixed
        bottom-5
        right-5
        w-96
        overflow-hidden
        rounded-xl
        border-l-4
        bg-white
        shadow-xl
        z-[9999]
        animate-toast-in
        ${config.border}
      `}
    >
      <div className="flex items-start justify-between px-4 pt-4">
        <div className="flex gap-3">
          <Icon size={22} className={`${config.iconColor} mt-0.5`} />

          <div>
            <h3 className="font-semibold text-gray-800">{toast.title}</h3>

            <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
          </div>
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-gray-400 transition hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      <div className={`mt-4 h-1 ${config.progress}`}>
        <div className="h-full bg-white/30 animate-toast-progress" />
      </div>
    </div>
  );
};

export default Toast;
