import React, { useEffect, useRef, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaDownload,
  FaTimes,
  FaSyncAlt,
} from "react-icons/fa";

import {
  getTickets,
  getTicketById,
  createTicket as createTicketService,
  updateTicket as updateTicketService,
  patchTicket,
  deleteTicket as deleteTicketService,
  uploadAttachments,
  downloadAttachment,
  deleteAttachment,
} from "../../services/ticket.service";

import useAuth from "../../hooks/useAuth";
import TicketViewModal from "../ticket/TicketViewModal";
import Pagination from "../common/Pagination";
import { toastError, toastSuccess } from "../../utilities/toast";
import ConfirmDialog from "../common/ConfirmDialog";

const VIEWABLE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const isViewable = (mimeType) => VIEWABLE_MIME_TYPES.includes(mimeType);

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const getComparableTickets = (list) =>
  [...list]
    .sort((a, b) => (a._id > b._id ? 1 : -1))
    .map((t) => ({
      _id: t._id,
      subject: t.subject,
      description: t.description,
      attachments: (t.attachments || []).map((f) => f.fileName).sort(),
    }));

const getChangedTicketIds = (oldList, newList) => {
  const oldMap = new Map(oldList.map((t) => [t._id, t]));
  const changed = [];

  for (const newTicket of newList) {
    const oldTicket = oldMap.get(newTicket._id);

    const oldSig = oldTicket
      ? JSON.stringify({
          subject: oldTicket.subject,
          description: oldTicket.description,
          attachments: (oldTicket.attachments || [])
            .map((f) => f.fileName)
            .sort(),
        })
      : null;

    const newSig = JSON.stringify({
      subject: newTicket.subject,
      description: newTicket.description,
      attachments: (newTicket.attachments || []).map((f) => f.fileName).sort(),
    });

    if (oldSig !== newSig) changed.push(newTicket._id);
  }

  return changed;
};

const Ticket = () => {
  const { user } = useAuth();

  const isAdmin = user?.isAdmin;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingUpdateIds, setPendingUpdateIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const ticketsRef = useRef([]);
  const pendingUpdateRef = useRef(false);

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

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentAttachments, setCurrentAttachments] = useState([]);
  const [selectedForDownload, setSelectedForDownload] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteTicketConfirm, setDeleteTicketConfirm] = useState({
    open: false,
    id: null,
    loading: false,
  });

  const [deleteAttachmentConfirm, setDeleteAttachmentConfirm] = useState({
    open: false,
    fileName: null,
    loading: false,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  useEffect(() => {
    pendingUpdateRef.current = pendingUpdateIds;
  }, [pendingUpdateIds]);

  /*
   * Load Tickets
   *
   * silent = true  -> background poll, no spinner, no auto-apply
   * silent = false -> normal fetch, applies data, shows spinner
   */
  const fetchTickets = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await getTickets();
      const newTickets = response.data || [];

      if (silent) {
        const changedIds = getChangedTicketIds(ticketsRef.current, newTickets);

        if (changedIds.length) {
          setPendingUpdateIds((prev) =>
            Array.from(new Set([...prev, ...changedIds])),
          );

          if (pendingUpdateRef.current.length === 0) {
            toastSuccess(
              "Update Available",
              "Ticket data has changed. Click refresh to load the latest.",
            );
          }
        }
      } else {
        setTickets(newTickets);
        setPendingUpdateIds([]);
      }
    } catch (error) {
      console.error(error);

      if (!silent) {
        toastError(
          "Load Failed",
          error?.response?.data?.data?.errors?.[0] ||
            error?.response?.data?.message ||
            "Failed to load tickets.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const intervalId = setInterval(() => {
      fetchTickets(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Refresh Tickets
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchTickets(false);
    setRefreshing(false);
  };

  // Refresh Current Modal
  const refreshCurrentModal = async () => {
    try {
      setRefreshing(true);

      await fetchTickets(false);

      const response = await getTicketById(currentTicketId);
      const updatedTicket = response.data;

      setFormData({
        subject: updatedTicket.subject,
        description: updatedTicket.description,
      });
      setCurrentAttachments(updatedTicket.attachments || []);
      setPendingUpdateIds((prev) =>
        prev.filter((id) => id !== currentTicketId),
      );
    } catch (error) {
      console.error(error);

      toastError(
        "Refresh Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "Could not refresh ticket data.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh View Modal
  const refreshViewModal = async () => {
    try {
      setRefreshing(true);

      await fetchTickets(false);

      const response = await getTicketById(selectedTicket._id);
      setSelectedTicket(response.data);
      setPendingUpdateIds((prev) =>
        prev.filter((id) => id !== selectedTicket._id),
      );
    } catch (error) {
      console.error(error);

      toastError(
        "Refresh Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "Could not refresh ticket data.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(tickets.length / ITEMS_PER_PAGE));

  const currentTickets = tickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Add Ticket Modal
  const openCreateModal = () => {
    setEditMode(false);

    setCurrentTicketId("");

    setFormData({
      subject: "",
      description: "",
    });
    setErrors({});

    setSelectedFiles([]);
    setCurrentAttachments([]);
    setSelectedForDownload([]);

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

    setSelectedFiles([]);
    setCurrentAttachments(ticket.attachments || []);
    setSelectedForDownload([]);

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

  // Staged File Selection
  const addFiles = (newFiles) => {
    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));

      const uniqueNewFiles = newFiles.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}`),
      );

      return [...prev, ...uniqueNewFiles];
    });
  };

  // Download Selected Attachments
  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  // Remove Selected File
  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Handle Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  // Create Ticket
  const createTicket = async () => {
    try {
      const response = await createTicketService(formData);
      const newTicketId = response.data._id;

      if (selectedFiles.length) {
        await uploadAttachments(newTicketId, selectedFiles);
      }

      setShowModal(false);

      toastSuccess(
        "Ticket Created",
        "The ticket has been successfully created.",
      );

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

      if (selectedFiles.length) {
        await uploadAttachments(currentTicketId, selectedFiles);
      }

      setShowModal(false);

      toastSuccess(
        "Ticket Updated",
        "The ticket has been successfully updated.",
      );

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

  // Save Button
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

  // Delete Ticket
  const requestDeleteTicket = (id) => {
    setDeleteTicketConfirm({ open: true, id, loading: false });
  };

  const confirmDeleteTicket = async () => {
    const id = deleteTicketConfirm.id;

    try {
      setDeleteTicketConfirm((prev) => ({ ...prev, loading: true }));

      await deleteTicketService(id);

      toastSuccess(
        "Ticket Deleted",
        "The ticket has been successfully deleted.",
      );

      fetchTickets();
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Deletion Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The ticket could not be deleted. Please try again.",
      );
    } finally {
      setDeleteTicketConfirm({ open: false, id: null, loading: false });
    }
  };

  // Delete Attachment
  const requestDeleteAttachment = (fileName) => {
    setDeleteAttachmentConfirm({ open: true, fileName, loading: false });
  };

  const confirmDeleteAttachment = async () => {
    const fileName = deleteAttachmentConfirm.fileName;

    try {
      setDeleteAttachmentConfirm((prev) => ({ ...prev, loading: true }));

      await deleteAttachment(currentTicketId, fileName);

      toastSuccess(
        "Attachment Deleted",
        "The attachment has been successfully deleted.",
      );

      const response = await getTicketById(currentTicketId);
      setCurrentAttachments(response.data.attachments || []);
      setSelectedForDownload((prev) => prev.filter((f) => f !== fileName));

      fetchTickets();
    } catch (error) {
      console.error(error);

      toastError(
        "Attachment Deletion Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The attachment could not be deleted. Please try again.",
      );
    } finally {
      setDeleteAttachmentConfirm({
        open: false,
        fileName: null,
        loading: false,
      });
    }
  };

  // Download Attachment
  const handleDownloadAttachment = async (ticketId, file) => {
    try {
      const response = await downloadAttachment(ticketId, file.fileName);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", file.originalName);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      toastError(
        "Download Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The attachment could not be downloaded. Please try again.",
      );
    }
  };

  // Download Multiple Attachments
  const handleDownloadMultiple = async (ticketId, files) => {
    for (const file of files) {
      await handleDownloadAttachment(ticketId, file);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  // Toggle Selection for Download
  const toggleSelectForDownload = (fileName) => {
    setSelectedForDownload((prev) =>
      prev.includes(fileName)
        ? prev.filter((f) => f !== fileName)
        : [...prev, fileName],
    );
  };

  // View Attachment
  const handleViewAttachment = async (ticketId, file) => {
    if (!isViewable(file.mimeType)) {
      handleDownloadAttachment(ticketId, file);
      return;
    }

    const newTab = window.open("", "_blank");

    try {
      const response = await downloadAttachment(ticketId, file.fileName);

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: file.mimeType }),
      );

      if (newTab) {
        newTab.location.href = url;
      }
    } catch (error) {
      console.error(error);

      if (newTab) newTab.close();

      toastError(
        "View Failed",
        error?.response?.data?.data?.errors?.[0] ||
          error?.response?.data?.message ||
          "The attachment could not be opened. Please try again.",
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

      {/* Update Available Banner */}
      {pendingUpdateIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>New updates are available.</span>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

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
                          onClick={() => requestDeleteTicket(ticket._id)}
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
          onDownload={(file) =>
            handleDownloadAttachment(selectedTicket._id, file)
          }
          onView={(file) => handleViewAttachment(selectedTicket._id, file)}
          onClose={() => setShowViewModal(false)}
          pendingUpdate={
            selectedTicket
              ? pendingUpdateIds.includes(selectedTicket._id)
              : false
          }
          refreshing={refreshing}
          onRefresh={refreshViewModal}
        />

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[500px] rounded-lg bg-white p-5 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">
                {editMode ? "Update Ticket" : "Create Ticket"}
              </h3>

              {editMode && pendingUpdateIds.includes(currentTicketId) && (
                <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span>This ticket may have new updates.</span>

                  <button
                    type="button"
                    onClick={refreshCurrentModal}
                    disabled={refreshing}
                    className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              )}

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

                {editMode && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-sm">
                        Existing Attachments
                      </label>

                      {currentAttachments.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadMultiple(
                              currentTicketId,
                              currentAttachments.filter((f) =>
                                selectedForDownload.includes(f.fileName),
                              ),
                            )
                          }
                          disabled={!selectedForDownload.length}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        >
                          Download Selected ({selectedForDownload.length})
                        </button>
                      )}
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-md border">
                      {currentAttachments.length ? (
                        <>
                          <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-1">
                            <input
                              type="checkbox"
                              checked={
                                selectedForDownload.length ===
                                currentAttachments.length
                              }
                              onChange={(e) =>
                                setSelectedForDownload(
                                  e.target.checked
                                    ? currentAttachments.map((f) => f.fileName)
                                    : [],
                                )
                              }
                            />
                            <span className="text-xs text-gray-500">
                              Select All
                            </span>
                          </div>

                          {currentAttachments.map((file) => (
                            <div
                              key={file.fileName}
                              className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedForDownload.includes(
                                    file.fileName,
                                  )}
                                  onChange={() =>
                                    toggleSelectForDownload(file.fileName)
                                  }
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">
                                    {file.originalName}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>

                              <div className="ml-3 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewAttachment(currentTicketId, file)
                                  }
                                  className="text-slate-600 hover:text-slate-800"
                                  title="View"
                                >
                                  <FaEye />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadAttachment(
                                      currentTicketId,
                                      file,
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Download"
                                >
                                  <FaDownload />
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      requestDeleteAttachment(file.fileName)
                                    }
                                    className="text-red-600 hover:text-red-800"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="px-3 py-3 text-center text-sm text-gray-500">
                          No attachments available.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div>
                    <label className="mb-1 block text-sm">
                      {editMode ? "Upload More Files" : "Upload Attachments"}
                    </label>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`cursor-pointer rounded-md border-2 border-dashed px-3 py-6 text-center text-sm ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      Drag & drop files here, or click to browse
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto rounded-md border">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between border-b px-3 py-1 text-xs last:border-b-0"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

        <ConfirmDialog
          open={deleteTicketConfirm.open}
          type="delete"
          title="Delete Ticket"
          message="Are you sure you want to delete this ticket? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
          loading={deleteTicketConfirm.loading}
          onConfirm={confirmDeleteTicket}
          onCancel={() =>
            setDeleteTicketConfirm({ open: false, id: null, loading: false })
          }
        />

        <ConfirmDialog
          open={deleteAttachmentConfirm.open}
          type="delete"
          title="Delete Attachment"
          message="Are you sure you want to delete this attachment? This action cannot be undone."
          confirmText="Delete"
          confirmVariant="danger"
          loading={deleteAttachmentConfirm.loading}
          onConfirm={confirmDeleteAttachment}
          onCancel={() =>
            setDeleteAttachmentConfirm({
              open: false,
              fileName: null,
              loading: false,
            })
          }
        />
      </>
    </div>
  );
};

export default Ticket;
