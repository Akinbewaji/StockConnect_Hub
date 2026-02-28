import React from "react";

export const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48 mb-6" />
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
    <Skeleton className="h-64 w-full" />
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
);
