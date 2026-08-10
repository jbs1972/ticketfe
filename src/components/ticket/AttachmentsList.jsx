import React from "react";
import { FaEye, FaDownload, FaTrash } from "react-icons/fa";
import { formatFileSize } from "../../utilities/ticketHelpers";

const AttachmentsList = ({
  attachments,
  selectedForDownload,
  isAdmin,
  onToggleSelect,
  onSelectAll,
  onView,
  onDownload,
  onDownloadSelected,
  onDelete,
}) => {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm">Existing Attachments</label>

        {attachments.length > 0 && (
          <button
            type="button"
            onClick={onDownloadSelected}
            disabled={!selectedForDownload.length}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Download Selected ({selectedForDownload.length})
          </button>
        )}
      </div>

      <div className="max-h-40 overflow-y-auto rounded-md border">
        {attachments.length ? (
          <>
            <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-1">
              <input
                type="checkbox"
                checked={selectedForDownload.length === attachments.length}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
              <span className="text-xs text-gray-500">Select All</span>
            </div>

            {attachments.map((file) => (
              <div
                key={file.fileName}
                className="flex items-center justify-between border-b px-3 py-2 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedForDownload.includes(file.fileName)}
                    onChange={() => onToggleSelect(file.fileName)}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.originalName}</p>

                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="ml-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onView(file)}
                    className="text-slate-600 hover:text-slate-800"
                    title="View"
                  >
                    <FaEye />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDownload(file)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Download"
                  >
                    <FaDownload />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDelete(file.fileName)}
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
  );
};

export default AttachmentsList;
