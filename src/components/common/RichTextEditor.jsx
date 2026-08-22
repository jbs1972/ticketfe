import { useEffect, useRef, useState } from "react";
import { FaBold, FaItalic, FaListUl, FaListOl } from "react-icons/fa";

const RichTextEditor = ({ value, onChange, placeholder, rows = 3 }) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

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

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
    updateActiveStates();
  };

  const applyFormat = (command) => {
    editorRef.current.focus();
    document.execCommand(command);
    handleInput();
  };

  const toolbarButtonClass = (isActive) =>
    `rounded p-1 ${
      isActive
        ? "bg-blue-100 text-blue-700"
        : "text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 border-b bg-slate-50 px-2 py-1">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          className={toolbarButtonClass(activeStates.bold)}
          title="Bold"
        >
          <FaBold size={11} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          className={toolbarButtonClass(activeStates.italic)}
          title="Italic"
        >
          <FaItalic size={11} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("insertUnorderedList")}
          className={toolbarButtonClass(activeStates.insertUnorderedList)}
          title="Bullet List"
        >
          <FaListUl size={11} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("insertOrderedList")}
          className={toolbarButtonClass(activeStates.insertOrderedList)}
          title="Numbered List"
        >
          <FaListOl size={11} />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        onFocus={updateActiveStates}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.5}rem` }}
        className="rich-text-editor w-full px-3 py-2 text-sm outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
};

export default RichTextEditor;
