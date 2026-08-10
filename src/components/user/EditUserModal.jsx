import { useEffect, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import {
  updateUserName,
  updateUserRole,
  updateUserStatus,
} from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastSuccess, toastError } from "../../utilities/toast";
import { getErrorMessage, formatFileSize } from "../../utilities/ticketHelpers";
import { ROLE_LABELS } from "../../utilities/constants";
import Modal from "../common/Modal";
import InputBox from "../common/InputBox";
import Button from "../common/Button";

const EditUserModal = ({ open, user, onClose, onSaved, onDeleteRequest }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset fields from source user whenever modal opens for a user
  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setIsActive(user.isActive);
    }
  }, [user, open]);

  if (!user) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      setSaving(true);

      const updates = {};

      if (name.trim() !== user.name) {
        await updateUserName(user._id, name.trim(), getToken());
        updates.name = name.trim();
      }

      if (role !== user.role) {
        await updateUserRole(user._id, role, getToken());
        updates.role = role;
      }

      if (isActive !== user.isActive) {
        await updateUserStatus(user._id, isActive, getToken());
        updates.isActive = isActive;
      }

      if (Object.keys(updates).length > 0) {
        onSaved(user._id, updates);
        toastSuccess("User Updated", `${name.trim()} has been updated.`);
      }

      onClose();
    } catch (error) {
      toastError(
        "Update Failed",
        getErrorMessage(error, "Failed to update user")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit User"
      size="sm"
      closeOnOutside={true}
      showCloseButton={true}
    >
      <form onSubmit={handleUpdate} className="space-y-5">
        <InputBox
          label="Full Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter full name"
          required
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="user">{ROLE_LABELS.user}</option>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Account Status
          </label>

          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <button
            type="button"
            onClick={() => onDeleteRequest(user)}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
          >
            <FaTrashAlt size={11} /> Delete User
          </button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={saving}
              loadingText="Saving..."
            >
              Update
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
