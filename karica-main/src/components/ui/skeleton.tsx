import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
  "rounded-md bg-muted relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "animate-pulse",
        shimmer: "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/10 before:to-transparent",
      },
      size: {
        default: "",
        sm: "h-4",
        md: "h-8",
        lg: "h-12",
        xl: "h-20",
        avatar: "h-10 w-10 rounded-full",
        "avatar-lg": "h-16 w-16 rounded-full",
        card: "h-32 w-full",
        text: "h-4 w-3/4",
        title: "h-6 w-1/2",
        button: "h-10 w-24",
      },
    },
    defaultVariants: {
      variant: "shimmer",
      size: "default",
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, size, ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(skeletonVariants({ variant, size }), className)} 
      {...props} 
    />
  );
}

// Compound components for common patterns
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3 p-4 rounded-lg border bg-card", className)} {...props}>
      <Skeleton size="lg" className="w-full" />
      <Skeleton size="text" />
      <Skeleton size="text" className="w-1/2" />
    </div>
  );
}

function SkeletonList({ count = 3, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { count?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton size="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton size="text" />
            <Skeleton size="sm" className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Skeleton size="title" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonChart, skeletonVariants };
