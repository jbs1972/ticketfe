import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import Button from "../common/Button";
import InputBox from "../common/InputBox";
import {
  getTicketStatuses,
  createTicketStatus,
  editTicketStatus,
  deleteTicketStatus,
} from "../../services/ticketStatus.service";
import { toastSuccess, toastError } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";

const Configure = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [saving, setSaving] = useState(false);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await getTicketStatuses();
      setStatuses(response.data || []);
    } catch (error) {
      toastError(
        "Load Failed",
        getErrorMessage(error, "Failed to load statuses."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      await createTicketStatus({ name: name.trim(), color });
      toastSuccess("Status Added", `"${name.trim()}" has been added.`);
      setName("");
      setColor("#2563eb");
      await fetchStatuses();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not add status."));
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = async (status, newColor) => {
    try {
      await editTicketStatus(status._id, {
        name: status.name,
        color: newColor,
      });
      await fetchStatuses();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not update color."));
    }
  };

  const handleDelete = async (status) => {
    try {
      await deleteTicketStatus(status._id);
      toastSuccess("Status Deleted", `"${status.name}" has been removed.`);
      await fetchStatuses();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not delete status."));
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-semibold text-slate-700">
        Ticket Statuses
      </h2>

      <div className="max-w-xl space-y-5 rounded-lg border bg-white p-5 shadow">
        <div className="max-h-60 overflow-y-auto rounded-md border">
          {loading ? (
            <p className="px-3 py-4 text-center text-sm text-gray-500">
              Loading...
            </p>
          ) : statuses.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-500">
              No statuses yet.
            </p>
          ) : (
            statuses.map((status) => (
              <div
                key={status._id}
                className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={status.color}
                    onChange={(e) => handleColorChange(status, e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border"
                    title="Change color"
                  />
                  <span className="text-sm font-medium">{status.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(status)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex-1">
            <InputBox
              label="New Status Name"
              name="statusName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. On Hold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={saving}
            loadingText="Adding..."
          >
            Add
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Configure;
