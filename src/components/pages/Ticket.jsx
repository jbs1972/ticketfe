import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useTickets from "../../hooks/useTickets";
import useAttachmentActions from "../../hooks/useAttachmentActions";
import { searchTickets } from "../../services/ticket.service";
import { getTicketStatuses } from "../../services/ticketStatus.service";
import TicketViewModal from "../ticket/TicketViewModal";
import TicketTable from "../ticket/TicketTable";
import TicketFormModal from "../ticket/TicketFormModal";
import Pagination from "../common/Pagination";
import ConfirmDialog from "../common/ConfirmDialog";
import SearchBar from "../common/SearchBar";
import Button from "../common/Button";
import { toastError } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";

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
  const [statuses, setStatuses] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
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

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await getTicketStatuses();
        setStatuses(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStatuses();
  }, []);

  const handleSearch = async (criteria) => {
    const isEmpty =
      !criteria.q && !criteria.status && !criteria.from && !criteria.to;
    if (isEmpty) {
      setSearchResults(null);
      setCurrentPage(1);
      return;
    }
    try {
      setSearching(true);
      const response = await searchTickets(criteria);
      setSearchResults(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      toastError(
        "Search Failed",
        getErrorMessage(error, "Could not search tickets."),
      );
    } finally {
      setSearching(false);
    }
  };

  const displayedTickets = searchResults !== null ? searchResults : tickets;
  const currentTickets = displayedTickets.slice(
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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Ticket Details</h2>
        {isAdmin && (
          <Button onClick={openCreateModal} leftIcon={<Plus size={16} />}>
            Add Ticket
          </Button>
        )}
      </div>
      {pendingUpdateIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>New updates are available.</span>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}
      <SearchBar
        placeholder="Search by subject, description, code, attachment or comment..."
        showStatus={true}
        statusOptions={statuses.map((s) => s.name)}
        onSearch={handleSearch}
      />
      <TicketTable
        tickets={currentTickets}
        loading={loading || searching}
        isAdmin={isAdmin}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={requestDeleteTicket}
        statuses={statuses}
      />
      <Pagination
        currentPage={currentPage}
        totalItems={displayedTickets.length}
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
            initialStatus={editingTicket ? editingTicket.status : ""}
            statuses={statuses}
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
