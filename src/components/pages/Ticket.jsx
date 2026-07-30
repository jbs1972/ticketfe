import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";

import {
  getTickets,
  createTicket as createTicketService,
  updateTicket as updateTicketService,
  patchTicket,
  deleteTicket as deleteTicketService,
} from "../../services/ticket.service";

import useAuth from "../../hooks/useAuth";
import TicketViewModal from "../ticket/TicketViewModal";
import Pagination from "../common/Pagination";
import { toastError, toastSuccess } from "../../utilities/toast";

const Ticket = () => {
  const { user } = useAuth();

  const isAdmin = user?.isAdmin;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [currentTicketId, setCurrentTicketId] = useState("");

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  /*
   * Load Tickets
   */
  const fetchTickets = async () => {
    try {
      setLoading(true);

      const response = await getTickets();

      setTickets(response.data || []);
    } catch (error) {
      console.error(error);
      toastError(
        "Load Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "Failed to load tickets.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(tickets.length / ITEMS_PER_PAGE));

  const currentTickets = tickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /*
   * Add Ticket Modal
   */
  const openCreateModal = () => {
    setEditMode(false);

    setCurrentTicketId("");

    setFormData({
      subject: "",
      description: "",
    });
    setErrors({});

    setShowModal(true);
  };

  // Edit Ticket Modal
  const openEditModal = (ticket) => {
    setEditMode(true);

    setCurrentTicketId(ticket._id);

    setFormData({
      subject: ticket.subject,
      description: ticket.description,
    });
    setErrors({});

    setShowModal(true);
  };

  // View Ticket Modal
  const openViewModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  // Handle Input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Create Ticket
  const createTicket = async () => {
    try {
      await createTicketService(formData);

      setShowModal(false);

      toastSuccess("Ticket Created", "The ticket has been successfully created.");

      fetchTickets();
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Creation Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The ticket could not be created. Please try again.",
      );
    }
  };

  /*
   * Update Ticket
   *
   * Admin  -> PUT
   * User   -> PATCH (description only)
   */
  const updateTicket = async () => {
    try {
      if (isAdmin) {
        await updateTicketService(currentTicketId, formData);
      } else {
        await patchTicket(currentTicketId, {
          description: formData.description,
        });
      }

      setShowModal(false);

      toastSuccess("Ticket Updated", "The ticket has been successfully updated.");

      fetchTickets();
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Update Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The ticket could not be updated. Please try again.",
      );
    }
  };

  /*
   * Save Button
   */

  const handleSave = () => {
    const validationErrors = {};

    if (!formData.subject.trim()) {
      validationErrors.subject = "Subject is required.";
    }

    if (!formData.description.trim()) {
      validationErrors.description = "Description is required.";
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    if (editMode) {
      updateTicket();
    } else {
      createTicket();
    }
  };
  /*
   * Delete Ticket
   */
  const deleteTicket = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ticket?",
    );

    if (!confirmed) return;

    try {
      await deleteTicketService(id);

      toastSuccess("Ticket Deleted", "The ticket has been successfully deleted.");

      fetchTickets();
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Deletion Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The ticket could not be deleted. Please try again.",
      );
    }
  };
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-700">
          Ticket Management
        </h2>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="
              flex items-center gap-2
              bg-blue-600
              text-white
              px-4 py-2
              rounded-md
              hover:bg-blue-700
              text-sm
            "
          >
            <FaPlus />
            Add Ticket
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="border rounded-lg shadow bg-white">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="border px-3 py-2 text-left">Subject</th>

                <th className="border px-3 py-2 text-center w-24">View</th>

                <th className="border px-3 py-2 text-center w-20">Edit</th>

                {isAdmin && (
                  <th className="border px-3 py-2 text-center w-20">Delete</th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="text-center py-5">
                    Loading...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="text-center py-5">
                    No tickets found
                  </td>
                </tr>
              ) : (
                currentTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50">
                    <td className="border px-3 py-2">{ticket.subject}</td>

                    <td className="border px-3 py-2 text-center">
                      <button
                        onClick={() => openViewModal(ticket)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FaEye />
                      </button>
                    </td>

                    <td className="border px-3 py-2 text-center">
                      <button
                        onClick={() => openEditModal(ticket)}
                        className="
                          text-blue-600
                          hover:text-blue-800
                        "
                      >
                        <FaEdit />
                      </button>
                    </td>

                    {isAdmin && (
                      <td className="border px-3 py-2 text-center">
                        <button
                          onClick={() => deleteTicket(ticket._id)}
                          className="
                            text-red-600
                            hover:text-red-800
                          "
                        >
                          <FaTrash />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={tickets.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Modal */}
      <>
        <TicketViewModal
          open={showViewModal}
          ticket={selectedTicket}
          canEdit={true}
          onEdit={openEditModal}
          onClose={() => setShowViewModal(false)}
        />

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[500px] rounded-lg bg-white p-5 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">
                {editMode ? "Update Ticket" : "Create Ticket"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm">Subject</label>

                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    readOnly={!isAdmin && editMode}
                    className={`w-full rounded-md border px-3 py-2 read-only:cursor-not-allowed read-only:bg-gray-100 ${
                      errors.subject ? "border-red-500" : ""
                    }`}
                  />

                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm">Description</label>

                  <textarea
                    rows="4"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`w-full rounded-md border px-3 py-2 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />

                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setErrors({});
                    setShowModal(false);
                  }}
                  className="rounded-md border px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {editMode ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default Ticket;
