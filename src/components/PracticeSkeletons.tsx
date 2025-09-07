import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const QuestionSkeleton = () => (
  <div className="space-y-6">
    {/* Passage Skeleton */}
    <Card className="border-l-4 border-l-muted">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>

    {/* Question Skeleton */}
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>

    {/* Options Skeleton */}
    <div className="space-y-3">
      {['A', 'B', 'C', 'D'].map((option) => (
        <Skeleton key={option} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

export const NavigationSkeleton = () => (
  <div className="space-y-4">
    {/* Question Navigator Skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Session Controls Skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export const PracticeLoadingSkeleton = () => (
  <div className="h-screen flex flex-col">
    {/* Header Skeleton */}
    <div className="border-b bg-card p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Question Panel */}
      <div className="lg:flex-[7] flex flex-col p-6 overflow-y-scroll">
        <div className="max-w-4xl mx-auto">
          <QuestionSkeleton />
        </div>
      </div>

      {/* Navigation Panel */}
      <div className="lg:flex-[3] border-l bg-muted/30 p-4">
        <NavigationSkeleton />
      </div>
    </div>
  </div>
);