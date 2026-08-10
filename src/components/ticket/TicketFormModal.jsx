import React, { useRef, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { toastError } from "../../utilities/toast";
import { getErrorMessage, formatFileSize } from "../../utilities/ticketHelpers";
import AttachmentsList from "./AttachmentsList";
import FileDropzone from "./FileDropzone";
import ConfirmDialog from "../common/ConfirmDialog";
import useEscapeKey from "../../hooks/useEscapeKey";

const TicketFormModal = ({
  editMode,
  ticketCode,
  isAdmin,
  initialSubject,
  initialDescription,
  initialAttachments,
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
  });

  const [errors, setErrors] = useState({});

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [currentAttachments, setCurrentAttachments] = useState(
    initialAttachments || [],
  );

  const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);

  const [selectedForDownload, setSelectedForDownload] = useState([]);

  const [isDragging, setIsDragging] = useState(false);

  const [deleteAttachmentConfirm, setDeleteAttachmentConfirm] = useState({
    open: false,
    fileName: null,
  });

  const fileInputRef = useRef(null);

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

  const handleRefresh = async () => {
    const updated = await refreshTicketDetails(ticketCode);

    if (updated) {
      setFormData({
        subject: updated.subject,
        description: updated.description,
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

    if (!formData.description.trim()) {
      validationErrors.description = "Description is required.";
    }

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const success = editMode
      ? await updateTicket(
          ticketCode,
          formData,
          selectedFiles,
          attachmentsToDelete,
          isAdmin,
        )
      : await createTicket(formData, selectedFiles);

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-[500px] rounded-lg bg-white p-5 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold">
            {editMode ? "Update Ticket" : "Create Ticket"}
          </h3>

          {editMode && hasPendingUpdate && (
            <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <span>This ticket may have new updates.</span>

              <button
                type="button"
                onClick={handleRefresh}
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
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
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
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                onClose();
              }}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {editMode ? "Update" : "Save"}
            </button>
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
