import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";
import { getUsers } from "../../services/user.service";
import { allocateTicket } from "../../services/ticket.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastSuccess, toastError } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";
import { ROLE_LABELS } from "../../utilities/constants";

const TicketAllocateModal = ({ ticket, onClose, onSaved }) => {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const hadAllocation = (ticket.allocatedUsers || []).length > 0;
  const hasComments =
    (ticket.commentCount || 0) > 0 ||
    (ticket.comments && ticket.comments.length > 0);

  useEffect(() => {
    setSelected(
      (ticket.allocatedUsers || [])
        .map((u) => String(u._id || u))
        .filter((id) => id !== String(user?._id)),
    );
    getUsers(getToken(), ticket.company)
      .then((res) => {
        const allUsers = (res.data || []).filter(
          (p) => p.isActive && String(p._id) !== String(user?._id),
        );
        const projectUsers = allUsers.filter(
          (p) =>
            p.projects &&
            p.projects.some((proj) => String(proj) === String(ticket.project)),
        );
        setPeople(projectUsers);
      })
      .catch(() => toastError("Load Failed", "Could not load project members."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.ticketCode]);

  const toggle = (id) => {
    if (hasComments && selected.includes(id)) return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await allocateTicket(ticket.ticketCode, selected);
      toastSuccess(
        hadAllocation ? "Allocation Updated" : "Ticket Allocated",
        "The ticket allocation has been saved.",
      );
      onSaved?.();
      onClose();
    } catch (error) {
      toastError(
        "Failed",
        getErrorMessage(error, "Could not save allocation."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={`Allocate ${ticket.ticketCode}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={saving}
            loadingText="Saving..."
          >
            {hadAllocation ? "Update" : "Allocate"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading...</p>
      ) : people.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No active members allocated to this project.
        </p>
      ) : (
        <>
          {hasComments && (
            <p className="mb-3 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              Users cannot be unallocated from this ticket because it has
              comments.
            </p>
          )}
          <div className="space-y-1">
            {people.map((person) => {
              const id = String(person._id);
              const checked = selected.includes(id);
              const isLocked = hasComments && checked;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    checked
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  } ${isLocked ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(id)}
                    disabled={isLocked}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {person.name}
                    </p>
                    <p className="text-xs text-gray-500">{person.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {ROLE_LABELS[person.role] || "Member"}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
};

export default TicketAllocateModal;
