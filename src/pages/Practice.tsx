import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, TrendingUp, Play, BookOpen, Users, Award, CheckCircle, Calendar } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { generateMockQuestions } from "@/mock/data";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { TopicSelector } from "@/components/TopicSelector";
import { useQuestionCount } from "@/hooks/useQuestionCount";
import { useRecentPractice } from "@/hooks/useRecentPractice";
import { formatDistance } from 'date-fns';

const Practice = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { fetchQuestions, loading } = useSupabaseQuestions();
  const { isAuthenticated, requireAuth } = useAuth();
  const [selectedTestType, setSelectedTestType] = useState<'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS'>(state.user?.selectedTest || 'SHSAT');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<'quick' | 'subject' | 'full' | 'mixed'>('quick');
  
  // Get available question count based on current filters
  const { count: availableQuestions, loading: countLoading } = useQuestionCount({
    testType: selectedTestType,
    subject: selectedSubject,
    topic: selectedTopic,
    difficulty: selectedDifficulty
  });
  
  // Get recent practice sessions
  const { sessions: recentSessions, loading: sessionsLoading } = useRecentPractice(3);

  const testTypes: ('SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS')[] = ['SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS'];
  const subjects = ['Math', 'Verbal', 'Reading'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  
  const practiceModesToOptions = {
    quick: { name: 'Quick Practice', questions: 15, time: '15 min', sessionType: 'mixed_review' as const },
    subject: { name: 'Subject Focus', questions: 25, time: '30 min', sessionType: 'subject_practice' as const },
    full: { name: 'Full Practice Test', questions: 50, time: '2+ hours', sessionType: 'full_test' as const },
    mixed: { name: 'Mixed Review', questions: 30, time: '45 min', sessionType: 'mixed_review' as const }
  };

  const startCustomPractice = () => {
    const modeConfig = practiceModesToOptions[selectedMode];
    startPracticeSession(modeConfig.sessionType, modeConfig.questions);
  };

  const startPracticeSession = async (sessionType: 'full_test' | 'subject_practice' | 'topic_practice' | 'mixed_review', questionCount: number) => {
    // Check authentication for database access
    if (!requireAuth()) {
      return;
    }

    try {
      console.log('Starting practice session with:', { sessionType, questionCount, selectedTestType, selectedSubject, selectedDifficulty });
      
      const filters: any = {
        testType: selectedTestType,
        count: questionCount,
        avoidRecent: true
      };

      if (selectedSubject && selectedSubject !== 'all') {
        filters.subject = selectedSubject;
      }
      if (selectedTopic && selectedTopic !== 'all') {
        filters.topic = selectedTopic;
      }
      if (selectedDifficulty && selectedDifficulty !== 'all') {
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
            subject: selectedSubject !== 'all' ? selectedSubject : undefined,
            difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
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
            subject: (selectedSubject !== 'all' ? selectedSubject : 'Math') as 'Math' | 'Verbal' | 'Reading',
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
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
        });
        
        dispatch({
          type: 'START_SESSION',
          payload: {
            testType: selectedTestType,
            sessionType,
            subject: (selectedSubject !== 'all' ? selectedSubject : 'Math') as 'Math' | 'Verbal' | 'Reading',
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
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
      });
      
      dispatch({
        type: 'START_SESSION',
        payload: {
          testType: selectedTestType,
          sessionType,
          subject: (selectedSubject !== 'all' ? selectedSubject : 'Math') as 'Math' | 'Verbal' | 'Reading',
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <TopicSelector
              testType={selectedTestType}
              subject={selectedSubject !== 'all' ? selectedSubject : undefined}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
            />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty (Optional)</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Practice Mode Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Practice Mode</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(practiceModesToOptions).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMode(key as any)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedMode === key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium text-sm">{config.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {config.questions} questions • {config.time}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Available Questions & Start Button */}
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Available questions: </span>
                    <span className="font-medium text-foreground">
                      {countLoading ? 'Loading...' : `${availableQuestions} questions`}
                    </span>
                  </div>
                  {availableQuestions < practiceModesToOptions[selectedMode].questions && (
                    <Badge variant="outline" className="text-xs">
                      Will use mock questions
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={startCustomPractice}
                  disabled={loading || countLoading}
                  size="lg"
                  className="min-w-[140px]"
                >
                  {loading ? 'Loading...' : `Start ${practiceModesToOptions[selectedMode].name}`}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Practice Sessions */}
      {isAuthenticated && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Recent Practice Sessions</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/analytics')}>
                View All
              </Button>
            </div>
            <CardDescription>
              Your most recent practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      {session.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {session.test_type} • {session.session_type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistance(new Date(session.created_at), new Date(), { addSuffix: true })}
                        {session.subject && ` • ${session.subject}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {session.score !== null && (
                      <div className="text-sm font-medium">{session.score}%</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {session.total_questions} questions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Options</CardTitle>
          <CardDescription>
            Jump right into practice with popular configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Practice */}
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                 onClick={() => startPracticeSession('mixed_review', 15)}>
              <div className="flex items-center space-x-2 mb-2">
                <Play className="h-4 w-4 text-primary" />
                <div className="font-medium text-sm">Quick Practice</div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                15 questions • 15 minutes
              </div>
              <Button size="sm" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Start'}
              </Button>
            </div>

            {/* Subject Focus */}
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => startPracticeSession('subject_practice', 25)}>
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <div className="font-medium text-sm">Subject Focus</div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                25 questions • 30 minutes
              </div>
              <Button size="sm" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Start'}
              </Button>
            </div>

            {/* Full Test */}
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => startPracticeSession('full_test', 50)}>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <div className="font-medium text-sm">Full Practice Test</div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                50+ questions • 2+ hours
              </div>
              <Button size="sm" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Start'}
              </Button>
            </div>

            {/* Mixed Review */}
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => startPracticeSession('mixed_review', 30)}>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <div className="font-medium text-sm">Mixed Review</div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                30 questions • 45 minutes
              </div>
              <Button size="sm" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Start'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
