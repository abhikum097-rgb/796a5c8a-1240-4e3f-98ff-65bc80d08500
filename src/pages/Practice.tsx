import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { generateMockQuestions } from "@/mock/data";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp,
  Play,
  ChevronRight,
  Zap,
  Brain,
  RotateCcw
} from "lucide-react";

const Practice = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { fetchQuestions, loading } = useSupabaseQuestions();
  const { toast } = useToast();

  const startSession = async (config: any) => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a practice session.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    try {
      // Fetch questions from backend
      const questions = await fetchQuestions({
        testType: state.user.selectedTest || 'SHSAT',
        subject: config.subject,
        topic: config.topic,
        difficulty: config.difficulty,
        count: config.sessionType === 'full_test' ? 89 : 20
      });

      // Handle limited question data
      const targetCount = config.sessionType === 'full_test' ? 89 : 20;
      if (questions.length === 0) {
        console.warn('No questions found from backend, using mock data');
        const mockQuestions = generateMockQuestions(targetCount, {
          subject: config.subject,
          topic: config.topic,
          difficulty: config.difficulty
        });
        questions.push(...mockQuestions);
      } else if (questions.length < targetCount) {
        console.warn(`Only ${questions.length} questions found, supplementing with mock data`);
        const mockQuestions = generateMockQuestions(
          targetCount - questions.length,
          {
            subject: config.subject,
            topic: config.topic,
            difficulty: config.difficulty
          }
        );
        questions.push(...mockQuestions);
      }

      dispatch({
        type: 'START_SESSION',
        payload: {
          testType: state.user.selectedTest || 'SHSAT',
          questions: questions,
          ...config
        }
      });
      navigate(`/dashboard/practice/session/${Date.now()}`);
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Session Start Failed",
        description: error instanceof Error ? error.message : "Unable to start practice session. Please try again.",
        variant: "destructive",
      });
      
      // Fallback to mock data only if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        dispatch({
          type: 'START_SESSION',
          payload: {
            testType: state.user.selectedTest || 'SHSAT',
            questions: generateMockQuestions(20, {}),
            ...config
          }
        });
        navigate(`/dashboard/practice/session/${Date.now()}`);
      }
    }
  };

  const FullTestsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{state.user.selectedTest || 'SHSAT'}</span>
            <Badge variant="outline">Full Test</Badge>
          </CardTitle>
          <CardDescription>Complete exam simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>2.5 hours</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>89 questions</span>
            </div>
          </div>
          <Button 
            className="w-full"
            onClick={() => startSession({
              sessionType: 'full_test',
              questions: []
            })}
            disabled={loading}
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Start Full Test'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const SubjectPracticeSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {state.analytics.performanceBySubject.map((subject) => (
        <Card key={subject.subject} className="hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span>{subject.subject}</span>
            </CardTitle>
            <CardDescription>
              Accuracy: {subject.accuracy}% • {subject.questionsAttempted} questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Topics:</span>
                <span>{subject.topics.length} available</span>
              </div>
              <Progress value={subject.accuracy} className="h-2" />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/dashboard/topics')}
              >
                Practice by Topic
              </Button>
              <Button 
                className="flex-1"
                onClick={() => startSession({
                  sessionType: 'subject_practice',
                  subject: subject.subject,
                  questions: []
                })}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Practice All Topics'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TopicPracticeSection = () => (
    <div className="space-y-6">
      {state.analytics.performanceBySubject.map((subject) => (
        <div key={subject.subject}>
          <h4 className="text-lg font-semibold mb-3">{subject.subject} Topics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {subject.topics.map((topic) => {
              const getMasteryColor = (mastery: string) => {
                switch (mastery) {
                  case 'Advanced': return 'bg-success text-success-foreground';
                  case 'Proficient': return 'bg-primary text-primary-foreground';
                  case 'Intermediate': return 'bg-warning text-warning-foreground';
                  case 'Beginner': return 'bg-destructive text-destructive-foreground';
                  default: return 'bg-muted text-muted-foreground';
                }
              };

              return (
                <Card 
                  key={topic.topic} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => startSession({
                    sessionType: 'topic_practice',
                    subject: subject.subject,
                    topic: topic.topic,
                    questions: []
                  })}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h5 className="font-medium">{topic.topic}</h5>
                      <Badge className={getMasteryColor(topic.mastery)} variant="secondary">
                        {topic.mastery}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {topic.accuracy}% • {topic.questionsAttempted} questions
                    </div>
                    <Progress value={topic.accuracy} className="h-1.5" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const MixedReviewSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['Easy', 'Medium', 'Hard'].map((difficulty) => (
        <Card key={difficulty} className="hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <span>{difficulty} Mix</span>
            </CardTitle>
            <CardDescription>Random {difficulty.toLowerCase()} questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>20-30 min</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>20 questions</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Difficulty:</span>
              <DifficultyBadge difficulty={difficulty as 'Easy' | 'Medium' | 'Hard'} />
            </div>
            <Button 
              className="w-full"
              onClick={() => startSession({
                sessionType: 'mixed_review',
                difficulty,
                questions: []
              })}
              disabled={loading}
            >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : `Start ${difficulty} Review`}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Practice Tests</h1>
        <p className="text-muted-foreground mt-2">
          Choose your practice mode and start improving your test scores
        </p>
      </div>

      {/* Functional Tabs */}
      <Tabs 
        value={state.selectedFilters.practiceTab} 
        onValueChange={(value) => dispatch({ type: 'SET_PRACTICE_TAB', payload: value })}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="Full Tests">Full Tests</TabsTrigger>
          <TabsTrigger value="Subject Practice">Subject Practice</TabsTrigger>
          <TabsTrigger value="Topic Practice">Topic Practice</TabsTrigger>
          <TabsTrigger value="Mixed Review">Mixed Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="Full Tests" className="mt-6">
          <FullTestsSection />
        </TabsContent>
        
        <TabsContent value="Subject Practice" className="mt-6">
          <SubjectPracticeSection />
        </TabsContent>
        
        <TabsContent value="Topic Practice" className="mt-6">
          <TopicPracticeSection />
        </TabsContent>
        
        <TabsContent value="Mixed Review" className="mt-6">
          <MixedReviewSection />
        </TabsContent>
      </Tabs>

      {/* Quick Start Recommendation */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary-light/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-primary" />
            <span>Quick Start Recommendation</span>
          </CardTitle>
          <CardDescription>
            Based on your performance, we recommend focusing on these areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">Recommended Practice:</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {state.user.selectedTest || 'SHSAT'} Math - Algebra topics (15 questions, ~20 minutes)
              </p>
              <Button
                onClick={() => startSession({
                  sessionType: 'topic_practice',
                  subject: 'Math',
                  topic: 'Algebra',
                  questions: []
                })}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Start Recommended Practice'}
                <Play className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">Continue Last Session:</h4>
              {state.practiceSession && !state.practiceSession.isCompleted ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {state.practiceSession.sessionType.replace('_', ' ')} (Question {state.practiceSession.currentQuestion + 1} of {state.practiceSession.questions.length})
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/dashboard/practice/session/${state.practiceSession.id}`)}
                  >
                    Continue Session
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    No active session found
                  </p>
                  <Button variant="outline" disabled>
                    No Session to Continue
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Practice;
