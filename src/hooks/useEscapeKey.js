import { useEffect } from "react";

const useEscapeKey = (isActive, onClose) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onClose]);
};

export default useEscapeKey;
