import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pen,
  Trash2,
  Eye,
  Paperclip,
  MessageCircle,
  AtSign,
  UserPlus,
} from "lucide-react";
import Table from "../common/Table";
import { formatDateTime } from "../../utilities/ticketHelpers";
import { getMyMentions } from "../../services/comment.service";

const TicketTable = ({
  tickets,
  loading,
  isAdmin,
  currentPage,
  itemsPerPage,
  onView,
  onEdit,
  onDelete,
  onAllocate,
  statuses = [],
  emptyMessage = "No tickets found",
}) => {
  const navigate = useNavigate();
  const [mentionsByTicket, setMentionsByTicket] = useState({});

  useEffect(() => {
    getMyMentions()
      .then((response) => setMentionsByTicket(response.data || {}))
      .catch(() => setMentionsByTicket({}));
  }, []);

  const columns = [
    {
      key: "slNo",
      header: "Sl No.",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-16",
      render: (_, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: "ticketCode",
      header: "Code",
      width: "w-24",
      render: (ticket) => (
        <span className="text-gray-600">{ticket.ticketCode}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (ticket) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/tickets/${ticket.ticketCode}`)}
            className="text-left font-medium text-gray-800 transition-colors hover:text-blue-700 hover:underline"
          >
            {ticket.subject}
          </button>
          {ticket.attachments?.length > 0 && (
            <Paperclip
              className="shrink-0 text-gray-400"
              size={12}
              title={`${ticket.attachments.length} attachment(s)`}
            />
          )}
          {mentionsByTicket[ticket.ticketCode]?.length > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/tickets/${ticket.ticketCode}#comment-${mentionsByTicket[ticket.ticketCode][0]}`,
                )
              }
              className="shrink-0 text-amber-600 transition-colors hover:text-amber-700"
              title="You were mentioned in this ticket"
            >
              <AtSign size={12} />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (ticket) => {
        const statusConfig = statuses.find((s) => s.name === ticket.status);
        const color = statusConfig?.color || "#94a3b8";
        return (
          <span className="text-xs font-medium" style={{ color }}>
            {ticket.status}
          </span>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (ticket) => (
        <span className="text-xs text-gray-600">
          {ticket.priority || "Normal"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      headerClassName: "text-center",
      cellClassName: "text-center whitespace-nowrap",
      width: "w-40",
      render: (ticket) => (
        <span className="text-xs text-gray-500">
          {formatDateTime(ticket.createdAt)}
        </span>
      ),
    },
    {
      key: "commentCount",
      header: "Comments",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (ticket) => (
        <div className="flex items-center justify-center gap-1 text-gray-500">
          <MessageCircle size={12} />
          {ticket.commentCount || 0}
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "allocate",
            header: "Allocate",
            headerClassName: "text-center",
            cellClassName: "text-center",
            width: "w-24",
            render: (ticket) => (
              <button
                onClick={() => onAllocate(ticket)}
                className="rounded-md p-1.5 text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                title={
                  ticket.allocatedUsers?.length
                    ? "Update allocation"
                    : "Allocate"
                }
              >
                <UserPlus size={14} />
              </button>
            ),
          },
        ]
      : []),
    {
      key: "view",
      header: "View",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (ticket) => (
        <button
          onClick={() => onView(ticket)}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="View"
        >
          <Eye size={14} />
        </button>
      ),
    },
    {
      key: "edit",
      header: "Edit",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-20",
      render: (ticket) => (
        <button
          onClick={() => onEdit(ticket)}
          className="rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          title="Edit"
        >
          <Pen size={14} />
        </button>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "delete",
            header: "Delete",
            headerClassName: "text-center",
            cellClassName: "text-center",
            width: "w-20",
            render: (ticket) => (
              <button
                onClick={() => onDelete(ticket.ticketCode)}
                className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      columns={columns}
      data={tickets}
      loading={loading}
      emptyMessage={emptyMessage}
    />
  );
};

export default TicketTable;
