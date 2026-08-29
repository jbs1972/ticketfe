const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const buttonClass =
    "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100";

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={buttonClass}
        >
          Previous
        </button>
        <span className="text-sm font-medium text-gray-900">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={buttonClass}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
