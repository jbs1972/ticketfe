import { Paperclip, Eye, Trash2 } from "lucide-react";
import { formatFileSize } from "../../utilities/ticketHelpers";

const AttachmentsList = ({
  attachments,
  label = "Existing Attachments",
  isAdmin,
  onView,
  onDownload,
  onDelete,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {attachments.length ? (
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
          {attachments.map((file) => (
            <div
              key={file.fileName}
              className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
              title={formatFileSize(file.size)}
            >
              <button
                type="button"
                onClick={() => onDownload(file)}
                className="flex max-w-[180px] items-center gap-1 transition-colors hover:text-gray-900"
                title="Download"
              >
                <Paperclip size={10} className="shrink-0" />
                <span className="truncate">{file.originalName}</span>
              </button>
              <button
                type="button"
                onClick={() => onView(file)}
                className="ml-1 text-gray-500 transition-colors hover:text-gray-700"
                title="View"
              >
                <Eye size={11} />
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(file.fileName)}
                  className="text-red-500 transition-colors hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No attachments available.</p>
      )}
    </div>
  );
};

export default AttachmentsList;
