import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";

export function QuestionNavigator() {
  const { state, dispatch } = useApp();
  const session = state.practiceSession;

  if (!session) return null;

  const getQuestionStatus = (questionIndex: number) => {
    const questionId = session.questions[questionIndex]?.id;
    const answer = session.userAnswers[questionId];
    
    if (questionIndex === session.currentQuestion) return 'current';
    if (answer?.isFlagged) return 'flagged';
    if (answer?.selectedAnswer) return 'answered';
    return 'unanswered';
  };

  const getQuestionClassName = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-primary text-primary-foreground border-primary';
      case 'answered':
        return 'bg-success/10 text-success border-success/30 hover:bg-success/20';
      case 'flagged':
        return 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20';
      case 'unanswered':
        return 'bg-muted/30 text-muted-foreground border-muted hover:bg-muted/50';
      default:
        return '';
    }
  };

  const handleQuestionClick = (questionIndex: number) => {
    dispatch({ type: 'GO_TO_QUESTION', payload: questionIndex });
  };

  const answeredCount = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.selectedAnswer
  ).length;
  
  const flaggedCount = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.isFlagged
  ).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Question Navigator</CardTitle>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span>Progress:</span>
            <span className="font-medium">{answeredCount}/{session.questions.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Flagged:</span>
            <span className="font-medium">{flaggedCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {session.questions.map((_, index) => {
            const status = getQuestionStatus(index);
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 text-xs ${getQuestionClassName(status)}`}
                onClick={() => handleQuestionClick(index)}
              >
                {index + 1}
              </Button>
            );
          })}
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Legend:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success/30"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-warning/30"></div>
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted/30"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}