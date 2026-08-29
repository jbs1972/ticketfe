import { X } from "lucide-react";

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
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-4 text-center text-xs transition-colors duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 text-gray-500 hover:border-gray-400"
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
        <div className="mt-2 max-h-24 overflow-y-auto rounded-lg border border-gray-200">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between border-b border-gray-100 px-2.5 py-1.5 text-xs last:border-b-0"
            >
              <span className="truncate text-gray-700">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="ml-2 text-red-600 transition-colors hover:text-red-700"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
