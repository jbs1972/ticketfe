import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const SearchBar = ({
  onSearch,
  placeholder = "Search...",
  showStatus = false,
  statusOptions = [],
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
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border bg-white p-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-w-[200px] flex-1 rounded-md border px-3 py-2 text-sm"
      />

      {showStatus && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
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
        className="rounded-md border px-3 py-2 text-sm"
      />

      <span className="text-sm text-gray-500">to</span>

      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm"
      />

      <button
        type="button"
        onClick={triggerSearch}
        className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        <FaSearch size={12} />
        Search
      </button>

      <button
        type="button"
        onClick={handleClear}
        className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
      >
        <FaTimes size={12} />
        Clear
      </button>
    </div>
  );
};

export default SearchBar;
