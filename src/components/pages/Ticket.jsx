import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import useTickets from "../../hooks/useTickets";
import useAttachmentActions from "../../hooks/useAttachmentActions";
import { searchTickets } from "../../services/ticket.service";
import { getTicketStatuses } from "../../services/ticketStatus.service";
import { getTicketPriorities } from "../../services/ticketPriority.service";
import { getAllProjects, getMyProjects } from "../../services/project.service";
import { getAllCompanies } from "../../services/company.service";
import TicketViewModal from "../ticket/TicketViewModal";
import TicketTable from "../ticket/TicketTable";
import TicketFormModal from "../ticket/TicketFormModal";
import TicketAllocateModal from "../ticket/TicketAllocateModal";
import Pagination from "../common/Pagination";
import ConfirmDialog from "../common/ConfirmDialog";
import SearchBar from "../common/SearchBar";
import Button from "../common/Button";
import { toastError } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";

const ITEMS_PER_PAGE = 10;

const Ticket = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";
  const isRegularUser = user?.role === "user";

  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(
    searchParams.get("company") || "",
  );
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(
    searchParams.get("project") || "",
  );
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Keep the scope in the URL so Back navigation restores the exact view
  useEffect(() => {
    const params = {};
    if (selectedCompany) params.company = selectedCompany;
    if (selectedProject) params.project = selectedProject;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, selectedProject]);

  const ticketsEnabled = isSuperAdmin ? !!selectedCompany : true;

  const scopeParams = {
    companyId: isSuperAdmin ? selectedCompany || undefined : undefined,
    projectId: selectedProject || undefined,
  };

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
  } = useTickets(scopeParams, ticketsEnabled);
  const {
    handleDownloadAttachment,
    handleDownloadMultiple,
    handleViewAttachment,
  } = useAttachmentActions();
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
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
  const [allocateTarget, setAllocateTarget] = useState(null);

  const configCompanyId = isSuperAdmin ? selectedCompany : user?.company;

  useEffect(() => {
    if (!configCompanyId) {
      setStatuses([]);
      setPriorities([]);
      return;
    }
    const load = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          getTicketStatuses(configCompanyId),
          getTicketPriorities(configCompanyId),
        ]);
        setStatuses(sRes.data || []);
        setPriorities(pRes.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [configCompanyId]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    getAllCompanies()
      .then((res) => setCompanies(res.data || []))
      .catch(() => toastError("Load Failed", "Failed to load companies."));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) {
      setSelectedProject("");

      if (!selectedCompany) {
        setProjects([]);
        return;
      }

      setProjectsLoading(true);
      getAllProjects(selectedCompany)
        .then((res) => setProjects(res.data || []))
        .catch(() =>
          toastError(
            "Load Failed",
            "Failed to load projects for this company.",
          ),
        )
        .finally(() => setProjectsLoading(false));
      return;
    }

    if (user?.role === "admin") {
      setProjectsLoading(true);
      getAllProjects()
        .then((res) => setProjects(res.data || []))
        .catch(() => toastError("Load Failed", "Failed to load projects."))
        .finally(() => setProjectsLoading(false));
      return;
    }

    if (isRegularUser) {
      setProjectsLoading(true);
      getMyProjects()
        .then((res) => setProjects(res.data || []))
        .catch(() => toastError("Load Failed", "Failed to load your projects."))
        .finally(() => setProjectsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, selectedCompany, isRegularUser, user?.role]);

  const handleSearch = async (criteria) => {
    const isEmpty =
      !criteria.q && !criteria.status && !criteria.from && !criteria.to;
    if (isEmpty) {
      setSearchResults(null);
      setCurrentPage(1);
      return;
    }
    if (!ticketsEnabled) return;
    try {
      setSearching(true);
      const response = await searchTickets({ ...criteria, ...scopeParams });
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

  const emptyMessage =
    isSuperAdmin && !selectedCompany
      ? "Select a company to view its tickets"
      : isRegularUser && projects.length === 0
        ? "You have not been assigned to any project yet."
        : "No tickets found";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Ticket Details</h2>
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option
                  key={c._id}
                  value={c._id}
                  className="bg-white text-gray-900"
                >
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {(!isRegularUser || projects.length > 0) && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={projectsLoading || (isSuperAdmin && !selectedCompany)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="" className="bg-white text-gray-900">
                All projects
              </option>
              {projects.map((p) => (
                <option
                  key={p._id}
                  value={p._id}
                  disabled={isRegularUser && !p.isActive}
                  className="bg-white text-gray-900"
                >
                  {p.name}
                  {!p.isActive ? " (Frozen)" : ""}
                </option>
              ))}
            </select>
          )}
          {isAdmin && (
            <Button onClick={openCreateModal} leftIcon={<Plus size={16} />}>
              Add Ticket
            </Button>
          )}
        </div>
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
        onAllocate={setAllocateTarget}
        statuses={statuses}
        emptyMessage={emptyMessage}
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
          statuses={statuses}
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
            role={user?.role}
            initialSubject={editingTicket ? editingTicket.subject : ""}
            initialDescription={editingTicket ? editingTicket.description : ""}
            initialAttachments={
              editingTicket ? editingTicket.attachments || [] : []
            }
            initialStatus={editingTicket ? editingTicket.status : ""}
            initialPriority={editingTicket ? editingTicket.priority : ""}
            statuses={statuses}
            priorities={priorities}
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
        {allocateTarget && (
          <TicketAllocateModal
            ticket={allocateTarget}
            onClose={() => setAllocateTarget(null)}
            onSaved={fetchTickets}
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
