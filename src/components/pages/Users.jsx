import { useEffect, useState } from "react";
import { Plus, Pen, Trash2 } from "lucide-react";
import { getUsers, deleteUser } from "../../services/user.service";
import { getAllCompanies } from "../../services/company.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastSuccess, toastError } from "../../utilities/toast";
import useAuth from "../../hooks/useAuth";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "../../utilities/constants";
import AddUserModal from "../layout/AddUserModal";
import EditUserModal from "../user/EditUserModal";
import Pagination from "../common/Pagination";
import ConfirmDialog from "../common/ConfirmDialog";
import Table from "../common/Table";
import Button from "../common/Button";
import { formatDate } from "../../utilities/ticketHelpers";

const Users = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === ROLES.SUPERADMIN;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddUser, setOpenAddUser] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async (companyId) => {
    try {
      setLoading(true);
      const response = await getUsers(getToken(), companyId);
      const list = response.data || [];

      // The Super Admin belongs to no company, so prepend their own row
      if (isSuperAdmin && !list.some((u) => u._id === currentUser._id)) {
        list.unshift(currentUser);
      }

      setUsers(list);
    } catch (error) {
      toastError(
        "Load Failed",
        error?.response?.data?.message || "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;

    getAllCompanies()
      .then((response) => setCompanies(response.data || []))
      .catch(() => toastError("Load Failed", "Failed to load companies"));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      if (!selectedCompanyId) {
        setUsers([]);
        return;
      }
      fetchUsers(selectedCompanyId);
      return;
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, selectedCompanyId]);

  // Only the Super Admin may edit their own row; nobody may delete themselves.
  const canEdit = (target) => {
    if (!currentUser) return false;
    if (target._id === currentUser._id) return isSuperAdmin;
    return true;
  };

  const canDelete = (target) => {
    if (!currentUser) return false;
    if (target._id === currentUser._id) return false;
    return true;
  };

  const handleUserSaved = (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, ...updates } : u)),
    );
  };

  const handleDeleteRequest = (target) => {
    setDeleteTarget(target);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteUser(deleteTarget._id, getToken());
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      toastSuccess("User Deleted", `${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      toastError(
        "Delete Failed",
        error?.response?.data?.message || "Failed to delete user",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentUsers = users.slice(
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
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span
          className={`text-xs font-medium ${
            (ROLE_COLORS[row.role] || ROLE_COLORS.user).text
          }`}
        >
          {ROLE_LABELS[row.role] || row.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span
          className={`text-xs font-medium ${
            row.isActive ? "text-green-700" : "text-red-700"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "registrationDate",
      header: "Registered On",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {formatDate(row.registrationDate)}
        </span>
      ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (row) => {
        const editable = canEdit(row);
        return (
          <button
            onClick={() => setEditTarget(row)}
            disabled={!editable}
            title={editable ? "Edit" : "Not permitted"}
            className={
              editable
                ? "rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                : "cursor-not-allowed rounded-md p-1.5 text-gray-300"
            }
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
      render: (row) => {
        const deletable = canDelete(row);
        return (
          <button
            onClick={() => handleDeleteRequest(row)}
            disabled={!deletable}
            title={deletable ? "Delete" : "Not permitted"}
            className={
              deletable
                ? "rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
                : "cursor-not-allowed rounded-md p-1.5 text-gray-300"
            }
          >
            <Trash2 size={14} />
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => setOpenAddUser(true)}
            leftIcon={<Plus size={16} />}
            disabled={isSuperAdmin && !selectedCompanyId}
          >
            Add User
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        data={currentUsers}
        loading={loading}
        emptyMessage={
          isSuperAdmin && !selectedCompanyId
            ? "Select a company to view its users"
            : "No users found"
        }
      />
      <Pagination
        currentPage={currentPage}
        totalItems={users.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
      <AddUserModal
        open={openAddUser}
        companyId={isSuperAdmin ? selectedCompanyId : undefined}
        onClose={() => {
          setOpenAddUser(false);
          isSuperAdmin ? fetchUsers(selectedCompanyId) : fetchUsers();
        }}
      />
      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleUserSaved}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
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

export default Users;
