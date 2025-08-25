import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, MessageSquare, FileText, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

const Topics = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const subjects = state.analytics.performanceBySubject;

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case 'Advanced': return 'bg-success/10 text-success';
      case 'Proficient': return 'bg-primary/10 text-primary';
      case 'Intermediate': return 'bg-warning/10 text-warning';
      case 'Beginner': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Math': return Calculator;
      case 'Verbal': return MessageSquare;
      case 'Reading': return FileText;
      default: return Calculator;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Practice by Topic</h1>
        <p className="text-muted-foreground mt-2">
          Focus on specific topics to improve your performance
        </p>
      </div>

      {subjects.map((subject) => {
        const Icon = getSubjectIcon(subject.subject);
        return (
          <div key={subject.subject} className="space-y-4">
            <div className="flex items-center space-x-3">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">{subject.subject}</h2>
              <Badge variant="secondary">{subject.accuracy}% accuracy</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.topics.map((topic) => (
                <Card key={topic.topic} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{topic.topic}</CardTitle>
                      <Badge className={getMasteryColor(topic.mastery)}>
                        {topic.mastery}
                      </Badge>
                    </div>
                    <CardDescription>
                      {topic.questionsAttempted} questions practiced
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy</span>
                        <span>{topic.accuracy}%</span>
                      </div>
                      <Progress value={topic.accuracy} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Avg time: {topic.averageTime}s per question
                    </div>
                    
                    <Button className="w-full" onClick={() => navigate('/practice')}>
                      <Play className="h-4 w-4 mr-2" />
                      Practice {topic.topic}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Topics;