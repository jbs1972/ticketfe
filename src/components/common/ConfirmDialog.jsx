import { AlertTriangle, Trash2, LogOut, Info } from "lucide-react";

import Button from "./Button";
import Modal from "./Modal";

const icons = {
  warning: <AlertTriangle size={48} className="text-yellow-500" />,

  delete: <Trash2 size={48} className="text-red-500" />,

  logout: <LogOut size={48} className="text-red-500" />,

  info: <Info size={48} className="text-blue-500" />,
};

const ConfirmDialog = ({
  open,
  title = "Confirmation",
  message,
  type = "warning",

  confirmText = "Confirm",
  cancelText = "Cancel",

  confirmVariant = "primary",

  loading = false,

  onConfirm,
  onCancel,
}) => {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        {icons[type]}

        <p className="mt-5 text-gray-600">{message}</p>

        <div className="mt-8 flex w-full justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>

          <Button
            variant={confirmVariant}
            loading={loading}
            loadingText="Logging out..."
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
