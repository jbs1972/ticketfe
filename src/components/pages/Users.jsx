import { useEffect, useState } from "react";
import { FaPlus, FaPen, FaTrashAlt } from "react-icons/fa";

import { getUsers, deleteUser } from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastSuccess, toastError } from "../../utilities/toast";
import useAuth from "../../hooks/useAuth";
import { ROLE_LABELS, ROLE_COLORS } from "../../utilities/constants";

import AddUserModal from "../layout/AddUserModal";
import EditUserModal from "../user/EditUserModal";
import Pagination from "../common/Pagination";
import ConfirmDialog from "../common/ConfirmDialog";
import Table from "../common/Table";
import { formatDate } from "../../utilities/ticketHelpers";

const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddUser, setOpenAddUser] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await getUsers(getToken());

      setUsers(response.data || []);
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
    fetchUsers();
  }, []);

  // Cannot alter self
  const canAlter = (target) => {
    if (!currentUser) return false;
    if (target._id === currentUser._id) return false;
    return true;
  };

  const handleUserSaved = (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, ...updates } : u)),
    );
  };

  const handleDeleteRequest = (user) => {
    setDeleteTarget(user);
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
      render: (user) => (
        <span
          className={`text-xs font-medium ${
            (ROLE_COLORS[user.role] || ROLE_COLORS.user).text
          }`}
        >
          {ROLE_LABELS[user.role] || user.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (user) => (
        <span
          className={`text-xs font-medium ${
            user.isActive ? "text-green-700" : "text-red-700"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "registrationDate",
      header: "Registered On",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (user) => (
        <span className="text-xs text-slate-600">
          {formatDate(user.registrationDate)}
        </span>
      ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (user) => {
        const editable = canAlter(user);

        return (
          <button
            onClick={() => setEditTarget(user)}
            disabled={!editable}
            title={editable ? "Edit" : "Not permitted"}
            className={
              editable
                ? "rounded-md p-2 text-slate-600 hover:bg-slate-200"
                : "cursor-not-allowed rounded-md p-2 text-slate-300"
            }
          >
            <FaPen size={12} />
          </button>
        );
      },
    },
    {
      key: "delete",
      header: "Delete",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (user) => {
        const deletable = canAlter(user);

        return (
          <button
            onClick={() => handleDeleteRequest(user)}
            disabled={!deletable}
            title={deletable ? "Delete" : "Not permitted"}
            className={
              deletable
                ? "rounded-md p-2 text-red-600 hover:bg-red-100"
                : "cursor-not-allowed rounded-md p-2 text-slate-300"
            }
          >
            <FaTrashAlt size={12} />
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-700">
          User Management
        </h2>

        <button
          onClick={() => setOpenAddUser(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <FaPlus />
          Add User
        </button>
      </div>

      <Table
        columns={columns}
        data={currentUsers}
        loading={loading}
        emptyMessage="No users found"
      />

      <Pagination
        currentPage={currentPage}
        totalItems={users.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <AddUserModal
        open={openAddUser}
        onClose={() => {
          setOpenAddUser(false);
          fetchUsers();
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
