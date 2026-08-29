import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, LogOut, Info } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

const icons = {
  warning: <AlertTriangle size={32} className="text-amber-500" />,
  delete: <Trash2 size={32} className="text-red-500" />,
  logout: <LogOut size={32} className="text-red-500" />,
  info: <Info size={32} className="text-blue-500" />,
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
  requireDeleteConfirmation = false,
  onConfirm,
  onCancel,
}) => {
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    if (open) {
      setConfirmationText("");
    }
  }, [open]);

  const isDeleteConfirmed =
    !requireDeleteConfirmation || confirmationText === "DELETE";

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        {icons[type]}
        <p className="mt-3 text-sm text-gray-600">{message}</p>

        {requireDeleteConfirmation && (
          <div className="mt-4 w-full text-left">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Type <span className="font-bold">DELETE</span> to continue
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-200"
            />
          </div>
        )}

        <div className="mt-5 flex w-full justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            loading={loading}
            loadingText={
              type === "logout"
                ? "Logging out..."
                : confirmText === "Delete"
                  ? "Deleting..."
                  : "Processing..."
            }
            disabled={!isDeleteConfirmed || loading}
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
