import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  Target, 
  Play, 
  BarChart3,
  Calculator,
  MessageSquare,
  FileText,
  ChevronRight
} from "lucide-react";

const Practice = () => {
  const testTypes = [
    {
      name: "SHSAT",
      fullName: "Specialized High Schools Admissions Test",
      description: "NYC specialized high school entrance exam",
      progress: 65,
      lastScore: 81,
      questionsAttempted: 456
    },
    {
      name: "SSAT",
      fullName: "Secondary School Admission Test",
      description: "Private school admission test",
      progress: 40,
      lastScore: 72,
      questionsAttempted: 234
    },
    {
      name: "ISEE",
      fullName: "Independent School Entrance Exam",
      description: "Private school entrance examination",
      progress: 25,
      lastScore: null,
      questionsAttempted: 67
    },
    {
      name: "HSPT",
      fullName: "High School Placement Test",
      description: "Catholic high school admission test",
      progress: 0,
      lastScore: null,
      questionsAttempted: 0
    },
    {
      name: "TACHS",
      fullName: "Test for Admission into Catholic High Schools",
      description: "Catholic high school entrance exam (NYC area)",
      progress: 0,
      lastScore: null,
      questionsAttempted: 0
    }
  ];

  const practiceMode = [
    {
      title: "Full Practice Test",
      description: "Complete timed exam simulation",
      icon: Clock,
      time: "2-3 hours",
      questions: "50-100",
      difficulty: "Mixed",
      color: "text-primary"
    },
    {
      title: "Topic Practice",
      description: "Focus on specific subjects",
      icon: Target,
      time: "15-30 min",
      questions: "10-25",
      difficulty: "Selectable",
      color: "text-success"
    },
    {
      title: "Mixed Review",
      description: "Random questions from all topics",
      icon: BarChart3,
      time: "10-20 min",
      questions: "15-20",
      difficulty: "Adaptive",
      color: "text-warning"
    }
  ];

  const subjects = [
    {
      name: "Math",
      icon: Calculator,
      topics: ["Algebra", "Geometry", "Arithmetic", "Word Problems"],
      progress: 82,
      available: 567,
      avgAccuracy: 78
    },
    {
      name: "Verbal",
      icon: MessageSquare,
      topics: ["Vocabulary", "Synonyms", "Analogies", "Logic"],
      progress: 76,
      available: 423,
      avgAccuracy: 73
    },
    {
      name: "Reading",
      icon: FileText,
      topics: ["Comprehension", "Inference", "Main Ideas", "Analysis"],
      progress: 81,
      available: 298,
      avgAccuracy: 85
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Practice Tests</h1>
        <p className="text-muted-foreground mt-2">
          Choose your test type and practice mode to get started
        </p>
      </div>

      {/* Test Types */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Select Test Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testTypes.map((test) => (
            <Card key={test.name} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {test.lastScore && (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {test.lastScore}%
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {test.fullName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {test.description}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{test.progress}%</span>
                    </div>
                    <Progress value={test.progress} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Questions Attempted:</span>
                    <span>{test.questionsAttempted}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  variant={test.progress > 0 ? "default" : "outline"}
                >
                  {test.progress > 0 ? "Continue Practice" : "Start Practice"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Practice Modes */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Practice Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {practiceMode.map((mode) => (
            <Card key={mode.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <mode.icon className={`h-12 w-12 mx-auto mb-3 ${mode.color}`} />
                <CardTitle className="text-lg">{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{mode.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>{mode.questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span>{mode.difficulty}</span>
                  </div>
                </div>
                
                <Button className="w-full mt-4">
                  <Play className="h-4 w-4 mr-2" />
                  Start {mode.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subject Breakdown */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Practice by Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <subject.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>
                      {subject.available} questions available
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Mastery Level</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-2">Topics covered:</p>
                    <div className="flex flex-wrap gap-1">
                      {subject.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Average Accuracy: <span className="font-medium text-foreground">{subject.avgAccuracy}%</span></p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Practice {subject.name}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start */}
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
                SHSAT Math - Algebra topics (15 questions, ~20 minutes)
              </p>
              <Button>
                Start Recommended Practice
                <Play className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">Continue Last Session:</h4>
              <p className="text-sm text-muted-foreground mb-4">
                SHSAT Practice Test #3 (Question 15 of 30)
              </p>
              <Button variant="outline">
                Continue Session
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Practice;