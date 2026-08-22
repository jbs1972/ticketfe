import { useRef, useState } from "react";

const useFileDropzone = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = (newFiles) => {
    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));

      const uniqueNewFiles = newFiles.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}`),
      );

      return [...prev, ...uniqueNewFiles];
    });
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const resetFiles = () => setSelectedFiles([]);

  return {
    selectedFiles,
    isDragging,
    fileInputRef,
    handleFileChange,
    removeSelectedFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resetFiles,
  };
};

export default useFileDropzone;
