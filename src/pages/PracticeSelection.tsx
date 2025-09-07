import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Target, BookOpen, Users, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useServerSession } from "@/hooks/useServerSession";

interface PracticeSelectionProps {
  testType: 'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS';
}

const PracticeSelection = ({ testType }: PracticeSelectionProps) => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const { fetchQuestions, loading } = useSupabaseQuestions();
  const { requireAuth, isAuthenticated } = useAuth();
  const { createSession } = useServerSession();
  const [selectedTab, setSelectedTab] = useState<'Full Tests' | 'Subject Practice' | 'Topic Practice' | 'Mixed Review'>('Full Tests');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const subjects = ['Math', 'Verbal', 'Reading'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const startPracticeSession = async (sessionType: 'full_test' | 'subject_practice' | 'topic_practice' | 'mixed_review', questionCount: number) => {
    if (!requireAuth()) {
      return;
    }

    try {
      // Validate subject requirement for subject practice
      if (sessionType === 'subject_practice' && (!selectedSubject || selectedSubject === 'all')) {
        toast({
          title: "Subject Required",
          description: "Please select a specific subject for subject practice.",
          variant: "destructive"
        });
        return;
      }

      // Create server-backed session
      const { session, questions } = await createSession({
        sessionType,
        testType: testType,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
      });

      if (questions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "No questions found for the selected criteria. Try adjusting your filters or add more questions to the database.",
          variant: "destructive"
        });
        return;
      }

      dispatch({
        type: 'START_SESSION',
        payload: {
          serverSessionId: session.id,
          testType: testType,
          sessionType,
          subject: (selectedSubject !== 'all' ? selectedSubject : 'Math') as 'Math' | 'Verbal' | 'Reading',
          topic: 'General Practice',
          questions: questions
        }
      });
      navigate(`/practice/session/${session.id}`);
    } catch (error) {
      console.error('Error starting practice session:', error);
      toast({
        title: "Error",
        description: "Failed to start practice session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Full Tests':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Complete test simulation experience for {testType}
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

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Timed Practice</CardTitle>
                </div>
                <CardDescription>
                  25 questions • 30 minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Practice under time pressure
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => startPracticeSession('mixed_review', 25)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Start Timed Practice'}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'Subject Practice':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
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
                    <SelectItem value="all">All difficulties</SelectItem>
                    {difficulties.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                  Deep dive into {selectedSubject !== 'all' ? selectedSubject : 'selected subjects'}
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
          </div>
        );

      case 'Topic Practice':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
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

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Topic Practice</CardTitle>
                </div>
                <CardDescription>
                  15 questions • 20 minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Focus on specific topics within {selectedSubject !== 'all' ? selectedSubject : 'selected subjects'}
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => startPracticeSession('topic_practice', 15)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Start Topic Practice'}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'Mixed Review':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Quick Review</CardTitle>
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
                  {loading ? 'Loading...' : 'Start Quick Review'}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Extended Review</CardTitle>
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
                  {loading ? 'Loading...' : 'Start Extended Review'}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test-specific header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h1 className="text-2xl font-bold text-foreground">{testType} Practice</h1>
        <p className="text-muted-foreground">Choose your practice mode and start preparing</p>
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning-foreground">
              ⚠️ Please sign in to access practice sessions. Database questions are only available to authenticated users.
            </p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-card rounded-xl border border-border p-1">
        <div className="flex space-x-1">
          {['Full Tests', 'Subject Practice', 'Topic Practice', 'Mixed Review'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                selectedTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PracticeSelection;