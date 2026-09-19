import { useEffect, useState } from "react";
import { Plus, Pen } from "lucide-react";
import {
  getAllCompanies,
  createCompany,
  updateCompanyName,
  updateCompanyStatus,
} from "../../services/company.service";
import { toastSuccess, toastError } from "../../utilities/toast";
import useAuth from "../../hooks/useAuth";
import Table from "../common/Table";
import Button from "../common/Button";
import Modal from "../common/Modal";
import InputBox from "../common/InputBox";
import Pagination from "../common/Pagination";

const ITEMS_PER_PAGE = 10;

const Companies = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await getAllCompanies();
      setCompanies(res.data || []);
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to load companies.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      await createCompany({ name: name.trim() });
      toastSuccess("Created", "Company created successfully.");
      setName("");
      setCreateOpen(false);
      loadCompanies();
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to create company.",
      );
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (company) => {
    setEditTarget(company);
    setEditName(company.name);
    setEditIsActive(company.isActive);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;

    try {
      setSaving(true);

      if (editName.trim() !== editTarget.name) {
        await updateCompanyName(editTarget._id, { name: editName.trim() });
      }

      if (editIsActive !== editTarget.isActive) {
        await updateCompanyStatus(editTarget._id, { isActive: editIsActive });
      }

      toastSuccess("Updated", "Company updated successfully.");
      setEditTarget(null);
      loadCompanies();
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to update company.",
      );
    } finally {
      setSaving(false);
    }
  };

  const currentCompanies = companies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const columns = [
    {
      key: "slNo",
      header: "Sl No.",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-20",
      render: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
    },
    {
      key: "companyId",
      header: "ID",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    { key: "name", header: "Name" },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (company) => (
        <span
          className={`text-xs font-medium ${
            company.isActive ? "text-green-700" : "text-red-700"
          }`}
        >
          {company.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (company) =>
        isSuperAdmin ? (
          <button
            onClick={() => openEdit(company)}
            title="Edit"
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <Pen size={14} />
          </button>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
        {isSuperAdmin && (
          <Button
            onClick={() => setCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Create New Company
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={currentCompanies}
        loading={loading}
        emptyMessage="No companies found"
      />
      <Pagination
        currentPage={currentPage}
        totalItems={companies.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <Modal
        open={createOpen}
        title="Create New Company"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={creating}
              loadingText="Creating..."
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate}>
          <InputBox
            label="Company Name"
            id="companyName"
            name="companyName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter company name"
            required
          />
        </form>
      </Modal>

      <Modal
        open={!!editTarget}
        title="Edit Company"
        onClose={() => setEditTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              loadingText="Saving..."
              onClick={handleSaveEdit}
            >
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <InputBox
            label="Company Name"
            id="editCompanyName"
            name="editCompanyName"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {editIsActive ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              onClick={() => setEditIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editIsActive ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editIsActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {editTarget?.isActive && !editIsActive && (
            <p className="text-xs text-amber-600">
              Deactivating will freeze access for all admins and users under
              this company.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Companies;
