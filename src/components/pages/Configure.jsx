import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Trash2, Pen, ArrowUp, ArrowDown, Lock } from "lucide-react";
import Button from "../common/Button";
import InputBox from "../common/InputBox";
import Table from "../common/Table";
import useAuth from "../../hooks/useAuth";
import { getAllCompanies } from "../../services/company.service";
import {
  getTicketStatuses,
  createTicketStatus,
  editTicketStatus,
  deleteTicketStatus,
  reorderTicketStatuses,
} from "../../services/ticketStatus.service";
import {
  getTicketPriorities,
  createTicketPriority,
  editTicketPriority,
  deleteTicketPriority,
} from "../../services/ticketPriority.service";
import { toastSuccess, toastError } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";

const COLOR_PRESETS = [
  "#dc2626",
  "#ea580c",
  "#f59e0b",
  "#16a34a",
  "#0d9488",
  "#2563eb",
  "#4f46e5",
  "#9333ea",
  "#db2777",
  "#6b7280",
];

const TABS = [
  { key: "statuses", label: "Ticket Statuses" },
  { key: "priorities", label: "Ticket Priority" },
];

const ColorSwatches = ({ value, onChange }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {COLOR_PRESETS.map((c) => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        title={c}
        className={`h-6 w-6 rounded-full border-2 transition-transform ${
          value === c ? "scale-110 border-gray-800" : "border-transparent"
        }`}
        style={{ backgroundColor: c }}
      />
    ))}
    <button
      type="button"
      onClick={() => onChange("")}
      title="No Color"
      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white text-[10px] text-gray-400 ${
        value === "" ? "border-gray-800" : "border-gray-300"
      }`}
    >
      ∅
    </button>
  </div>
);

const ColorDot = ({ color }) =>
  color ? (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-4 w-4 shrink-0 rounded-full border border-gray-200"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-500">{color}</span>
    </div>
  ) : (
    <span className="text-xs text-gray-400">No Color</span>
  );

const Configure = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "statuses",
  );
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const companyId = isSuperAdmin ? selectedCompany : user?.company;
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sequenceDirty, setSequenceDirty] = useState(false);
  const [savingSequence, setSavingSequence] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[5]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [pName, setPName] = useState("");
  const [pSaving, setPSaving] = useState(false);
  const [pEditingId, setPEditingId] = useState(null);
  const [pEditName, setPEditName] = useState("");
  const [pSavingEdit, setPSavingEdit] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["statuses", "priorities"].includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getAllCompanies()
      .then((res) => setCompanies(res.data || []))
      .catch(() => toastError("Load Failed", "Failed to load companies."));
  }, [isSuperAdmin]);

  const fetchAll = async () => {
    if (!companyId) {
      setStatuses([]);
      setPriorities([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [sRes, pRes] = await Promise.all([
        getTicketStatuses(companyId),
        getTicketPriorities(companyId),
      ]);
      setStatuses(sRes.data || []);
      setPriorities(pRes.data || []);
      setSequenceDirty(false);
    } catch (error) {
      toastError(
        "Load Failed",
        getErrorMessage(error, "Failed to load configuration."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const lockedCount = statuses.filter((s) => s.isDefault).length;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !companyId) return;
    try {
      setSaving(true);
      await createTicketStatus({ name: name.trim(), color, companyId });
      toastSuccess("Status Added", `"${name.trim()}" has been added.`);
      setName("");
      setColor(COLOR_PRESETS[5]);
      await fetchAll();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not add status."));
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (row) => {
    if (!editName.trim()) return;
    try {
      setSavingEdit(true);
      await editTicketStatus(row._id, {
        name: editName.trim(),
        color: editColor,
      });
      toastSuccess("Status Updated", `"${editName.trim()}" has been updated.`);
      setEditingId(null);
      await fetchAll();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not update status."));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteTicketStatus(row._id);
      toastSuccess("Status Deleted", `"${row.name}" has been removed.`);
      await fetchAll();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not delete status."));
    }
  };

  const moveStatus = (index, dir) => {
    const j = index + dir;
    if (index < lockedCount || j < lockedCount || j >= statuses.length) return;
    setStatuses((prev) => {
      const arr = [...prev];
      [arr[index], arr[j]] = [arr[j], arr[index]];
      return arr;
    });
    setSequenceDirty(true);
  };

  const saveSequence = async () => {
    try {
      setSavingSequence(true);
      await reorderTicketStatuses(
        companyId,
        statuses.map((s) => s._id),
      );
      toastSuccess("Sequence Updated", "The status sequence has been saved.");
      setSequenceDirty(false);
      await fetchAll();
    } catch (error) {
      toastError(
        "Failed",
        getErrorMessage(error, "Could not update sequence."),
      );
    } finally {
      setSavingSequence(false);
    }
  };

  const handleAddPriority = async (e) => {
    e.preventDefault();
    if (!pName.trim() || !companyId) return;
    try {
      setPSaving(true);
      await createTicketPriority({ name: pName.trim(), companyId });
      toastSuccess("Priority Added", `"${pName.trim()}" has been added.`);
      setPName("");
      await fetchAll();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not add priority."));
    } finally {
      setPSaving(false);
    }
  };

  const savePriorityEdit = async (row) => {
    if (!pEditName.trim()) return;
    try {
      setPSavingEdit(true);
      await editTicketPriority(row._id, { name: pEditName.trim() });
      toastSuccess(
        "Priority Updated",
        `"${pEditName.trim()}" has been updated.`,
      );
      setPEditingId(null);
      await fetchAll();
    } catch (error) {
      toastError(
        "Failed",
        getErrorMessage(error, "Could not update priority."),
      );
    } finally {
      setPSavingEdit(false);
    }
  };

  const handleDeletePriority = async (row) => {
    try {
      await deleteTicketPriority(row._id);
      toastSuccess("Priority Deleted", `"${row.name}" has been removed.`);
      await fetchAll();
    } catch (error) {
      toastError(
        "Failed",
        getErrorMessage(error, "Could not delete priority."),
      );
    }
  };

  const statusColumns = [
    {
      key: "slNo",
      header: "Sl No.",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-20",
      render: (_, index) => index + 1,
    },
    {
      key: "color",
      header: "Color Code",
      width: "w-56",
      render: (row) =>
        editingId === row._id ? (
          <ColorSwatches value={editColor} onChange={setEditColor} />
        ) : (
          <ColorDot color={row.color} />
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
            className="w-full max-w-xs rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        ) : (
          <span className="flex items-center gap-1.5 font-medium">
            {row.isDefault && <Lock size={11} className="text-gray-400" />}
            {row.name}
          </span>
        ),
    },
    {
      key: "move",
      header: "Move",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (row, index) =>
        row.isDefault ? null : (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => moveStatus(index, -1)}
              disabled={index <= lockedCount}
              className="text-gray-500 hover:text-blue-600 disabled:opacity-30"
              title="Move up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => moveStatus(index, 1)}
              disabled={index === statuses.length - 1}
              className="text-gray-500 hover:text-blue-600 disabled:opacity-30"
              title="Move down"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-28",
      render: (row) => {
        if (row.isDefault)
          return <span className="text-xs text-gray-400">Locked</span>;
        return editingId === row._id ? (
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => saveEdit(row)}
              disabled={savingEdit}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingId(row._id);
              setEditName(row.name);
              setEditColor(row.color);
            }}
            className="text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <Pen size={14} />
          </button>
        );
      },
    },
    {
      key: "delete",
      header: "Delete",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (row) =>
        row.isDefault ? null : (
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        ),
    },
  ];

  const priorityColumns = [
    {
      key: "slNo",
      header: "Sl No.",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-20",
      render: (_, index) => index + 1,
    },
    {
      key: "name",
      header: "Priority",
      render: (row) =>
        pEditingId === row._id ? (
          <input
            type="text"
            value={pEditName}
            onChange={(e) => setPEditName(e.target.value)}
            className="w-full max-w-xs rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
        pEditingId === row._id ? (
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => savePriorityEdit(row)}
              disabled={pSavingEdit}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setPEditingId(null)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setPEditingId(row._id);
              setPEditName(row.name);
            }}
            className="text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <Pen size={14} />
          </button>
        ),
    },
    {
      key: "delete",
      header: "Delete",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (row) =>
        row.isDefault ? null : (
          <button
            type="button"
            onClick={() => handleDeletePriority(row)}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {isSuperAdmin && (
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Select company...</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {!companyId ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Select a company to view its configuration.
        </p>
      ) : (
        <>
          {activeTab === "statuses" && (
            <div className="w-full space-y-4">
              <Table
                columns={statusColumns}
                data={companyId ? statuses : []}
                loading={loading}
                emptyMessage={
                  companyId
                    ? "No statuses yet."
                    : "Select a company to view its configuration."
                }
              />
              {companyId && sequenceDirty && (
                <div className="flex justify-end">
                  <Button
                    onClick={saveSequence}
                    loading={savingSequence}
                    loadingText="Saving..."
                  >
                    Save Sequence
                  </Button>
                </div>
              )}
              {companyId && (
                <form
                  onSubmit={handleAdd}
                  className="flex w-full flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-[200px] flex-1">
                    <InputBox
                      label="New Status Name"
                      name="statusName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. On Hold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <ColorSwatches value={color} onChange={setColor} />
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
              )}
            </div>
          )}
          {activeTab === "priorities" && (
            <div className="w-full space-y-4">
              <Table
                columns={priorityColumns}
                data={companyId ? priorities : []}
                loading={loading}
                emptyMessage={
                  companyId
                    ? "No priorities yet."
                    : "Select a company to view its configuration."
                }
              />
              {companyId && (
                <form
                  onSubmit={handleAddPriority}
                  className="flex w-full flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-[200px] flex-1">
                    <InputBox
                      label="New Priority Name"
                      name="priorityName"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      placeholder="e.g. Critical"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={pSaving}
                    loadingText="Adding..."
                  >
                    Add
                  </Button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Configure;
