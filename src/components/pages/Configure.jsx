import { useEffect, useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import Button from "../common/Button";
import InputBox from "../common/InputBox";
import Table from "../common/Table";
import {
  getTicketStatuses,
  createTicketStatus,
  editTicketStatus,
  deleteTicketStatus,
} from "../../services/ticketStatus.service";
import { toastSuccess, toastError } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";

// Add new tabs here as more configuration features are introduced
const TABS = [{ key: "statuses", label: "Ticket Statuses" }];

const Configure = () => {
  const [activeTab, setActiveTab] = useState("statuses");
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#2563eb");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const startEdit = (status) => {
    setEditingId(status._id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (status) => {
    if (!editName.trim()) return;
    try {
      setSavingEdit(true);
      await editTicketStatus(status._id, {
        name: editName.trim(),
        color: editColor,
      });
      toastSuccess("Status Updated", `"${editName.trim()}" has been updated.`);
      setEditingId(null);
      await fetchStatuses();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not update status."));
    } finally {
      setSavingEdit(false);
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

  const columns = [
    {
      key: "color",
      header: "Color Code",
      width: "w-40",
      render: (row) =>
        editingId === row._id ? (
          <input
            type="color"
            value={editColor}
            onChange={(e) => setEditColor(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 shrink-0 rounded-full border"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-xs text-gray-500">{row.color}</span>
          </div>
        ),
    },
    {
      key: "name",
      header: "Status",
      render: (row) =>
        editingId === row._id ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full max-w-xs rounded border px-2 py-1 text-sm"
          />
        ) : (
          <span className="font-medium">{row.name}</span>
        ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-28",
      render: (row) =>
        editingId === row._id ? (
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => saveEdit(row)}
              disabled={savingEdit}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startEdit(row)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <FaEdit size={12} />
          </button>
        ),
    },
    {
      key: "delete",
      header: "Delete",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDelete(row)}
          className="text-red-600 hover:text-red-800"
          title="Delete"
        >
          <FaTrash size={12} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "statuses" && (
        <div className="w-full space-y-4">
          <Table
            columns={columns}
            data={statuses}
            loading={loading}
            emptyMessage="No statuses yet."
          />

          <form
            onSubmit={handleAdd}
            className="flex w-full flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow"
          >
            <div className="flex-1 min-w-[200px]">
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
      )}
    </div>
  );
};

export default Configure;
