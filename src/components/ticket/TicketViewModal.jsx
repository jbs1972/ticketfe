const TicketViewModal = ({ open, ticket, onClose, onEdit, canEdit }) => {
  if (!open || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[650px] rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-5 text-xl font-semibold">Ticket Details</h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Subject</label>

          <div className="rounded-md border bg-gray-50 px-3 py-2 break-words">
            {ticket.subject}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>

          <div className="h-72 overflow-y-auto rounded-md border bg-gray-50 px-3 py-2 whitespace-pre-wrap break-words">
            {ticket.description}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
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
