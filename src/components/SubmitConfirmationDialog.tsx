import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Flag, AlertTriangle } from "lucide-react";

interface SubmitConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  timeSpent: string;
}

export const SubmitConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  totalQuestions,
  answeredCount,
  flaggedCount,
  timeSpent
}: SubmitConfirmationDialogProps) => {
  const unansweredCount = totalQuestions - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasUnanswered ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                Submit Practice?
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                Submit Practice
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {hasUnanswered 
                  ? "You're about to submit your practice session with some unanswered questions."
                  : "You're about to submit your completed practice session."
                }
              </p>
              
              {/* Summary Stats */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Answered
                  </span>
                  <Badge variant="secondary">{answeredCount} / {totalQuestions}</Badge>
                </div>
                
                {unansweredCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Unanswered
                    </span>
                    <Badge variant="destructive">{unansweredCount}</Badge>
                  </div>
                )}
                
                {flaggedCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Flag className="h-4 w-4 text-warning" />
                      Flagged
                    </span>
                    <Badge variant="outline">{flaggedCount}</Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Time Spent</span>
                  <span className="font-mono text-sm">{timeSpent}</span>
                </div>
              </div>
              
              {hasUnanswered && (
                <p className="text-sm text-muted-foreground">
                  You can go back to review and answer the remaining questions, or submit now to see your results.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Review Questions</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={hasUnanswered ? "bg-warning text-warning-foreground hover:bg-warning/90" : ""}
          >
            {hasUnanswered ? "Submit Anyway" : "Submit Practice"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};