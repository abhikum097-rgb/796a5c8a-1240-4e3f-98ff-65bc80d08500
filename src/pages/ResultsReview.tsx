import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Flag,
  ArrowLeft,
  Filter,
  BookOpen
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DifficultyBadge } from "@/components/DifficultyBadge";

const ResultsReview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useApp();
  
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  
  const session = state.practiceSession;

  if (!session || !session.isCompleted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session not found</h2>
          <Button onClick={() => navigate('/practice')}>
            Back to Practice
          </Button>
        </div>
      </div>
    );
  }

  // Filter questions based on selected filter
  const getFilteredQuestions = () => {
    switch (filter) {
      case 'wrong':
        return session.questions.filter(q => {
          const answer = session.userAnswers[q.id];
          return answer?.selectedAnswer && answer.selectedAnswer !== q.correctAnswer;
        });
      case 'flagged':
        return session.questions.filter(q => session.userAnswers[q.id]?.isFlagged);
      case 'unanswered':
        return session.questions.filter(q => !session.userAnswers[q.id]?.selectedAnswer);
      default:
        return session.questions;
    }
  };

  const filteredQuestions = getFilteredQuestions();
  const currentQuestion = filteredQuestions[currentReviewIndex];
  const currentAnswer = currentQuestion ? session.userAnswers[currentQuestion.id] : null;

  const getAnswerStatus = (question: typeof currentQuestion) => {
    if (!question) return 'unanswered';
    const answer = session.userAnswers[question.id];
    if (!answer?.selectedAnswer) return 'unanswered';
    return answer.selectedAnswer === question.correctAnswer ? 'correct' : 'incorrect';
  };

  const handlePrevious = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentReviewIndex < filteredQuestions.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentReviewIndex(0);
  };

  if (filteredQuestions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Question Review</h1>
          <Button variant="outline" onClick={() => navigate(`/results/${sessionId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No questions to review</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'wrong' && "Great job! You didn't get any questions wrong."}
              {filter === 'flagged' && "You didn't flag any questions for review."}
              {filter === 'unanswered' && "You answered all questions in this session."}
            </p>
            <Button onClick={() => handleFilterChange('all')}>
              Review All Questions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answerStatus = getAnswerStatus(currentQuestion);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Question Review</h1>
          <p className="text-muted-foreground">
            Question {currentReviewIndex + 1} of {filteredQuestions.length} ({filter} questions)
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/results/${sessionId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={handleFilterChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Questions</TabsTrigger>
          <TabsTrigger value="wrong">Wrong Only</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
        </TabsList>
      </Tabs>

      {currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">
                      Question {session.questions.indexOf(currentQuestion) + 1}
                    </CardTitle>
                    {answerStatus === 'correct' && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    {answerStatus === 'incorrect' && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    {currentAnswer?.isFlagged && (
                      <Flag className="h-4 w-4 text-warning fill-current" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {currentQuestion.subject} • {currentQuestion.topic}
                    </Badge>
                    <DifficultyBadge difficulty={currentQuestion.difficulty} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg leading-relaxed">
                  {currentQuestion.questionText}
                </div>
              </CardContent>
            </Card>

            {/* Answer Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Answer Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(currentQuestion.options).map(([option, text]) => {
                    const isUserAnswer = currentAnswer?.selectedAnswer === option;
                    const isCorrectAnswer = currentQuestion.correctAnswer === option;
                    
                    let className = "w-full justify-start text-left p-4 h-auto min-h-[3rem] ";
                    
                    if (isCorrectAnswer) {
                      className += "border-success bg-success/10 text-success";
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      className += "border-destructive bg-destructive/10 text-destructive";
                    } else {
                      className += "border-border bg-background";
                    }

                    return (
                      <div key={option} className={`border rounded-lg ${className}`}>
                        <div className="flex items-start space-x-3">
                          <span className="font-bold min-w-[1.5rem] flex-shrink-0">
                            {option}.
                          </span>
                          <span className="flex-1">{text}</span>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {isUserAnswer && !isCorrectAnswer && (
                              <Badge variant="destructive" className="text-xs">Your Answer</Badge>
                            )}
                            {isCorrectAnswer && (
                              <Badge variant="default" className="text-xs bg-success">Correct</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Explanation */}
            {answerStatus === 'incorrect' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Explanation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{currentQuestion.explanation}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation & Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{currentReviewIndex + 1} / {filteredQuestions.length}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentReviewIndex === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentReviewIndex === filteredQuestions.length - 1}
                    className="flex-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge 
                    variant={
                      answerStatus === 'correct' ? 'default' : 
                      answerStatus === 'incorrect' ? 'destructive' : 
                      'outline'
                    }
                    className={
                      answerStatus === 'correct' ? 'bg-success' : ''
                    }
                  >
                    {answerStatus.charAt(0).toUpperCase() + answerStatus.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Difficulty:</span>
                  <DifficultyBadge difficulty={currentQuestion.difficulty} />
                </div>
                
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <span className="font-medium">{currentQuestion.subject}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Topic:</span>
                  <span className="font-medium">{currentQuestion.topic}</span>
                </div>
                
                {currentAnswer?.isFlagged && (
                  <div className="flex justify-between">
                    <span>Flagged:</span>
                    <Flag className="h-4 w-4 text-warning fill-current" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsReview;