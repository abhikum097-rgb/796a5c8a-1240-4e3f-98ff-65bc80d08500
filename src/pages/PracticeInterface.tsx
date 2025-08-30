import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Play, 
  Pause,
  Square,
  AlertTriangle
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuestionNavigator } from "@/components/QuestionNavigator";
import { SessionControls } from "@/components/SessionControls";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { generateMockQuestions } from "@/mock/data";
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

const PracticeInterface = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { fetchQuestions, loading: questionsLoading } = useSupabaseQuestions();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const session = state.practiceSession;

  // Initialize session if not exists
  useEffect(() => {
    const initializeSession = async () => {
      if (!session && sessionId) {
        setIsInitializing(true);
        
        try {
          // Try to fetch real questions from Supabase
          const questions = await fetchQuestions({
            testType: 'SHSAT',
            count: 20
          });
          
          let finalQuestions = questions;
          
          // If no questions found, use mock data as fallback
          if (!questions || questions.length === 0) {
            console.warn('No questions found in database, using mock data');
            finalQuestions = generateMockQuestions(20, {});
          } else if (questions.length < 20) {
            console.warn(`Only ${questions.length} questions found, supplementing with mock data`);
            const mockQuestions = generateMockQuestions(20 - questions.length, {});
            finalQuestions = [...questions, ...mockQuestions];
          }

          dispatch({
            type: 'START_SESSION',
            payload: {
              testType: 'SHSAT',
              sessionType: 'topic_practice',
              subject: 'Math',
              topic: 'General Practice',
              questions: finalQuestions
            }
          });
        } catch (error) {
          console.error('Error initializing session:', error);
          // Fallback to mock questions
          const mockQuestions = generateMockQuestions(20, {});
          dispatch({
            type: 'START_SESSION',
            payload: {
              testType: 'SHSAT',
              sessionType: 'topic_practice',
              subject: 'Math',
              topic: 'General Practice',
              questions: mockQuestions
            }
          });
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [session, sessionId, dispatch, fetchQuestions]);

  // Show pause overlay when session is paused
  useEffect(() => {
    setShowPauseOverlay(session?.isPaused || false);
  }, [session?.isPaused]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!session || session.isPaused) return;
      
      switch (e.key.toLowerCase()) {
        case 'arrowleft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'arrowright':
          e.preventDefault();
          handleNext();
          break;
        case 'a':
        case 'b':
        case 'c':
        case 'd':
          if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            handleAnswerSelect(e.key.toUpperCase() as 'A' | 'B' | 'C' | 'D');
          }
          break;
        case 'f':
          e.preventDefault();
          handleFlag();
          break;
        case ' ':
          if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            handlePauseResume();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [session]);

  if (isInitializing || questionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Practice Session...</h2>
          <Progress value={50} className="w-64" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <Button onClick={() => navigate('/practice')}>
            Return to Practice
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestion];
  const currentAnswer = session.userAnswers[currentQuestion?.id];

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: {
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          selectedAnswer: answer,
          timeSpent: 0,
          isFlagged: currentAnswer?.isFlagged || false
        }
      }
    });
  };

  const handlePrevious = () => {
    if (session.currentQuestion > 0) {
      dispatch({ type: 'GO_TO_QUESTION', payload: session.currentQuestion - 1 });
    }
  };

  const handleNext = () => {
    if (session.currentQuestion < session.questions.length - 1) {
      dispatch({ type: 'GO_TO_QUESTION', payload: session.currentQuestion + 1 });
    }
  };

  const handleFlag = () => {
    if (currentQuestion) {
      dispatch({ type: 'TOGGLE_FLAG', payload: currentQuestion.id });
    }
  };

  const handlePauseResume = () => {
    if (session.isPaused) {
      dispatch({ type: 'RESUME_SESSION' });
    } else {
      dispatch({ type: 'PAUSE_SESSION' });
    }
  };

  const handleFinishPractice = async () => {
    if (!session) return;
    
    // Complete the session in state
    dispatch({ type: 'COMPLETE_SESSION' });
    
    // Save session to database if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        // Save practice session
        const { data: savedSession, error: sessionError } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            test_type: session.testType,
            session_type: session.sessionType,
            subject: session.subject || null,
            topic: session.topic || null,
            difficulty: session.difficulty || null,
            total_questions: session.questions.length,
            status: 'completed',
            end_time: new Date().toISOString(),
            total_time_spent: session.sessionTime
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error saving session:', sessionError);
          throw sessionError;
        }

        // Save user answers
        const answersToSave = Object.entries(session.userAnswers)
          .filter(([_, answer]) => answer.selectedAnswer)
          .map(([questionId, answer]) => {
            const question = session.questions.find(q => q.id === questionId);
            const isCorrect = question ? answer.selectedAnswer === question.correctAnswer : false;
            
            return {
              session_id: savedSession.id,
              question_id: questionId,
              user_answer: answer.selectedAnswer,
              is_correct: isCorrect,
              is_flagged: answer.isFlagged || false,
              time_spent: answer.timeSpent || 0
            };
          });

        if (answersToSave.length > 0) {
          const { error: answersError } = await supabase
            .from('user_answers')
            .insert(answersToSave);

          if (answersError) {
            console.error('Error saving answers:', answersError);
          }
        }

        // Call complete-session function to update analytics
        try {
          await supabase.functions.invoke('complete-session', {
            body: {
              sessionId: savedSession.id,
              totalTimeSpent: session.sessionTime
            }
          });
        } catch (functionError) {
          console.error('Error calling complete-session function:', functionError);
        }

        toast({
          title: "Practice Completed!",
          description: "Your results have been saved.",
        });

        // Navigate to results page
        navigate(`/results/${savedSession.id}`);
      } catch (error) {
        console.error('Error completing session:', error);
        toast({
          title: "Save Error",
          description: "Your practice was completed but results couldn't be saved.",
          variant: "destructive"
        });
        
        // Still navigate to results even if save failed
        navigate(`/results/${session.id}`);
      }
    } else {
      // Not authenticated, just go to results
      navigate(`/results/${session.id}`);
    }
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    navigate('/practice');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            Question {session.currentQuestion + 1} of {session.questions.length}
          </h1>
          {currentQuestion && (
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-mono">
            {formatTime(session.sessionTime)}
          </div>
          <Button variant="outline" size="sm" onClick={handleExit}>
            Exit Practice
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Question Panel (70%) */}
        <div className="lg:flex-[7] flex flex-col p-6 overflow-y-auto lg:border-r">
          {currentQuestion && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Fixed Height Question Container */}
              <div className="h-[480px] overflow-y-auto">
                <div className="space-y-6 pr-2">
                  {/* Question Text */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {currentQuestion.subject} • {currentQuestion.topic}
                          </Badge>
                          <Button
                            variant={currentAnswer?.isFlagged ? "default" : "outline"}
                            size="sm"
                            onClick={handleFlag}
                          >
                            <Flag className={`h-4 w-4 mr-2 ${currentAnswer?.isFlagged ? 'fill-current' : ''}`} />
                            {currentAnswer?.isFlagged ? 'Flagged' : 'Flag'}
                          </Button>
                        </div>
                        
                        <div className="text-lg leading-relaxed">
                          {currentQuestion.questionText}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {Object.entries(currentQuestion.options).map(([option, text]) => (
                      <Button
                        key={option}
                        variant={currentAnswer?.selectedAnswer === option ? "default" : "outline"}
                        className="w-full justify-start text-left p-4 h-auto min-h-[3rem]"
                        onClick={() => handleAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
                      >
                        <span className="font-bold mr-3 min-w-[1.5rem]">{option}.</span>
                        <span className="flex-1">{text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Navigation Bar */}
              <div className="sticky bottom-0 bg-card border-t border-border -mx-6 -mb-6 p-6 mt-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Previous Button - Left */}
                  <div className="flex justify-start">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      disabled={session.currentQuestion === 0}
                      className="flex items-center space-x-2 px-6 py-3 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </Button>
                  </div>
                  
                  {/* Center - Question Counter */}
                  <div className="flex justify-center items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {session.currentQuestion + 1} / {session.questions.length}
                    </span>
                  </div>
                  
                  {/* Next/Submit Button - Right */}
                  <div className="flex justify-end">
                    {session.currentQuestion === session.questions.length - 1 ? (
                      <Button 
                        onClick={handleFinishPractice} 
                        className="flex items-center space-x-2 px-6 py-3 min-w-[120px] bg-success text-success-foreground hover:bg-success/90"
                      >
                        <span>Submit</span>
                        <Square className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="flex items-center space-x-2 px-6 py-3 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Panel (30%) */}
        <div className="lg:flex-[3] border-l bg-muted/30 p-4 space-y-4 overflow-y-auto">
          <QuestionNavigator />
          <SessionControls />
        </div>
      </div>

      {/* Pause Overlay */}
      {showPauseOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader className="text-center">
              <Pause className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Practice Paused</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your session is paused. Click Resume to continue or Exit to quit.
              </p>
              <div className="flex gap-2">
                <Button onClick={handlePauseResume} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button variant="outline" onClick={handleExit} className="flex-1">
                  Exit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Exit Practice Session?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved, but you'll need to start over if you want to complete this practice session. Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Practice</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit} className="bg-destructive hover:bg-destructive/90">
              Exit Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PracticeInterface;
