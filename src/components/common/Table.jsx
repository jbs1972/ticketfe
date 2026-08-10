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
    <div className="rounded-lg border bg-white shadow">
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`border px-3 py-2 ${col.headerClassName || "text-left"} ${col.width || ""}`}
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
                <td colSpan={columns.length} className="py-5 text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row[rowKey]} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border px-3 py-2 ${col.cellClassName || ""}`}
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
