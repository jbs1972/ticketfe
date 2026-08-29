import { useEffect, useState } from "react";
import axios from "axios";
import { TriangleAlert } from "lucide-react";

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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <TriangleAlert className="h-7 w-7 text-red-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            We're having trouble connecting
          </h2>
          <p className="mx-auto max-w-sm text-sm text-gray-500">
            Our servers are taking longer than usual to respond. Please check
            your connection and try again.
          </p>
        </div>
        <button
          onClick={checkHealth}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
};

export default BackendGate;
