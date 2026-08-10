import { useEffect, useState } from "react";
import axios from "axios";

const API_ROOT = "http://localhost:3001";

// Gates the whole app behind a single backend health check: spinner while checking,
// then a calm fallback message with a manual retry button (never a raw error).
const BackendGate = ({ children }) => {
  const [status, setStatus] = useState("checking");

  const checkHealth = async () => {
    setStatus("checking");
    try {
      await axios.get(API_ROOT, { timeout: 5000 });
      setStatus("ready");
    } catch {
      setStatus("failed");
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (status === "ready") return children;

  if (status === "failed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">
          We're having trouble connecting
        </h2>
        <p className="max-w-sm text-sm text-gray-500">
          Our servers are taking longer than usual to respond. Please check your
          connection and try again.
        </p>
        <button
          onClick={checkHealth}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
};

export default BackendGate;
