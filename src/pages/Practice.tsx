
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, TrendingUp, Play, BookOpen, Users, Award } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { generateMockQuestions } from "@/mock/data";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";

const Practice = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { fetchQuestions, loading } = useSupabaseQuestions();
  const { isAuthenticated, requireAuth } = useAuth();
  const [selectedTestType, setSelectedTestType] = useState<'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS'>(state.user?.selectedTest || 'SHSAT');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  const testTypes: ('SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS')[] = ['SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS'];
  const subjects = ['Math', 'Verbal', 'Reading'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const startPracticeSession = async (sessionType: 'full_test' | 'subject_practice' | 'topic_practice' | 'mixed_review', questionCount: number) => {
    // Check authentication for database access
    if (!requireAuth()) {
      return;
    }

    try {
      console.log('Starting practice session with:', { sessionType, questionCount, selectedTestType, selectedSubject, selectedDifficulty });
      
      const filters: any = {
        testType: selectedTestType,
        count: questionCount
      };

      if (selectedSubject) {
        filters.subject = selectedSubject;
      }
      if (selectedDifficulty) {
        filters.difficulty = selectedDifficulty;
      }

      console.log('Fetching questions with filters:', filters);
      const questions = await fetchQuestions(filters);
      console.log('Fetched questions:', questions);

      let finalQuestions = questions;

      // If we don't have enough questions, supplement with mock data
      if (questions.length < questionCount) {
        console.log(`Only ${questions.length} questions found, supplementing with mock data`);
        const mockQuestions = generateMockQuestions(
          questionCount - questions.length,
          {
            subject: selectedSubject,
            difficulty: selectedDifficulty
          }
        );
        finalQuestions = [...questions, ...mockQuestions];
      }

      if (finalQuestions.length > 0) {
        console.log('Starting session with questions:', finalQuestions.length);
        dispatch({
          type: 'START_SESSION',
          payload: {
            testType: selectedTestType,
            sessionType,
            subject: selectedSubject as 'Math' | 'Verbal' | 'Reading' || 'Math',
            topic: 'General Practice',
            questions: finalQuestions
          }
        });
        navigate(`/dashboard/practice/session/${Date.now()}`);
      } else {
        console.error('No questions available');
        // Fallback to mock questions if database is completely empty
        console.log('Falling back to mock questions');
        const mockQuestions = generateMockQuestions(questionCount, {
          subject: selectedSubject,
          difficulty: selectedDifficulty
        });
        
        dispatch({
          type: 'START_SESSION',
          payload: {
            testType: selectedTestType,
            sessionType,
            subject: selectedSubject as 'Math' | 'Verbal' | 'Reading' || 'Math',
            topic: 'General Practice',
            questions: mockQuestions
          }
        });
        navigate(`/dashboard/practice/session/${Date.now()}`);
      }
    } catch (error) {
      console.error('Error starting practice session:', error);
      // Fallback to mock questions on error
      console.log('Error occurred, falling back to mock questions');
      const mockQuestions = generateMockQuestions(questionCount, {
        subject: selectedSubject,
        difficulty: selectedDifficulty
      });
      
      dispatch({
        type: 'START_SESSION',
        payload: {
          testType: selectedTestType,
          sessionType,
          subject: selectedSubject as 'Math' | 'Verbal' | 'Reading' || 'Math',
          topic: 'General Practice',
          questions: mockQuestions
        }
      });
      navigate(`/dashboard/practice/session/${Date.now()}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Practice Tests</h1>
        <p className="text-muted-foreground mt-2">
          Choose your practice mode and customize your session
        </p>
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning-foreground">
              ⚠️ You need to be signed in to access the full question database. 
              Practice sessions will use sample questions only.
            </p>
          </div>
        )}
      </div>

      {/* Practice Options */}
      <Card>
        <CardHeader>
          <CardTitle>Customize Your Practice</CardTitle>
          <CardDescription>
            Select test type, subject, and difficulty to personalize your practice session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <Select value={selectedTestType} onValueChange={(value) => setSelectedTestType(value as 'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map(test => (
                    <SelectItem key={test} value={test}>{test}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Subject (Optional)</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty (Optional)</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All difficulties</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Practice */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Practice</CardTitle>
            </div>
            <CardDescription>
              15 questions • 15 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Perfect for a quick review session
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('mixed_review', 15)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Quick Practice'}
            </Button>
          </CardContent>
        </Card>

        {/* Subject Focus */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Subject Focus</CardTitle>
            </div>
            <CardDescription>
              25 questions • 30 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Deep dive into specific subjects
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('subject_practice', 25)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Subject Focus'}
            </Button>
          </CardContent>
        </Card>

        {/* Full Practice Test */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Full Practice Test</CardTitle>
            </div>
            <CardDescription>
              50+ questions • 2+ hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Complete test simulation experience
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('full_test', 50)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Full Test'}
            </Button>
          </CardContent>
        </Card>

        {/* Mixed Review */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Mixed Review</CardTitle>
            </div>
            <CardDescription>
              30 questions • 45 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Variety of questions across all topics
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('mixed_review', 30)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Mixed Review'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Your Performance Overview</CardTitle>
          </div>
          <CardDescription>
            Track your progress across all practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.studyStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.analytics.performanceBySubject.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{subject.subject}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {subject.accuracy}% accuracy
                  </span>
                </div>
                <Progress value={subject.accuracy} className="w-32 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Practice;
