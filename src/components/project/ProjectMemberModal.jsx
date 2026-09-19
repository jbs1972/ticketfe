import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { assignUsersToProject } from "../../services/project.service";
import { getUsers } from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastSuccess, toastError } from "../../utilities/toast";

const ProjectMemberModal = ({ open, project, companyId, onClose, onSaved }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allocating, setAllocating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !project) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await getUsers(getToken(), companyId);
        const users = (res.data || []).filter((u) => u.isActive);
        setAllUsers(users);

        const assigned = users
          .filter(
            (u) =>
              u.projects &&
              u.projects.some((p) => String(p) === String(project._id)),
          )
          .map((u) => String(u._id));
        setSelectedUsers(assigned);
      } catch (err) {
        toastError("Error", "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, project, companyId]);

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    try {
      setAllocating(true);
      await assignUsersToProject(project._id, selectedUsers);
      toastSuccess("Success", "Project users updated successfully.");
      onSaved?.();
      onClose();
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to update users.",
      );
    } finally {
      setAllocating(false);
    }
  };

  if (!project) return null;

  return (
    <Modal
      open={open}
      title={`Allocate Users to ${project.name}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={allocating}
            loadingText="Saving..."
          >
            Save Allocation
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Loading users...
        </p>
      ) : allUsers.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No active users found in this company.
        </p>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {allUsers.map((person) => {
            const id = String(person._id);
            const checked = selectedUsers.includes(id);
            return (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  checked
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleUser(id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500">{person.email}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default ProjectMemberModal;
