import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

import { getUsers } from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";

import AddUserModal from "../layout/AddUserModal";
import Pagination from "../common/Pagination";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddUser, setOpenAddUser] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await getUsers(getToken());

      setUsers(response.data || []);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));

  const currentUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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

      <div className="rounded-lg border bg-white shadow">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                <th className="border px-3 py-2 text-center w-20">Sl No.</th>
                <th className="border px-3 py-2 text-left">Name</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-left">Role</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-5 text-center">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-5 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="border px-3 py-2 text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="border px-3 py-2">{user.name}</td>

                    <td className="border px-3 py-2">{user.email}</td>

                    <td className="border px-3 py-2">
                      {user.isAdmin ? "Administrator" : "User"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};

export default Users;
