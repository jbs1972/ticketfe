import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEye,
  FaDownload,
  FaPen,
  FaSyncAlt,
} from "react-icons/fa";
import {
  getTicketById,
  setTicketStatus,
  updateTicket as updateTicketService,
  patchTicket,
  uploadAttachments,
  deleteAttachment as deleteAttachmentService,
} from "../../services/ticket.service";
import { getTicketStatuses } from "../../services/ticketStatus.service";
import useAuth from "../../hooks/useAuth";
import useAttachmentActions from "../../hooks/useAttachmentActions";
import { toastError, toastSuccess } from "../../utilities/toast";
import CardSkeleton from "../common/CardSkeleton";
import AttachmentsList from "../ticket/AttachmentsList";
import FileDropzone from "../common/FileDropzone";
import ConfirmDialog from "../common/ConfirmDialog";
import CommentsSection from "../ticket/CommentsSection";
import socket from "../../services/socket";
import RichTextEditor from "../common/RichTextEditor";
import {
  getErrorMessage,
  formatFileSize,
  isEmptyRichText,
  isRichTextHtml,
  formatDateTime,
} from "../../utilities/ticketHelpers";

const TicketDetail = () => {
  const { ticketCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const {
    handleDownloadAttachment,
    handleDownloadMultiple,
    handleViewAttachment,
  } = useAttachmentActions();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [statusSaving, setStatusSaving] = useState(false);

  const [refreshingPage, setRefreshingPage] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);

  // Inline edit state (ticket side)
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ subject: "", description: "" });
  const [errors, setErrors] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentAttachments, setCurrentAttachments] = useState([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);
  const [selectedForDownload, setSelectedForDownload] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteAttachmentConfirm, setDeleteAttachmentConfirm] = useState({
    open: false,
    fileName: null,
  });
  const fileInputRef = useRef(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      const response = await getTicketById(ticketCode);

      setTicket(response.data);

      return true;
    } catch (error) {
      setNotFound(true);

      toastError("Load Failed", getErrorMessage(error, "Ticket not found."));

      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await getTicketStatuses();

      setStatuses(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTicket();
    fetchStatuses();
  }, [ticketCode]);

  useEffect(() => {
    const handleTicketChanged = (payload) => {
      if (payload?.ticketId !== ticketCode) return;

      // Comment-only updates are handled inside CommentsSection
      if (payload.action === "commented") return;

      setPendingUpdate(true);

      toastSuccess(
        "Update Available",
        "This ticket has new updates. Click refresh to load the latest.",
      );
    };

    socket.on("ticket:changed", handleTicketChanged);

    return () => socket.off("ticket:changed", handleTicketChanged);
  }, [ticketCode]);

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    try {
      setStatusSaving(true);

      await setTicketStatus(ticketCode, newStatus);

      setTicket((prev) => ({ ...prev, status: newStatus }));

      toastSuccess("Status Updated", `Ticket marked as ${newStatus}.`);
    } catch (error) {
      toastError(
        "Update Failed",
        getErrorMessage(error, "Could not update status."),
      );
    } finally {
      setStatusSaving(false);
    }
  };

  // ---- Inline edit handlers (ticket side) ----

  const enterEditMode = () => {
    setFormData({
      subject: ticket.subject,
      description: ticket.description,
    });
    setCurrentAttachments(ticket.attachments || []);
    setAttachmentsToDelete([]);
    setSelectedFiles([]);
    setSelectedForDownload([]);
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    setErrors({});
    setSelectedFiles([]);
    setAttachmentsToDelete([]);
    setSelectedForDownload([]);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addFiles = (newFiles) => {
    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));

      const uniqueNewFiles = newFiles.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}`),
      );

      return [...prev, ...uniqueNewFiles];
    });
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const toggleSelectForDownload = (fileName) => {
    setSelectedForDownload((prev) =>
      prev.includes(fileName)
        ? prev.filter((f) => f !== fileName)
        : [...prev, fileName],
    );
  };

  const requestDeleteAttachment = (fileName) => {
    setDeleteAttachmentConfirm({ open: true, fileName });
  };

  const confirmDeleteAttachment = () => {
    const fileName = deleteAttachmentConfirm.fileName;

    if (!fileName) return;

    setAttachmentsToDelete((prev) =>
      prev.includes(fileName) ? prev : [...prev, fileName],
    );

    setCurrentAttachments((prev) =>
      prev.filter((attachment) => attachment.fileName !== fileName),
    );

    setSelectedForDownload((prev) => prev.filter((name) => name !== fileName));

    setDeleteAttachmentConfirm({ open: false, fileName: null });
  };

  const handleSaveEdit = async () => {
    const validationErrors = {};

    if (!formData.subject.trim()) {
      validationErrors.subject = "Subject is required.";
    }

    if (isEmptyRichText(formData.description)) {
      validationErrors.description = "Description is required.";
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);

      if (isAdmin) {
        await updateTicketService(ticketCode, formData);
      } else {
        await patchTicket(ticketCode, { description: formData.description });
      }

      if (selectedFiles.length) {
        await uploadAttachments(ticketCode, selectedFiles);
      }

      if (attachmentsToDelete.length) {
        await Promise.all(
          attachmentsToDelete.map((fileName) =>
            deleteAttachmentService(ticketCode, fileName),
          ),
        );
      }

      toastSuccess(
        "Ticket Updated",
        "The ticket has been successfully updated.",
      );

      await fetchTicket();

      setIsEditing(false);
    } catch (error) {
      toastError(
        "Ticket Update Failed",
        getErrorMessage(
          error,
          "The ticket could not be updated. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshPage = async () => {
    try {
      setRefreshingPage(true);

      const ok = await fetchTicket();

      setPendingUpdate(false);

      if (ok) {
        toastSuccess("Refreshed", "Ticket details have been refreshed.");
      }
    } finally {
      setRefreshingPage(false);
    }
  };

  const currentStatus = statuses.find((s) => s.name === ticket?.status);

  if (loading) {
    return (
      <div className="p-4">
        <CardSkeleton />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => navigate("/tickets")}
          className="mb-4 flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
        >
          <FaArrowLeft /> Back to Tickets
        </button>

        <p className="text-center text-gray-500">Ticket not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {pendingUpdate && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>This ticket may have new updates.</span>

          <button
            onClick={handleRefreshPage}
            disabled={refreshingPage}
            className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            <FaSyncAlt className={refreshingPage ? "animate-spin" : ""} />
            {refreshingPage ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT — Ticket details */}
        <div className="space-y-4 rounded-lg border bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500">
              Ticket Details
            </h3>

            {!isEditing && (
              <button
                type="button"
                onClick={enterEditMode}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
              >
                <FaPen />
                Edit
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Subject</label>

            {isEditing ? (
              <>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFieldChange}
                  readOnly={!isAdmin}
                  className={`w-full break-words rounded-md border px-3 py-2 read-only:cursor-not-allowed read-only:bg-gray-100 ${
                    errors.subject ? "border-red-500" : ""
                  }`}
                />

                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </>
            ) : (
              <div className="break-words rounded-md border bg-gray-50 px-3 py-2">
                {ticket.subject}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">
                Create Date
              </label>

              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm">
                {formatDateTime(ticket.createdAt)}
              </div>
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Status</label>

              {isAdmin ? (
                <select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={statusSaving}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    borderLeft: `4px solid ${currentStatus?.color || "#94a3b8"}`,
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="rounded-full px-3 py-1 text-center text-sm font-medium text-white"
                  style={{ backgroundColor: currentStatus?.color || "#94a3b8" }}
                >
                  {ticket.status}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>

            {isEditing ? (
              <>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => {
                    setFormData((prev) => ({ ...prev, description: html }));
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  rows={5}
                />

                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </>
            ) : isRichTextHtml(ticket.description) ? (
              <div
                className="h-40 overflow-y-auto break-words rounded-md border bg-gray-50 px-3 py-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            ) : (
              <div className="h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md border bg-gray-50 px-3 py-2">
                {ticket.description}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Attachments
            </label>

            {isEditing ? (
              <div className="space-y-3">
                <AttachmentsList
                  attachments={currentAttachments}
                  selectedForDownload={selectedForDownload}
                  isAdmin={isAdmin}
                  onToggleSelect={toggleSelectForDownload}
                  onSelectAll={(checked) =>
                    setSelectedForDownload(
                      checked
                        ? currentAttachments.map((file) => file.fileName)
                        : [],
                    )
                  }
                  onView={(file) => handleViewAttachment(ticketCode, file)}
                  onDownload={(file) =>
                    handleDownloadAttachment(ticketCode, file)
                  }
                  onDownloadSelected={() =>
                    handleDownloadMultiple(
                      ticketCode,
                      currentAttachments.filter((file) =>
                        selectedForDownload.includes(file.fileName),
                      ),
                    )
                  }
                  onDelete={requestDeleteAttachment}
                />

                {isAdmin && (
                  <FileDropzone
                    label="Upload More Files"
                    selectedFiles={selectedFiles}
                    isDragging={isDragging}
                    fileInputRef={fileInputRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onFileInputChange={handleFileChange}
                    onRemoveFile={removeSelectedFile}
                  />
                )}
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {ticket.attachments?.length ? (
                  ticket.attachments.map((file) => (
                    <div
                      key={file.fileName}
                      className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {file.originalName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <div className="ml-3 flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleViewAttachment(ticket.ticketCode, file)
                          }
                          className="text-slate-600 hover:text-slate-800"
                        >
                          <FaEye />
                        </button>

                        <button
                          onClick={() =>
                            handleDownloadAttachment(ticket.ticketCode, file)
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-3 text-center text-sm text-gray-500">
                    No attachments available.
                  </p>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={cancelEditMode}
                disabled={saving}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Comments */}
        <CommentsSection ticketCode={ticketCode} />
      </div>

      <ConfirmDialog
        open={deleteAttachmentConfirm.open}
        type="delete"
        title="Remove Attachment"
        message="This attachment will be removed only after you click Save."
        confirmText="Remove"
        confirmVariant="danger"
        onConfirm={confirmDeleteAttachment}
        onCancel={() =>
          setDeleteAttachmentConfirm({ open: false, fileName: null })
        }
      />
    </div>
  );
};

export default TicketDetail;
