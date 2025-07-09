import { cn } from "@marketplace-watcher/ui/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const LoadingSkeleton = ({ 
  className, 
  lines = 3, 
  showAvatar = false,
  showImage = false 
}: LoadingSkeletonProps) => {
  return (
    <div className={cn("animate-fade-in", className)}>
      {showImage && (
        <div className="w-full h-48 bg-muted rounded-lg mb-4 skeleton" />
      )}
      
      {showAvatar && (
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-muted rounded-full skeleton" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-1/4 mb-2 skeleton" />
            <div className="h-3 bg-muted rounded w-1/3 skeleton" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded skeleton"
            style={{
              width: `${Math.random() * 40 + 60}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("bg-card rounded-lg p-6 shadow-sm animate-fade-in", className)}>
      <LoadingSkeleton lines={3} showAvatar />
    </div>
  );
};

export const GridSkeleton = ({ 
  count = 6, 
  columns = 3 
}: { 
  count?: number; 
  columns?: number;
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
};