import { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Pen,
  Trash2,
  AtSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toastError, toastSuccess } from "../../utilities/toast";
import {
  getErrorMessage,
  isEmptyRichText,
  isRichTextHtml,
  formatDateTime,
  extractMentionedUserIds,
} from "../../utilities/ticketHelpers";
import { getMentionableUsers } from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";
import socket from "../../services/socket";
import useAuth from "../../hooks/useAuth";
import useFileDropzone from "../../hooks/useFileDropzone";
import FileDropzone from "../common/FileDropzone";
import ConfirmDialog from "../common/ConfirmDialog";
import RichTextEditor from "../common/RichTextEditor";
import Button from "../common/Button";
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
  const [highlightedId, setHighlightedId] = useState(null);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [myTagIndex, setMyTagIndex] = useState(-1);
  const [scrollButtonDirection, setScrollButtonDirection] = useState(null);
  const hashProcessedRef = useRef(false);
  const scrollContainerRef = useRef(null);
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

  // Comments (in this ticket) that mention the logged-in user, in display order
  const myTaggedComments = comments.filter((c) =>
    c.mentions?.some((id) => String(id) === String(user?._id)),
  );

  // Users eligible for @mention: everyone except the logged-in user (no self-tagging)
  const mentionCandidates = mentionUsers.filter(
    (u) => String(u._id) !== String(user?._id),
  );

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
    hashProcessedRef.current = false;
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

  useEffect(() => {
    getMentionableUsers(getToken())
      .then((response) => setMentionUsers(response.data || []))
      .catch(() => setMentionUsers([]));
  }, []);

  // Runs ONCE per ticket load to scroll/highlight a comment linked via #comment-<id>.
  useEffect(() => {
    if (loading || hashProcessedRef.current) return;
    const hash = window.location.hash;
    if (!hash?.startsWith("#comment-")) {
      hashProcessedRef.current = true;
      return;
    }
    const targetId = hash.replace("#comment-", "");
    const el = document.getElementById(`comment-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(targetId);
      hashProcessedRef.current = true;
      const timeout = setTimeout(() => setHighlightedId(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading, comments]);

  const jumpToComment = (commentId) => {
    const el = document.getElementById(`comment-${commentId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(commentId);
    setTimeout(() => setHighlightedId(null), 3000);
  };

  const handleCycleMyTags = () => {
    if (!myTaggedComments.length) return;
    const nextIndex = (myTagIndex + 1) % myTaggedComments.length;
    setMyTagIndex(nextIndex);
    jumpToComment(myTaggedComments[nextIndex]._id);
  };

  // Decides which way the jump button points
  const updateScrollButtonDirection = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      setScrollButtonDirection(null); // nothing to scroll
      return;
    }
    const midpoint = (scrollHeight - clientHeight) / 2;
    setScrollButtonDirection(scrollTop <= midpoint ? "down" : "up");
  };

  useEffect(() => {
    // Deferred one tick so the comment list has painted and scrollHeight is accurate.
    const id = requestAnimationFrame(updateScrollButtonDirection);
    return () => cancelAnimationFrame(id);
  }, [comments, searchResults, loading]);

  const handleScrollButtonClick = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (scrollButtonDirection === "down") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePostComment = async (event) => {
    event.preventDefault();
    if (isEmptyRichText(newMessage)) return;
    try {
      setPosting(true);
      await addComment(
        ticketCode,
        newMessage,
        newCommentDropzone.selectedFiles,
        extractMentionedUserIds(newMessage),
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
        extractMentionedUserIds(editMessage),
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
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        Comments
      </label>
      <SearchBar
        className="mb-2"
        placeholder="Search comments by message, date, attachment or author..."
        onSearch={handleSearchComments}
      />
      <div className="mb-1.5 flex items-center gap-2">
        {myTaggedComments.length > 0 && (
          <button
            type="button"
            onClick={handleCycleMyTags}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
            title="Cycle through comments where you were tagged"
          >
            <AtSign size={11} />
            My tags ({myTaggedComments.length})
          </button>
        )}
        {scrollButtonDirection && (
          <button
            type="button"
            onClick={handleScrollButtonClick}
            className="ml-auto flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            title={
              scrollButtonDirection === "down"
                ? "Jump to newest comment"
                : "Jump to oldest comment"
            }
          >
            {scrollButtonDirection === "down" ? (
              <ArrowDown size={11} />
            ) : (
              <ArrowUp size={11} />
            )}
          </button>
        )}
      </div>
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtonDirection}
        className="mb-2 max-h-72 flex-1 space-y-1.5 overflow-y-auto"
      >
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
              id={`comment-${comment._id}`}
              className={`rounded-lg border border-gray-200 bg-gray-50 p-2.5 transition-colors ${
                highlightedId === comment._id
                  ? "bg-amber-50 ring-2 ring-amber-400"
                  : ""
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                {editingId !== comment._id &&
                  comment.authorId === user?._id && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="rounded p-0.5 text-blue-600 transition-colors hover:text-blue-700"
                        title="Edit comment"
                      >
                        <Pen size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteComment(comment)}
                        disabled={deletingId === comment._id}
                        className="rounded p-0.5 text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                        title="Delete comment"
                      >
                        <Trash2 size={12} />
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
                    mentionUsers={mentionCandidates}
                    rows={3}
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
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingEdit ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : isRichTextHtml(comment.message) ? (
                <div
                  className="break-words text-sm text-gray-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: comment.message }}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
                  {comment.message}
                </p>
              )}
              {comment.attachments?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {comment.attachments.map((file) => (
                    <div
                      key={file.fileName}
                      className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadCommentFile(comment._id, file)
                        }
                        className="flex max-w-[180px] items-center gap-1 transition-colors hover:text-gray-900"
                      >
                        <Paperclip size={10} className="shrink-0" />
                        <span className="truncate">{file.originalName}</span>
                      </button>
                      {comment.authorId === user?._id && (
                        <button
                          type="button"
                          onClick={() => requestDeleteAttachment(comment, file)}
                          disabled={
                            deletingAttachment ===
                            `${comment._id}-${file.fileName}`
                          }
                          className="ml-1 text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
                          title="Delete attachment"
                        >
                          <Trash2 size={9} />
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
      <form
        onSubmit={handlePostComment}
        className="space-y-2 border-t border-gray-200 pt-2.5"
      >
        <RichTextEditor
          value={newMessage}
          onChange={setNewMessage}
          placeholder="Add a comment..."
          mentionUsers={mentionCandidates}
          rows={2}
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
          <Button
            type="submit"
            disabled={isEmptyRichText(newMessage)}
            loading={posting}
            loadingText="Posting..."
          >
            Add Comment
          </Button>
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
