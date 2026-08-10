import { useEffect, useState } from "react";
import { FaPaperclip } from "react-icons/fa";
import {
  getComments,
  addComment,
  downloadCommentAttachment,
} from "../../services/comment.service";
import { toastError, toastSuccess } from "../../utilities/toast";
import { getErrorMessage } from "../../utilities/ticketHelpers";
import socket from "../../services/socket";

const CommentsSection = ({ ticketCode }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await getComments(ticketCode);
      setComments(response.data || []);
    } catch (error) {
      toastError(
        "Load Failed",
        getErrorMessage(error, "Failed to load comments."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [ticketCode]);

  // Live updates - only this section refetches, rest of the ticket page is untouched
  useEffect(() => {
    const handleTicketChanged = (payload) => {
      if (payload?.ticketId !== ticketCode || payload.action !== "commented") {
        return;
      }

      fetchComments();

      toastSuccess(
        "New Comment",
        "A new comment has been added to this ticket.",
      );
    };

    socket.on("ticket:changed", handleTicketChanged);

    return () => socket.off("ticket:changed", handleTicketChanged);
  }, [ticketCode]);

  const handlePostComment = async (event) => {
    event.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setPosting(true);

      await addComment(ticketCode, newMessage.trim(), newFiles);

      setNewMessage("");
      setNewFiles([]);

      await fetchComments();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not add comment."));
    } finally {
      setPosting(false);
    }
  };

  const handleDownloadCommentFile = async (commentId, file) => {
    const response = await downloadCommentAttachment(
      ticketCode,
      commentId,
      file.fileName,
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", file.originalName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col rounded-lg border bg-white p-5 shadow">
      <label className="mb-2 block text-sm font-medium">Comments</label>

      <div className="mb-4 max-h-96 flex-1 space-y-3 overflow-y-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-500">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="rounded-md border bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-slate-700">
                  {comment.authorName}
                </span>

                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm">
                {comment.message}
              </p>

              {comment.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {comment.attachments.map((file) => (
                    <button
                      key={file.fileName}
                      onClick={() => handleDownloadCommentFile(comment._id, file)}
                      className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      <FaPaperclip size={10} />
                      {file.originalName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handlePostComment} className="space-y-2 border-t pt-3">
        <textarea
          rows="3"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Add a comment..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        <div className="flex items-center justify-between">
          <input
            type="file"
            multiple
            onChange={(e) => setNewFiles(Array.from(e.target.files))}
            className="text-xs"
          />

          <button
            type="submit"
            disabled={posting || !newMessage.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {posting ? "Posting..." : "Add Comment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentsSection;