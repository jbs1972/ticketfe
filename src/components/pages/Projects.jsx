import { useEffect, useState } from "react";
import { Plus, Pen, Trash2, Users } from "lucide-react";
import {
  getAllProjects,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
} from "../../services/project.service";
import { getAllCompanies } from "../../services/company.service";
import { toastSuccess, toastError } from "../../utilities/toast";
import useAuth from "../../hooks/useAuth";
import Table from "../common/Table";
import Button from "../common/Button";
import Modal from "../common/Modal";
import InputBox from "../common/InputBox";
import ConfirmDialog from "../common/ConfirmDialog";
import Pagination from "../common/Pagination";
import ProjectMemberModal from "../project/ProjectMemberModal";
import { handleEnterNavigation } from "../../hooks/useKeyboardNavigation";

const ITEMS_PER_PAGE = 10;
const CREATE_PROJECT_FORM_ID = "create-project-form";
const EDIT_PROJECT_FORM_ID = "edit-project-form";

const Projects = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [createCompany, setCreateCompany] = useState("");
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [allocateTarget, setAllocateTarget] = useState(null);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllCompanies()
        .then((res) => setCompanies(res.data || []))
        .catch(() =>
          toastError("Error", "Failed to load companies for selection."),
        );
    }
  }, [isSuperAdmin]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await getAllProjects(
        isSuperAdmin ? selectedCompany || undefined : undefined,
      );
      setProjects(res.data || []);
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to load projects.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isSuperAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCompany]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const targetCompany = isSuperAdmin
      ? selectedCompany || createCompany
      : undefined;
    if (isSuperAdmin && !targetCompany) {
      toastError("Error", "Please select a company first.");
      return;
    }
    try {
      setCreating(true);
      const payload = isSuperAdmin
        ? { name: name.trim(), company: targetCompany }
        : { name: name.trim() };
      await createProject(payload);
      toastSuccess("Created", "Project created successfully.");
      setName("");
      setCreateCompany("");
      setCreateOpen(false);
      loadProjects();
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to create project.",
      );
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (project) => {
    setEditTarget(project);
    setEditName(project.name);
    setEditIsActive(project.isActive);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      setSaving(true);
      if (editName.trim() !== editTarget.name) {
        await updateProject(editTarget._id, { name: editName.trim() });
      }
      if (editIsActive !== editTarget.isActive) {
        await updateProjectStatus(editTarget._id, { isActive: editIsActive });
      }
      toastSuccess("Updated", "Project updated successfully.");
      setEditTarget(null);
      loadProjects();
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to update project.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteProject(deleteTarget._id);
      toastSuccess("Deleted", "Project deleted successfully.");
      setDeleteTarget(null);
      loadProjects();
    } catch (err) {
      toastError(
        "Error",
        err?.response?.data?.message || "Failed to delete project.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const showCompanyColumn = isSuperAdmin && !selectedCompany;

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
      key: "projectId",
      header: "ID",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "name",
      header: "Name",
      truncate: true,
      maxWidth: "220px",
      title: (project) => project.name,
    },
    ...(showCompanyColumn
      ? [
          {
            key: "company",
            header: "Company",
            truncate: true,
            maxWidth: "140px",
            title: (project) => project.company?.name || "",
            render: (project) => (
              <span className="text-xs text-gray-600">
                {project.company?.name || "—"}
              </span>
            ),
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (project) => (
        <span
          className={`text-xs font-medium ${project.isActive ? "text-green-700" : "text-red-700"}`}
        >
          {project.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "memberCount",
      header: "Members",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (project) => (
        <div className="flex items-center justify-center gap-1 text-gray-500">
          <Users size={12} />
          {project.memberCount || 0}
        </div>
      ),
    },
    {
      key: "allocate",
      header: "Users",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (project) => (
        <button
          onClick={() => setAllocateTarget(project)}
          title="Allocate Users"
          className="rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Users size={14} />
        </button>
      ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (project) => (
        <button
          onClick={() => openEdit(project)}
          title="Edit"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
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
      render: (project) => (
        <button
          onClick={() => setDeleteTarget(project)}
          title="Delete"
          className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => setCreateOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Add Project
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        data={currentProjects}
        loading={loading}
        emptyMessage="No projects found"
      />
      <Pagination
        currentPage={currentPage}
        totalItems={projects.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <Modal
        open={createOpen}
        title="Add Project"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={CREATE_PROJECT_FORM_ID}
              loading={creating}
              loadingText="Creating..."
            >
              Create
            </Button>
          </div>
        }
      >
        <form
          id={CREATE_PROJECT_FORM_ID}
          onSubmit={handleCreate}
          onKeyDown={handleEnterNavigation}
          className="space-y-4"
        >
          {isSuperAdmin && !selectedCompany && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <select
                value={createCompany}
                onChange={(e) => setCreateCompany(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <InputBox
            label="Project Name"
            id="projectName"
            name="projectName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter project name"
            required
          />
        </form>
      </Modal>

      <Modal
        open={!!editTarget}
        title="Edit Project"
        onClose={() => setEditTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={EDIT_PROJECT_FORM_ID}
              loading={saving}
              loadingText="Saving..."
            >
              Save
            </Button>
          </div>
        }
      >
        <form
          id={EDIT_PROJECT_FORM_ID}
          onSubmit={handleSaveEdit}
          onKeyDown={handleEnterNavigation}
          className="space-y-4"
        >
          <InputBox
            label="Project Name"
            id="editProjectName"
            name="editProjectName"
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
              Deactivating will freeze this project for its assigned users.
            </p>
          )}
        </form>
      </Modal>

      <ProjectMemberModal
        open={!!allocateTarget}
        project={allocateTarget}
        companyId={
          isSuperAdmin
            ? allocateTarget?.company?._id || allocateTarget?.company
            : currentUser.company
        }
        onClose={() => setAllocateTarget(null)}
        onSaved={loadProjects}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete ${deleteTarget.name}? This action cannot be undone.`
            : ""
        }
        type="delete"
        confirmText="Delete"
        confirmVariant="danger"
        requireDeleteConfirmation
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Projects;
