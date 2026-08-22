import React from "react";
import { FaTimes } from "react-icons/fa";

const FileDropzone = ({
  label,
  selectedFiles,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
  onRemoveFile,
}) => {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`cursor-pointer rounded-md border-2 border-dashed px-3 py-6 text-center text-sm ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={onFileInputChange}
          className="hidden"
        />
        Drag & drop files here, or click to browse
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-2 max-h-32 overflow-y-auto rounded-md border">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between border-b px-3 py-1 text-xs last:border-b-0"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
