import { useState } from "react";
import { RefreshCw } from "lucide-react";
import AttachmentsList from "./AttachmentsList";
import FileDropzone from "../common/FileDropzone";
import ConfirmDialog from "../common/ConfirmDialog";
import useEscapeKey from "../../hooks/useEscapeKey";
import useFileDropzone from "../../hooks/useFileDropzone";
import RichTextEditor from "../common/RichTextEditor";
import Button from "../common/Button";
import { isEmptyRichText } from "../../utilities/ticketHelpers";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const fieldClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 read-only:cursor-not-allowed read-only:bg-gray-100";

const TicketFormModal = ({
  editMode,
  ticketCode,
  isAdmin,
  initialSubject,
  initialDescription,
  initialAttachments,
  initialStatus,
  statuses,
  hasPendingUpdate,
  refreshing,
  refreshTicketDetails,
  createTicket,
  updateTicket,
  fetchTicketsList,
  onDownloadAttachment,
  onViewAttachment,
  onDownloadMultiple,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    subject: initialSubject,
    description: initialDescription,
    status: initialStatus || "",
  });
  const [errors, setErrors] = useState({});
  const [currentAttachments, setCurrentAttachments] = useState(
    initialAttachments || [],
  );
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);
  const [selectedForDownload, setSelectedForDownload] = useState([]);
  const [deleteAttachmentConfirm, setDeleteAttachmentConfirm] = useState({
    open: false,
    fileName: null,
  });

  useEscapeKey(true, onClose);

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

  const handleRefresh = async () => {
    const updated = await refreshTicketDetails(ticketCode);
    if (updated) {
      setFormData({
        subject: updated.subject,
        description: updated.description,
        status: updated.status,
      });
      setCurrentAttachments(updated.attachments || []);
      setAttachmentsToDelete([]);
      setSelectedForDownload([]);
    }
  };

  const handleSave = async () => {
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
    const payload =
      isAdmin && editMode
        ? formData
        : { subject: formData.subject, description: formData.description };
    const success = editMode
      ? await updateTicket(
          ticketCode,
          payload,
          selectedFiles,
          attachmentsToDelete,
          isAdmin,
        )
      : await createTicket(payload, selectedFiles);
    if (success) {
      onClose();
    }
  };

  const toggleSelectForDownload = (fileName) => {
    setSelectedForDownload((prev) =>
      prev.includes(fileName)
        ? prev.filter((f) => f !== fileName)
        : [...prev, fileName],
    );
  };

  const requestDeleteAttachment = (fileName) => {
    setDeleteAttachmentConfirm({
      open: true,
      fileName,
    });
  };

  const confirmDeleteAttachment = () => {
    const fileName = deleteAttachmentConfirm.fileName;
    if (!fileName) {
      return;
    }
    setAttachmentsToDelete((prev) =>
      prev.includes(fileName) ? prev : [...prev, fileName],
    );
    setCurrentAttachments((prev) =>
      prev.filter((attachment) => attachment.fileName !== fileName),
    );
    setSelectedForDownload((prev) => prev.filter((name) => name !== fileName));
    setDeleteAttachmentConfirm({
      open: false,
      fileName: null,
    });
  };

  const {
    selectedFiles,
    isDragging,
    fileInputRef,
    handleFileChange,
    removeSelectedFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resetFiles,
  } = useFileDropzone();

  const currentStatusColor = statuses?.find(
    (s) => s.name === formData.status,
  )?.color;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
        <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl animate-scaleIn">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="mb-4 text-base font-semibold text-gray-900">
              {editMode ? "Update Ticket" : "Create Ticket"}
            </h3>
            {editMode && hasPendingUpdate && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <span>This ticket may have new updates.</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2 py-1 font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
                >
                  <RefreshCw
                    size={11}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  readOnly={!isAdmin && editMode}
                  className={`${fieldClass} ${
                    errors.subject ? "border-red-500" : ""
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
                )}
              </div>
              {editMode && isAdmin && statuses?.length > 0 && (
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={fieldClass}
                    style={{
                      borderLeft: `4px solid ${currentStatusColor || "#94a3b8"}`,
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Description</label>
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
              </div>
              {editMode && (
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
                  onView={(file) => onViewAttachment(ticketCode, file)}
                  onDownload={(file) => onDownloadAttachment(ticketCode, file)}
                  onDownloadSelected={() =>
                    onDownloadMultiple(
                      ticketCode,
                      currentAttachments.filter((file) =>
                        selectedForDownload.includes(file.fileName),
                      ),
                    )
                  }
                  onDelete={requestDeleteAttachment}
                />
              )}
              {isAdmin && (
                <FileDropzone
                  label={editMode ? "Upload More Files" : "Upload Attachments"}
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
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <Button
              variant="secondary"
              onClick={() => {
                setErrors({});
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>{editMode ? "Update" : "Save"}</Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteAttachmentConfirm.open}
        type="delete"
        title="Remove Attachment"
        message="This attachment will be removed only after you click Update."
        confirmText="Remove"
        confirmVariant="danger"
        onConfirm={confirmDeleteAttachment}
        onCancel={() =>
          setDeleteAttachmentConfirm({
            open: false,
            fileName: null,
          })
        }
      />
    </>
  );
};

export default TicketFormModal;
