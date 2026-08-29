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
  bodyClassName = "px-5 py-4",
}) => {
  useEscapeKey(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${sizeClasses[size]} overflow-hidden rounded-xl bg-white shadow-xl animate-scaleIn`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            {title ? (
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`max-h-[70vh] overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
