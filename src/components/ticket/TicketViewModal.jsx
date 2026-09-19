import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useEscapeKey from "../../hooks/useEscapeKey";
import Button from "../common/Button";
import AttachmentsList from "./AttachmentsList";
import { isRichTextHtml } from "../../utilities/ticketHelpers";

const TicketViewModal = ({
  open,
  ticket,
  onClose,
  onEdit,
  onDownload,
  onView,
  canEdit,
  statuses = [],
}) => {
  const navigate = useNavigate();
  useEscapeKey(open, onClose);

  if (!open || !ticket) return null;

  const statusColor =
    statuses.find((s) => s.name === ticket.status)?.color || "#64748b";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl animate-scaleIn">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Ticket Details
          </h2>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Subject
            </label>
            <div className="break-words rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
              {ticket.subject}
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Status
              </label>
              <div
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium"
                style={{ color: statusColor }}
              >
                {ticket.status}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Priority
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                {ticket.priority || "Normal"}
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            {isRichTextHtml(ticket.description) ? (
              <div
                className="h-40 overflow-y-auto break-words rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            ) : (
              <div className="h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                {ticket.description}
              </div>
            )}
          </div>
          <AttachmentsList
            label="Attachments"
            attachments={ticket.attachments || []}
            isAdmin={false}
            onView={(file) => onView?.(file)}
            onDownload={(file) => onDownload(file)}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              navigate(`/tickets/${ticket.ticketCode}`);
            }}
          >
            Go to Conversation
          </Button>
          {canEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(ticket);
              }}
              leftIcon={<Download size={0} className="hidden" />}
            >
              Edit
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketViewModal;
