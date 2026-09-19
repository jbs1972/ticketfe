import { useState } from "react";
import { Search, X } from "lucide-react";

const fieldClass =
  "rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200";

const SearchBar = ({
  onSearch,
  placeholder = "Search...",
  showStatus = false,
  statusOptions = [],
  className = "mb-3",
}) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const triggerSearch = () => {
    onSearch({ q: query.trim(), status, from, to });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    setStatus("");
    setFrom("");
    setTo("");
    onSearch({ q: "", status: "", from: "", to: "" });
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 rounded-md border border-gray-200 bg-white p-2 shadow-sm ${className}`}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${fieldClass} min-w-[180px] flex-1`}
      />

      {showStatus && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={fieldClass}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className={fieldClass}
      />

      <span className="px-0.5 text-xs text-gray-400">to</span>

      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className={fieldClass}
      />

      <button
        type="button"
        onClick={triggerSearch}
        className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
      >
        <Search size={12} />
        Search
      </button>

      <button
        type="button"
        onClick={handleClear}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
      >
        <X size={12} />
        Clear
      </button>
    </div>
  );
};

export default SearchBar;
