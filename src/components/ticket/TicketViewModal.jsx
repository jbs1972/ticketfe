import { useState, useEffect } from "react";
import { FaDownload, FaEye, FaSyncAlt } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import useEscapeKey from "../../hooks/useEscapeKey";

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const TicketViewModal = ({
  open,
  ticket,
  onClose,
  onEdit,
  onDownload,
  onView,
  canEdit,
  pendingUpdate,
  refreshing,
  onRefresh,
}) => {
  const [selectedFileNames, setSelectedFileNames] = useState([]);

  useEffect(() => {
    setSelectedFileNames([]);
  }, [ticket, open]);

  const navigate = useNavigate();
  useEscapeKey(open, onClose);

  if (!open || !ticket) return null;

  const attachments = ticket.attachments || [];

  const toggleSelect = (fileName) => {
    setSelectedFileNames((prev) =>
      prev.includes(fileName)
        ? prev.filter((f) => f !== fileName)
        : [...prev, fileName],
    );
  };

  const handleDownloadSelected = async () => {
    const files = attachments.filter((f) =>
      selectedFileNames.includes(f.fileName),
    );

    for (const file of files) {
      await onDownload(file);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[700px] rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-5 text-xl font-semibold">Ticket Details</h2>
        {pendingUpdate && (
          <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <span>This ticket may have new updates.</span>

            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-2 py-1 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Subject</label>

          <div className="break-words rounded-md border bg-gray-50 px-3 py-2">
            {ticket.subject}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Description</label>

          <div className="h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-md border bg-gray-50 px-3 py-2">
            {ticket.description}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Attachments</label>

            {attachments.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSelected}
                disabled={!selectedFileNames.length}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                Download Selected ({selectedFileNames.length})
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto rounded-md border">
            {attachments.length ? (
              <>
                <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-1">
                  <input
                    type="checkbox"
                    checked={selectedFileNames.length === attachments.length}
                    onChange={(e) =>
                      setSelectedFileNames(
                        e.target.checked
                          ? attachments.map((f) => f.fileName)
                          : [],
                      )
                    }
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
                        checked={selectedFileNames.includes(file.fileName)}
                        onChange={() => toggleSelect(file.fileName)}
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
                        onClick={() => onView?.(file)}
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
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="px-3 py-5 text-center text-sm text-gray-500">
                No attachments available.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              navigate(`/tickets/${ticket.ticketCode}`);
            }}
            className="rounded-md border px-5 py-2 hover:bg-gray-100"
          >
            View Full Page
          </button>

          {canEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(ticket);
              }}
              className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Edit
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-md border px-5 py-2 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketViewModal;
