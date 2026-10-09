export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="size-10 animate-spin rounded-full border-3 border-line border-t-brand" />
        <p className="text-xs font-semibold tracking-wide text-subtle uppercase">Loading</p>
      </div>
    </div>
  );
}
