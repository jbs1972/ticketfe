import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  getTicketById,
  setTicketStatus,
  updateTicket as updateTicketService,
  patchTicket,
  uploadAttachments,
  deleteAttachment as deleteAttachmentService,
} from "../../services/ticket.service";
import { getTicketStatuses } from "../../services/ticketStatus.service";
import { getTicketPriorities } from "../../services/ticketPriority.service";
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
  isEmptyRichText,
  isRichTextHtml,
  formatDateTime,
} from "../../utilities/ticketHelpers";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const staticBoxClass =
  "break-words rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800";

const TicketDetail = () => {
  const { ticketCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const {
    handleDownloadAttachment,
    handleDownloadMultiple,
    handleViewAttachment,
  } = useAttachmentActions();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statusSaving, setStatusSaving] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);
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
      return response.data;
    } catch (error) {
      setNotFound(true);
      toastError("Load Failed", getErrorMessage(error, "Ticket not found."));
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchTicket();
      if (!data) return;
      try {
        const [sRes, pRes] = await Promise.all([
          getTicketStatuses(data.company),
          getTicketPriorities(data.company),
        ]);
        setStatuses(sRes.data || []);
        setPriorities(pRes.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handlePriorityChange = async (event) => {
    const newPriority = event.target.value;
    try {
      setPrioritySaving(true);
      await patchTicket(ticketCode, { priority: newPriority });
      setTicket((prev) => ({ ...prev, priority: newPriority }));
      toastSuccess(
        "Priority Updated",
        `Ticket priority set to ${newPriority}.`,
      );
    } catch (error) {
      toastError(
        "Update Failed",
        getErrorMessage(error, "Could not update priority."),
      );
    } finally {
      setPrioritySaving(false);
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
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    setErrors({});
    setSelectedFiles([]);
    setAttachmentsToDelete([]);
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
    return <CardSkeleton />;
  }

  if (notFound || !ticket) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate("/tickets")}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft size={14} /> Back to Tickets
        </button>
        <p className="text-center text-sm text-gray-500">Ticket not found.</p>
      </div>
    );
  }

  return (
    <div>
      {pendingUpdate && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>This ticket may have new updates.</span>
          <button
            onClick={handleRefreshPage}
            disabled={refreshingPage}
            className="flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
          >
            <RefreshCw
              size={12}
              className={refreshingPage ? "animate-spin" : ""}
            />
            {refreshingPage ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT — Ticket details */}
        <div className="space-y-3 self-start rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500">
              Ticket Details
            </h3>
            {!isEditing ? (
              <button
                type="button"
                onClick={enterEditMode}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditMode}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Subject</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFieldChange}
                  readOnly={!isAdmin}
                  className={`w-full break-words rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 read-only:cursor-not-allowed read-only:bg-gray-100 ${
                    errors.subject ? "border-red-500" : ""
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
                )}
              </>
            ) : (
              <div className={staticBoxClass}>{ticket.subject}</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className={labelClass}>Create Date</label>
              <div className={staticBoxClass}>
                {formatDateTime(ticket.createdAt)}
              </div>
            </div>
            <div className="flex-1">
              <label className={labelClass}>Status</label>
              {isAdmin ? (
                <select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={statusSaving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:opacity-60"
                  style={{
                    borderLeft: `4px solid ${currentStatus?.color || "#94a3b8"}`,
                  }}
                >
                  {statuses.map((s) => (
                    <option
                      key={s._id}
                      value={s.name}
                      className="bg-white text-gray-900"
                    >
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium"
                  style={{
                    borderLeft: `4px solid ${currentStatus?.color || "#94a3b8"}`,
                    color: currentStatus?.color || "#64748b",
                  }}
                >
                  {ticket.status}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className={labelClass}>Priority</label>
              {isAdmin ? (
                <select
                  value={ticket.priority || "Normal"}
                  onChange={handlePriorityChange}
                  disabled={prioritySaving}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:opacity-60"
                >
                  {priorities.map((p) => (
                    <option
                      key={p._id}
                      value={p.name}
                      className="bg-white text-gray-900"
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={staticBoxClass}>
                  {ticket.priority || "Normal"}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            {isEditing ? (
              <>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => {
                    setFormData((prev) => ({ ...prev, description: html }));
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  rows={4}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.description}
                  </p>
                )}
              </>
            ) : isRichTextHtml(ticket.description) ? (
              <div
                className="h-36 overflow-y-auto break-words rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            ) : (
              <div className="h-36 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                {ticket.description}
              </div>
            )}
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <AttachmentsList
                  attachments={currentAttachments}
                  isAdmin={isAdmin}
                  onView={(file) => handleViewAttachment(ticketCode, file)}
                  onDownload={(file) =>
                    handleDownloadAttachment(ticketCode, file)
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
              <AttachmentsList
                label="Attachments"
                attachments={ticket.attachments || []}
                isAdmin={false}
                onView={(file) => handleViewAttachment(ticket.ticketCode, file)}
                onDownload={(file) =>
                  handleDownloadAttachment(ticket.ticketCode, file)
                }
              />
            )}
          </div>
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
