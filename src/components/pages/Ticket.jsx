import React, { useState } from "react";
import { FaPlus, FaSyncAlt } from "react-icons/fa";

import useAuth from "../../hooks/useAuth";
import useTickets from "../../hooks/useTickets";
import useAttachmentActions from "../../hooks/useAttachmentActions";

import TicketViewModal from "../ticket/TicketViewModal";
import TicketTable from "../ticket/TicketTable";
import TicketFormModal from "../ticket/TicketFormModal";
import Pagination from "../common/Pagination";
import ConfirmDialog from "../common/ConfirmDialog";
import { getErrorMessage, formatFileSize } from "../../utilities/ticketHelpers";

const ITEMS_PER_PAGE = 10;

const Ticket = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const {
    tickets,
    loading,
    refreshing,
    pendingUpdateIds,
    fetchTickets,
    handleManualRefresh,
    refreshTicketDetails,
    createTicket,
    updateTicket,
    deleteTicket,
  } = useTickets();

  const {
    handleDownloadAttachment,
    handleDownloadMultiple,
    handleViewAttachment,
  } = useAttachmentActions();

  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState("");
  const [editingTicket, setEditingTicket] = useState(null);

  const [deleteTicketConfirm, setDeleteTicketConfirm] = useState({
    open: false,
    id: null,
    loading: false,
  });

  const currentTickets = tickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentTicketId("");
    setEditingTicket(null);
    setShowModal(true);
  };

  const openEditModal = (ticket) => {
    setEditMode(true);
    setCurrentTicketId(ticket._id);
    setEditingTicket(ticket);
    setShowModal(true);
  };

  const openViewModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  const handleRefreshViewModal = async () => {
    const updated = await refreshTicketDetails(selectedTicket._id);
    if (updated) setSelectedTicket(updated);
  };

  const requestDeleteTicket = (id) => {
    setDeleteTicketConfirm({ open: true, id, loading: false });
  };

  const confirmDeleteTicket = async () => {
    const id = deleteTicketConfirm.id;

    setDeleteTicketConfirm((prev) => ({ ...prev, loading: true }));
    await deleteTicket(id);
    setDeleteTicketConfirm({ open: false, id: null, loading: false });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-700">
          Ticket Details
        </h2>

        <div className="flex items-center gap-3">
          
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              <FaPlus />
              Add Ticket
            </button>
          )}
        </div>
      </div>

      {pendingUpdateIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>New updates are available.</span>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-60"
          >
            <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

      <TicketTable
        tickets={currentTickets}
        loading={loading}
        isAdmin={isAdmin}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={requestDeleteTicket}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={tickets.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <>
        <TicketViewModal
          open={showViewModal}
          ticket={selectedTicket}
          canEdit={true}
          onEdit={openEditModal}
          onDownload={(file) =>
            handleDownloadAttachment(selectedTicket.ticketCode, file)
          }
          onView={(file) =>
            handleViewAttachment(selectedTicket.ticketCode, file)
          }
          onClose={() => setShowViewModal(false)}
          pendingUpdate={
            selectedTicket
              ? pendingUpdateIds.includes(selectedTicket._id)
              : false
          }
          refreshing={refreshing}
          onRefresh={handleRefreshViewModal}
        />

        {showModal && (
          <TicketFormModal
            editMode={editMode}
            ticketCode={editingTicket ? editingTicket.ticketCode : ""}
            isAdmin={isAdmin}
            initialSubject={editingTicket ? editingTicket.subject : ""}
            initialDescription={editingTicket ? editingTicket.description : ""}
            initialAttachments={
              editingTicket ? editingTicket.attachments || [] : []
            }
            hasPendingUpdate={pendingUpdateIds.includes(currentTicketId)}
            refreshing={refreshing}
            refreshTicketDetails={refreshTicketDetails}
            createTicket={createTicket}
            updateTicket={updateTicket}
            fetchTicketsList={fetchTickets}
            onDownloadAttachment={handleDownloadAttachment}
            onViewAttachment={handleViewAttachment}
            onDownloadMultiple={handleDownloadMultiple}
            onClose={() => setShowModal(false)}
          />
        )}

        <ConfirmDialog
          open={deleteTicketConfirm.open}
          type="delete"
          title="Delete Ticket"
          message='This action cannot be undone. Type "DELETE" to permanently delete this ticket.'
          confirmText="Delete"
          confirmVariant="danger"
          loading={deleteTicketConfirm.loading}
          requireDeleteConfirmation={true}
          onConfirm={confirmDeleteTicket}
          onCancel={() =>
            setDeleteTicketConfirm({
              open: false,
              id: null,
              loading: false,
            })
          }
        />
      </>
    </div>
  );
};

export default Ticket;
