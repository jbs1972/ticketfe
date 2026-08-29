const CardSkeleton = () => (
  <div className="animate-pulse space-y-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="space-y-2">
      <div className="h-3 w-20 rounded bg-gray-200" />
      <div className="h-10 w-full rounded bg-gray-200" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-24 rounded bg-gray-200" />
      <div className="h-32 w-full rounded bg-gray-200" />
    </div>
  </div>
);

export default CardSkeleton;
