import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";
import {
  getTickets,
  getTicketById,
  createTicket as createTicketService,
  updateTicket as updateTicketService,
  patchTicket,
  deleteTicket as deleteTicketService,
  uploadAttachments,
  deleteAttachment as deleteAttachmentService,
} from "../services/ticket.service";
import { toastError, toastSuccess } from "../utilities/toast";
import {
  getErrorMessage,
  getChangedTicketIds,
} from "../utilities/ticketHelpers";

const FALLBACK_POLL_INTERVAL_MS = 300000;

// scopeParams: { companyId?, projectId? } - which tickets to fetch.
// enabled: when false, the hook holds an empty list and skips fetching
// entirely (e.g. a User who hasn't picked a project yet).
const useTickets = (scopeParams = {}, enabled = true) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingUpdateIds, setPendingUpdateIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const ticketsRef = useRef([]);
  const pendingUpdateRef = useRef([]);
  const scopeRef = useRef(scopeParams);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  useEffect(() => {
    pendingUpdateRef.current = pendingUpdateIds;
  }, [pendingUpdateIds]);

  useEffect(() => {
    scopeRef.current = scopeParams;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeParams.companyId, scopeParams.projectId]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const fetchTickets = async (silent = false) => {
    if (!enabledRef.current) {
      setTickets([]);
      setPendingUpdateIds([]);
      return;
    }

    try {
      if (!silent) setLoading(true);

      const response = await getTickets(scopeRef.current);
      const newTickets = response.data || [];

      if (silent) {
        const changedIds = getChangedTicketIds(ticketsRef.current, newTickets);

        if (changedIds.length) {
          setPendingUpdateIds((prev) =>
            Array.from(new Set([...prev, ...changedIds])),
          );

          if (pendingUpdateRef.current.length === 0) {
            toastSuccess(
              "Update Available",
              "Ticket data has changed. Click refresh to load the latest.",
            );
          }
        }
      } else {
        setTickets(newTickets);
        setPendingUpdateIds([]);
      }
    } catch (error) {
      console.error(error);

      if (!silent) {
        toastError(
          "Load Failed",
          getErrorMessage(error, "Failed to load tickets."),
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const handleTicketChanged = () => {
      fetchTickets(true);
    };

    socket.on("ticket:changed", handleTicketChanged);

    const intervalId = setInterval(() => {
      fetchTickets(true);
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      socket.off("ticket:changed", handleTicketChanged);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeParams.companyId, scopeParams.projectId, enabled]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchTickets(false);
    setRefreshing(false);
  };

  const refreshTicketDetails = async (ticketCode) => {
    try {
      setRefreshing(true);

      await fetchTickets(false);

      const response = await getTicketById(ticketCode);

      return response.data;
    } catch (error) {
      console.error(error);

      toastError(
        "Refresh Failed",
        getErrorMessage(error, "Could not refresh ticket data."),
      );

      return null;
    } finally {
      setRefreshing(false);
    }
  };

  const createTicket = async (formData, selectedFiles) => {
    try {
      const response = await createTicketService(formData);
      const newTicketCode = response.data.ticketCode;

      if (selectedFiles.length) {
        await uploadAttachments(newTicketCode, selectedFiles);
      }

      toastSuccess(
        "Ticket Created",
        "The ticket has been successfully created.",
      );

      fetchTickets();

      return true;
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Creation Failed",
        getErrorMessage(
          error,
          "The ticket could not be created. Please try again.",
        ),
      );

      return false;
    }
  };

  const updateTicket = async (
    ticketCode,
    formData,
    selectedFiles,
    attachmentsToDelete,
    isAdmin,
  ) => {
    try {
      if (isAdmin) {
        await updateTicketService(ticketCode, formData);
      } else {
        await patchTicket(ticketCode, {
          description: formData.description,
        });
      }

      if (selectedFiles.length) {
        await uploadAttachments(ticketCode, selectedFiles);
      }

      if (attachmentsToDelete.length) {
        await Promise.all(
          attachmentsToDelete.map((fileName) =>
            deleteAttachmentService(ticketCode, fileName),
          ),
        );
      }

      toastSuccess(
        "Ticket Updated",
        "The ticket has been successfully updated.",
      );

      setPendingUpdateIds((prev) => prev.filter((id) => id !== ticketCode));

      fetchTickets();

      return true;
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Update Failed",
        getErrorMessage(
          error,
          "The ticket could not be updated. Please try again.",
        ),
      );

      return false;
    }
  };

  const deleteTicket = async (ticketCode) => {
    try {
      await deleteTicketService(ticketCode);

      toastSuccess(
        "Ticket Deleted",
        "The ticket has been successfully deleted.",
      );

      fetchTickets();

      return true;
    } catch (error) {
      console.error(error);

      toastError(
        "Ticket Deletion Failed",
        getErrorMessage(
          error,
          "The ticket could not be deleted. Please try again.",
        ),
      );

      return false;
    }
  };

  return {
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
  };
};

export default useTickets;
