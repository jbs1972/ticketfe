import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import AttachmentsList from "./AttachmentsList";
import FileDropzone from "../common/FileDropzone";
import ConfirmDialog from "../common/ConfirmDialog";
import useEscapeKey from "../../hooks/useEscapeKey";
import useFileDropzone from "../../hooks/useFileDropzone";
import RichTextEditor from "../common/RichTextEditor";
import Button from "../common/Button";
import { getAllProjects } from "../../services/project.service";
import { getAllCompanies } from "../../services/company.service";
import { setTicketStatus } from "../../services/ticket.service";
import { toastError } from "../../utilities/toast";
import {
  isEmptyRichText,
  getErrorMessage,
  handleEnterNavigation,
} from "../../utilities/ticketHelpers";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

const TicketFormModal = ({
  editMode,
  ticketCode,
  isAdmin,
  role,
  initialSubject,
  initialDescription,
  initialAttachments,
  initialStatus,
  initialPriority,
  statuses,
  priorities,
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
  const isSuperAdmin = role === "superadmin";

  const [formData, setFormData] = useState({
    subject: initialSubject,
    description: initialDescription,
    status: initialStatus || "",
    priority: initialPriority || "Normal",
  });
  const [errors, setErrors] = useState({});
  const [currentAttachments, setCurrentAttachments] = useState(
    initialAttachments || [],
  );
  const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);
  const [deleteAttachmentConfirm, setDeleteAttachmentConfirm] = useState({
    open: false,
    fileName: null,
  });

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEscapeKey(true, onClose);

  useEffect(() => {
    if (editMode) return;

    if (isSuperAdmin) {
      getAllCompanies()
        .then((res) => setCompanies(res.data || []))
        .catch(() =>
          toastError("Error", "Failed to load companies for selection."),
        );
    } else {
      setLoadingProjects(true);
      getAllProjects()
        .then((res) => setProjects(res.data || []))
        .catch(() =>
          toastError("Error", "Failed to load projects for selection."),
        )
        .finally(() => setLoadingProjects(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  useEffect(() => {
    if (!isSuperAdmin || editMode) return;

    setSelectedProject("");

    if (!selectedCompany) {
      setProjects([]);
      return;
    }

    setLoadingProjects(true);
    getAllProjects(selectedCompany)
      .then((res) => setProjects(res.data || []))
      .catch(() =>
        toastError("Error", "Failed to load projects for this company."),
      )
      .finally(() => setLoadingProjects(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

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
        priority: updated.priority || "Normal",
      });
      setCurrentAttachments(updated.attachments || []);
      setAttachmentsToDelete([]);
    }
  };

  const statusOptions = isAdmin
    ? statuses
    : currentIndex > -1
      ? nextStatus
        ? [statuses[currentIndex], nextStatus]
        : [statuses[currentIndex]]
      : [];

  const handleSave = async () => {
    const validationErrors = {};
    if (!formData.subject.trim()) {
      validationErrors.subject = "Subject is required.";
    }
    if (isEmptyRichText(formData.description)) {
      validationErrors.description = "Description is required.";
    }
    if (!editMode && !selectedProject) {
      validationErrors.project = "Please select a project.";
    }
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const { status: formStatus, ...restForm } = formData;

    if (editMode && isAdmin && formStatus && formStatus !== initialStatus) {
      try {
        await setTicketStatus(ticketCode, formStatus);
      } catch (error) {
        toastError(
          "Status Change Failed",
          getErrorMessage(error, "Could not update the status."),
        );
        return;
      }
    }

    const payload = editMode
      ? isAdmin
        ? restForm
        : { subject: formData.subject, description: formData.description }
      : {
          subject: formData.subject,
          description: formData.description,
          project: selectedProject,
          priority: formData.priority,
        };
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
          <div
            className="flex-1 overflow-y-auto px-5 py-4"
            onKeyDown={(e) => handleEnterNavigation(e, handleSave)}
          >
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
              {!editMode && isSuperAdmin && (
                <div>
                  <label className={labelClass}>Company</label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="">Select company...</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!editMode && (
                <div>
                  <label className={labelClass}>Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      setErrors((prev) => ({ ...prev, project: "" }));
                    }}
                    disabled={
                      loadingProjects || (isSuperAdmin && !selectedCompany)
                    }
                    className={`${fieldClass} cursor-pointer ${
                      errors.project ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">
                      {isSuperAdmin && !selectedCompany
                        ? "Select a company first"
                        : "Select project..."}
                    </option>
                    {projects.map((p) => (
                      <option
                        key={p._id}
                        value={p._id}
                        disabled={!isAdmin && !p.isActive}
                      >
                        {p.name}
                        {!p.isActive ? " (Frozen)" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.project && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.project}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className={labelClass}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  readOnly={!isAdmin && editMode}
                  className={`${fieldClass} ${
                    !isAdmin && editMode
                      ? "cursor-not-allowed !bg-gray-100"
                      : ""
                  } ${errors.subject ? "border-red-500" : ""}`}
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
                    className={`${fieldClass} cursor-pointer`}
                    style={{
                      borderLeft: `4px solid ${currentStatusColor || "#94a3b8"}`,
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
                </div>
              )}
              {isAdmin && priorities?.length > 0 && (
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className={`${fieldClass} cursor-pointer`}
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
                  isAdmin={isAdmin}
                  onView={(file) => onViewAttachment(ticketCode, file)}
                  onDownload={(file) => onDownloadAttachment(ticketCode, file)}
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
            <Button onClick={handleSave}>
              {editMode ? "Update" : "Create"}
            </Button>
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
