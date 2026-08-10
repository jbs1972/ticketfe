import { useEffect } from "react";
import { X } from "lucide-react";
import useEscapeKey from "../../hooks/useEscapeKey";

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
  showCloseButton = true,
  bodyClassName = "px-6 py-5",
}) => {
  useEscapeKey(open, onClose);

  if (!open) return null;

  return (
    <div
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
          overflow-hidden
          bg-white
          shadow-2xl
          animate-scaleIn
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b px-6 py-4">
            {title ? (
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            ) : (
              <div />
            )}

            {showCloseButton && (
              <button
                type="button"
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
            )}
          </div>
        )}

        {/* Body */}
        <div className={`max-h-[70vh] overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && <div className="border-t px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
