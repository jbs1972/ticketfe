import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

const MENTION_STYLE =
  "color:#1d4ed8;font-weight:600;background:#eff6ff;padding:0 2px;border-radius:3px;";

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  mentionUsers = [],
}) => {
  const editorRef = useRef(null);
  const wrapperRef = useRef(null);
  const isInternalChange = useRef(false);
  const mentionRangeRef = useRef(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [mentionState, setMentionState] = useState(null); // { query, top, left }
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const updateActiveStates = () => {
    setActiveStates({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const closeMentionDropdown = () => {
    mentionRangeRef.current = null;
    setMentionState(null);
    setActiveIndex(0);
  };

  const detectMention = () => {
    if (!mentionUsers.length) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return closeMentionDropdown();
    const range = selection.getRangeAt(0);
    if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) {
      return closeMentionDropdown();
    }
    const node = range.startContainer;
    const textBeforeCaret = node.textContent.slice(0, range.startOffset);
    const match = textBeforeCaret.match(/@([A-Za-z0-9_]*)$/);
    if (!match) return closeMentionDropdown();
    const charBeforeAt = textBeforeCaret[match.index - 1];
    if (match.index > 0 && charBeforeAt && !/\s/.test(charBeforeAt)) {
      return closeMentionDropdown();
    }
    const mentionRange = document.createRange();
    mentionRange.setStart(node, match.index);
    mentionRange.setEnd(node, range.startOffset);
    mentionRangeRef.current = mentionRange;
    const rect = mentionRange.getBoundingClientRect();
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    setMentionState({
      query: match[1],
      top: wrapperRect ? rect.bottom - wrapperRect.top + 4 : 0,
      left: wrapperRect ? rect.left - wrapperRect.left : 0,
    });
    setActiveIndex(0);
  };

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
    updateActiveStates();
    detectMention();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    editorRef.current.focus();
    document.execCommand("insertText", false, text);
    handleInput();
  };

  const applyFormat = (command) => {
    editorRef.current.focus();
    document.execCommand(command);
    handleInput();
  };

  const filteredUsers = mentionState
    ? mentionUsers
        .filter((u) =>
          u.name?.toLowerCase().includes(mentionState.query.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const selectMention = (user) => {
    const range = mentionRangeRef.current;
    if (!range) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    range.deleteContents();
    const mentionNode = document.createElement("span");
    mentionNode.setAttribute("style", MENTION_STYLE);
    mentionNode.setAttribute("contenteditable", "false");
    mentionNode.setAttribute("data-user-id", user._id);
    mentionNode.textContent = `@${user.name}`;
    range.insertNode(mentionNode);
    const spaceNode = document.createTextNode("\u00A0");
    mentionNode.after(spaceNode);
    const newRange = document.createRange();
    newRange.setStartAfter(spaceNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    editorRef.current.focus();
    closeMentionDropdown();
    handleInput();
  };

  const handleKeyDown = (e) => {
    if (!mentionState || filteredUsers.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectMention(filteredUsers[activeIndex]);
    } else if (e.key === "Escape") {
      closeMentionDropdown();
    }
  };

  const toolbarButtonClass = (isActive) =>
    `rounded-md p-1.5 transition-colors duration-150 ${
      isActive
        ? "bg-blue-100 text-blue-700"
        : "text-gray-600 hover:bg-gray-200 hover:text-gray-800"
    }`;

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-lg border border-gray-300 bg-white transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
    >
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          className={toolbarButtonClass(activeStates.bold)}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          className={toolbarButtonClass(activeStates.italic)}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("insertUnorderedList")}
          className={toolbarButtonClass(activeStates.insertUnorderedList)}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("insertOrderedList")}
          className={toolbarButtonClass(activeStates.insertOrderedList)}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        onFocus={updateActiveStates}
        onBlur={() => setTimeout(closeMentionDropdown, 150)}
        onPaste={handlePaste}
        onDrop={(e) => e.preventDefault()}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.5}rem`, maxHeight: `${rows * 3}rem` }}
        className="rich-text-editor w-full overflow-y-auto px-3 py-2 text-sm text-gray-800 outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
      {mentionState && filteredUsers.length > 0 && (
        <ul
          className="absolute z-10 w-48 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg"
          style={{ top: mentionState.top, left: mentionState.left }}
        >
          {filteredUsers.map((user, index) => (
            <li key={user._id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectMention(user);
                }}
                className={`w-full px-3 py-1.5 text-left ${
                  index === activeIndex
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RichTextEditor;
