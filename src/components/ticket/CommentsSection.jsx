import { useEffect, useState } from "react";
import { FaPaperclip, FaEdit, FaTrash } from "react-icons/fa";
import { toastError, toastSuccess } from "../../utilities/toast";
import {
  getErrorMessage,
  isEmptyRichText,
  isRichTextHtml,
} from "../../utilities/ticketHelpers";
import socket from "../../services/socket";
import useAuth from "../../hooks/useAuth";
import useFileDropzone from "../../hooks/useFileDropzone";
import FileDropzone from "../common/FileDropzone";
import ConfirmDialog from "../common/ConfirmDialog";
import RichTextEditor from "../common/RichTextEditor";
import {
  getComments,
  addComment,
  editComment,
  deleteComment,
  downloadCommentAttachment,
  deleteCommentAttachment,
  searchComments,
} from "../../services/comment.service";
import SearchBar from "../common/SearchBar";

const CommentsSection = ({ ticketCode }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState({
    open: false,
    comment: null,
  });

  const [deleteAttachmentConfirm, setDeleteAttachmentConfirm] = useState({
    open: false,
    comment: null,
    file: null,
  });

  const newCommentDropzone = useFileDropzone();
  const editDropzone = useFileDropzone();

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

    if (isEmptyRichText(newMessage)) return;

    try {
      setPosting(true);

      await addComment(
        ticketCode,
        newMessage,
        newCommentDropzone.selectedFiles,
      );

      setNewMessage("");
      newCommentDropzone.resetFiles();

      await fetchComments();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not add comment."));
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditMessage(comment.message);
    editDropzone.resetFiles();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage("");
    editDropzone.resetFiles();
  };

  const saveEdit = async (comment) => {
    if (isEmptyRichText(editMessage)) {
      toastError("Failed", "Comment message is required.");
      return;
    }

    try {
      setSavingEdit(true);
      await editComment(
        ticketCode,
        comment._id,
        editMessage,
        editDropzone.selectedFiles,
      );
      setEditingId(null);
      editDropzone.resetFiles();
      await fetchComments();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not update comment."));
    } finally {
      setSavingEdit(false);
    }
  };

  const requestDeleteComment = (comment) => {
    setDeleteCommentConfirm({ open: true, comment });
  };

  const confirmDeleteComment = async () => {
    const comment = deleteCommentConfirm.comment;
    setDeleteCommentConfirm({ open: false, comment: null });

    if (!comment) return;

    try {
      setDeletingId(comment._id);
      await deleteComment(ticketCode, comment._id);
      toastSuccess("Comment Deleted", "The comment has been removed.");
      await fetchComments();
    } catch (error) {
      toastError("Failed", getErrorMessage(error, "Could not delete comment."));
    } finally {
      setDeletingId(null);
    }
  };

  const requestDeleteAttachment = (comment, file) => {
    setDeleteAttachmentConfirm({ open: true, comment, file });
  };

  const confirmDeleteAttachment = async () => {
    const { comment, file } = deleteAttachmentConfirm;
    setDeleteAttachmentConfirm({ open: false, comment: null, file: null });

    if (!comment || !file) return;

    try {
      setDeletingAttachment(`${comment._id}-${file.fileName}`);
      await deleteCommentAttachment(ticketCode, comment._id, file.fileName);
      await fetchComments();
    } catch (error) {
      toastError(
        "Failed",
        getErrorMessage(error, "Could not delete attachment."),
      );
    } finally {
      setDeletingAttachment(null);
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

  const handleSearchComments = async (criteria) => {
    const isEmpty = !criteria.q && !criteria.from && !criteria.to;

    if (isEmpty) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const response = await searchComments(ticketCode, criteria);
      setSearchResults(response.data || []);
    } catch (error) {
      toastError(
        "Search Failed",
        getErrorMessage(error, "Could not search comments."),
      );
    } finally {
      setSearching(false);
    }
  };

  const displayedComments = searchResults !== null ? searchResults : comments;
  return (
    <div className="flex flex-col rounded-lg border bg-white p-5 shadow">
      <label className="mb-2 block text-sm font-medium">Comments</label>

      <SearchBar
        placeholder="Search comments by message, date, attachment or author..."
        onSearch={handleSearchComments}
      />

      <div className="mb-4 max-h-96 flex-1 space-y-3 overflow-y-auto">
        {loading || searching ? (
          <p className="text-center text-sm text-gray-500">Loading...</p>
        ) : displayedComments.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            {searchResults !== null
              ? "No matching comments found."
              : "No comments yet."}
          </p>
        ) : (
          displayedComments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-md border bg-slate-50 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>

                {editingId !== comment._id &&
                  comment.authorId === user?._id && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit comment"
                      >
                        <FaEdit size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteComment(comment)}
                        disabled={deletingId === comment._id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Delete comment"
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  )}
              </div>

              {editingId === comment._id ? (
                <div className="space-y-2">
                  <RichTextEditor
                    value={editMessage}
                    onChange={setEditMessage}
                    placeholder="Edit your comment..."
                  />

                  <FileDropzone
                    label="Add Files"
                    selectedFiles={editDropzone.selectedFiles}
                    isDragging={editDropzone.isDragging}
                    fileInputRef={editDropzone.fileInputRef}
                    onDragOver={editDropzone.handleDragOver}
                    onDragLeave={editDropzone.handleDragLeave}
                    onDrop={editDropzone.handleDrop}
                    onFileInputChange={editDropzone.handleFileChange}
                    onRemoveFile={editDropzone.removeSelectedFile}
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(comment)}
                      disabled={savingEdit}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingEdit ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : isRichTextHtml(comment.message) ? (
                <div
                  className="break-words text-sm [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: comment.message }}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {comment.message}
                </p>
              )}

              {comment.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {comment.attachments.map((file) => (
                    <div
                      key={file.fileName}
                      className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs text-slate-600"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadCommentFile(comment._id, file)
                        }
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        <FaPaperclip size={10} />
                        {file.originalName}
                      </button>

                      {comment.authorId === user?._id && (
                        <button
                          type="button"
                          onClick={() => requestDeleteAttachment(comment, file)}
                          disabled={
                            deletingAttachment ===
                            `${comment._id}-${file.fileName}`
                          }
                          className="ml-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Delete attachment"
                        >
                          <FaTrash size={9} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handlePostComment} className="space-y-2 border-t pt-3">
        <RichTextEditor
          value={newMessage}
          onChange={setNewMessage}
          placeholder="Add a comment..."
        />

        <FileDropzone
          label="Attachments"
          selectedFiles={newCommentDropzone.selectedFiles}
          isDragging={newCommentDropzone.isDragging}
          fileInputRef={newCommentDropzone.fileInputRef}
          onDragOver={newCommentDropzone.handleDragOver}
          onDragLeave={newCommentDropzone.handleDragLeave}
          onDrop={newCommentDropzone.handleDrop}
          onFileInputChange={newCommentDropzone.handleFileChange}
          onRemoveFile={newCommentDropzone.removeSelectedFile}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={posting || isEmptyRichText(newMessage)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {posting ? "Posting..." : "Add Comment"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={deleteCommentConfirm.open}
        type="delete"
        title="Delete Comment"
        message="This comment and its attachments will be permanently removed."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteComment}
        onCancel={() => setDeleteCommentConfirm({ open: false, comment: null })}
      />

      <ConfirmDialog
        open={deleteAttachmentConfirm.open}
        type="delete"
        title="Delete Attachment"
        message="This attachment will be permanently removed."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteAttachment}
        onCancel={() =>
          setDeleteAttachmentConfirm({ open: false, comment: null, file: null })
        }
      />
    </div>
  );
};

export default CommentsSection;
