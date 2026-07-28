import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

import {
  getTickets,
  createTicket as createTicketService,
  updateTicket as updateTicketService,
  patchTicket,
  deleteTicket as deleteTicketService,
} from "../services/ticket.service";

import useAuth from "../hooks/useAuth";

const Ticket = () => {
  const { user } = useAuth();

  const isAdmin = user?.isAdmin;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [currentTicketId, setCurrentTicketId] = useState("");

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
  });

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
      alert(error?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

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

    setShowModal(true);
  };

  /*
   * Edit Ticket Modal
   */
  const openEditModal = (ticket) => {
    setEditMode(true);

    setCurrentTicketId(ticket._id);

    setFormData({
      subject: ticket.subject,
      description: ticket.description,
    });

    setShowModal(true);
  };

  /*
   * Handle Input
   */
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /*
   * Create Ticket
   */
  const createTicket = async () => {
    try {
      await createTicketService(formData);

      setShowModal(false);

      fetchTickets();
    } catch (error) {
      console.error(error);

      alert(error?.response?.data?.message || "Failed to create ticket");
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

      fetchTickets();
    } catch (error) {
      console.error(error);

      alert(error?.response?.data?.message || "Failed to update ticket");
    }
  };

  /*
   * Save Button
   */
  const handleSave = () => {
    if (!formData.subject.trim()) {
      return alert("Subject is required");
    }

    if (!formData.description.trim()) {
      return alert("Description is required");
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

      fetchTickets();
    } catch (error) {
      console.error(error);

      alert(error?.response?.data?.message || "Failed to delete ticket");
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
                <th className="border px-3 py-2 text-left">ID</th>

                <th className="border px-3 py-2 text-left">Subject</th>

                <th className="border px-3 py-2 text-left">Description</th>

                <th className="border px-3 py-2 text-center w-20">Edit</th>

                {isAdmin && (
                  <th className="border px-3 py-2 text-center w-20">Delete</th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center py-5">
                    Loading...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center py-5">
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50">
                    <td className="border px-3 py-2">{ticket._id}</td>

                    <td className="border px-3 py-2">{ticket.subject}</td>

                    <td className="border px-3 py-2">{ticket.description}</td>

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

      {/* Modal */}
      {showModal && (
        <div
          className="
            fixed inset-0
            bg-black/40
            flex
            items-center
            justify-center
            z-50
          "
        >
          <div
            className="
              bg-white
              rounded-lg
              shadow-lg
              w-[500px]
              p-5
            "
          >
            <h3 className="text-lg font-semibold mb-4">
              {editMode ? "Update Ticket" : "Create Ticket"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Subject</label>

                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  readOnly={!isAdmin && editMode}
                  className="
                    w-full
                    border
                    rounded-md
                    px-3 py-2
                    disabled:bg-gray-100
                    read-only:bg-gray-100
                    read-only:cursor-not-allowed
                  "
                />
              </div>

              <div>
                <label className="block mb-1 text-sm">Description</label>

                <textarea
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="
                    w-full
                    border
                    rounded-md
                    px-3 py-2
                  "
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="
                  px-4 py-2
                  border
                  rounded-md
                "
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="
                  bg-blue-600
                  text-white
                  px-4 py-2
                  rounded-md
                  hover:bg-blue-700
                "
              >
                {editMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ticket;
