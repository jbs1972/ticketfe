const CardSkeleton = () => (
  <div className="animate-pulse space-y-6 rounded-lg border bg-white p-5 shadow">
    <div className="space-y-2">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="h-10 w-full rounded bg-slate-200" />
    </div>

    <div className="space-y-2">
      <div className="h-3 w-24 rounded bg-slate-200" />
      <div className="h-32 w-full rounded bg-slate-200" />
    </div>
  </div>
);

export default CardSkeleton;
