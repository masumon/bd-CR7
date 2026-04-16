import { ContentSkeleton, StatCardSkeleton } from "@/components/ui/ConsistencySystem";

export default function DashboardRouteLoading() {
  return (
    <div className="min-h-full overflow-x-hidden bg-background p-3 pb-6 space-y-4">
      <div className="erp-card p-4 space-y-3">
        <div className="skeleton h-6 w-44 rounded-md" />
        <div className="skeleton h-4 w-28 rounded-md" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="erp-card p-4">
          <StatCardSkeleton count={3} />
        </div>
        <div className="erp-card p-4">
          <ContentSkeleton rows={4} withIcon={false} withValue />
        </div>
      </div>

      <div className="erp-card p-4">
        <ContentSkeleton rows={6} asGrid />
      </div>
    </div>
  );
}