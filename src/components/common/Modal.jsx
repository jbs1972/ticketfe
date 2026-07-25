import { useEffect } from "react";
import { X } from "lucide-react";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Modal = ({
  open,
  title,
  children,
  footer,
  onClose,
  size = "md",
  closeOnOutside = true,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (event) => {
    if (closeOnOutside && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        backdrop-blur-sm
        animate-fadeIn
        p-4
      "
    >
      <div
        className={`
          w-full
          ${sizeClasses[size]}
          rounded-2xl
          bg-white
          shadow-2xl
          animate-scaleIn
        `}
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

          <button
            onClick={onClose}
            className="
              rounded-full
              p-2
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-red-500
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}

        {footer && <div className="border-t px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
