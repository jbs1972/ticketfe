import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaPaperclip } from "react-icons/fa";
import Table from "../common/Table";

const TicketTable = ({
  tickets,
  loading,
  isAdmin,
  currentPage,
  itemsPerPage,
  onView,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

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
      key: "subject",
      header: "Subject",
      render: (ticket) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/tickets/${ticket.ticketCode}`)}
            className="text-left hover:text-blue-700 hover:underline"
          >
            {ticket.subject}
          </button>

          {ticket.attachments?.length > 0 && (
            <FaPaperclip
              className="shrink-0 text-slate-400"
              size={12}
              title={`${ticket.attachments.length} attachment(s)`}
            />
          )}
        </div>
      ),
    },
    {
      key: "view",
      header: "View",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "w-24",
      render: (ticket) => (
        <button
          onClick={() => onView(ticket)}
          className="text-green-600 hover:text-green-800"
        >
          <FaEye />
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
          className="text-blue-600 hover:text-blue-800"
        >
          <FaEdit />
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
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
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
      emptyMessage="No tickets found"
    />
  );
};

export default TicketTable;
