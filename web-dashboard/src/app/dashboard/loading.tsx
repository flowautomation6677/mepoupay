export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Bento Grid Skeleton */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="h-[400px] w-full bg-gray-100 rounded-3xl animate-pulse border border-gray-200" />

            {/* Feed & Widget Skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2 h-[400px] bg-gray-100 rounded-3xl animate-pulse" />
                <div className="md:col-span-1 h-[300px] bg-gray-100 rounded-3xl animate-pulse" />
            </div>
        </div>
    )
}
