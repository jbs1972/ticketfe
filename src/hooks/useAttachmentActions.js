import { downloadAttachment } from "../services/ticket.service";
import { toastError } from "../utilities/toast";
import { isViewable } from "../utilities/ticketHelpers";
import { getErrorMessage, formatFileSize } from "../utilities/ticketHelpers";

const useAttachmentActions = () => {
  const handleDownloadAttachment = async (ticketId, file) => {
    try {
      const response = await downloadAttachment(ticketId, file.fileName);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", file.originalName);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      toastError(
        "Download Failed",
        error?.response?.data?.message ||
          "The attachment could not be downloaded. Please try again."
      );
    }
  };

  const handleDownloadMultiple = async (ticketId, files) => {
    for (const file of files) {
      await handleDownloadAttachment(ticketId, file);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  };

  const handleViewAttachment = async (ticketId, file) => {
    if (!isViewable(file.mimeType)) {
      handleDownloadAttachment(ticketId, file);
      return;
    }

    const newTab = window.open("", "_blank");

    try {
      const response = await downloadAttachment(ticketId, file.fileName);

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: file.mimeType }),
      );

      if (newTab) {
        newTab.location.href = url;
      }
    } catch (error) {
      console.error(error);

      if (newTab) newTab.close();

      toastError(
        "View Failed",
        error?.response?.data?.message ||
          "The attachment could not be opened. Please try again.",
        
      );
    }
  };

  return {
    handleDownloadAttachment,
    handleDownloadMultiple,
    handleViewAttachment,
  };
};

export default useAttachmentActions;
