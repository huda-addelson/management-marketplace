import { QueryLoadingState } from "@/components/common/query-state";

export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-[1540px] px-4 py-10 sm:px-6 lg:px-8">
      <QueryLoadingState />
    </div>
  );
}
