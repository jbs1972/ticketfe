import TableSkeleton from "./TableSkeleton";

// Generic table shell - pass column definitions per page for full customization
const Table = ({
  columns,
  data,
  loading,
  rowKey = "_id",
  maxHeight = "500px",
  emptyMessage = "No data found",
  skeletonRows = 6,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 ${
                    col.headerClassName || "text-left"
                  } ${col.width || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={skeletonRows} columns={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row[rowKey]}
                  className="transition-colors hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border border-gray-200 px-3 py-2 text-gray-700 ${
                        col.cellClassName || ""
                      }`}
                    >
                      {col.render ? col.render(row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;