import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Flag, Maximize2, Minimize2 } from "lucide-react";
import { Question, UserAnswer } from "@/types/app";
import { DifficultyBadge } from "./DifficultyBadge";

interface EnhancedReadingViewProps {
  question: Question;
  currentAnswer?: UserAnswer;
  onAnswerSelect: (answer: 'A' | 'B' | 'C' | 'D') => void;
  onFlag: () => void;
}

export const EnhancedReadingView = ({
  question,
  currentAnswer,
  onAnswerSelect,
  onFlag
}: EnhancedReadingViewProps) => {
  const [isPassageExpanded, setIsPassageExpanded] = useState(false);

  if (question.subject !== 'Reading' || !question.passage) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Split Layout for Reading */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Passage Panel */}
        <Card className={`border-l-4 border-l-primary ${isPassageExpanded ? 'lg:col-span-2' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reading Passage
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPassageExpanded(!isPassageExpanded)}
                className="lg:flex hidden"
              >
                {isPassageExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className={`prose prose-sm max-w-none text-foreground leading-relaxed 
                whitespace-pre-wrap overflow-y-auto
                ${isPassageExpanded ? 'max-h-[70vh]' : 'max-h-[50vh]'}`}
            >
              {question.passage}
            </div>
          </CardContent>
        </Card>

        {/* Question Panel */}
        {!isPassageExpanded && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {question.subject} • {question.topic}
                    </Badge>
                    <DifficultyBadge difficulty={question.difficulty} />
                  </div>
                  <Button
                    variant={currentAnswer?.isFlagged ? "default" : "outline"}
                    size="sm"
                    onClick={onFlag}
                  >
                    <Flag className={`h-4 w-4 mr-2 ${currentAnswer?.isFlagged ? 'fill-current' : ''}`} />
                    {currentAnswer?.isFlagged ? 'Flagged' : 'Flag'}
                  </Button>
                </div>
                
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {question.questionText}
                </div>
                
                {/* Render question images if available */}
                {question.questionImages && question.questionImages.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {question.questionImages.map((imageUrl, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={`Question image ${index + 1}`}
                          className="w-full max-w-2xl mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Answer Options - Always full width */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Select your answer:</h3>
        {Object.entries(question.options).map(([option, text]) => (
          <Button
            key={option}
            variant={currentAnswer?.selectedAnswer === option ? "default" : "outline"}
            className="w-full justify-start text-left p-4 h-auto min-h-[3rem] hover:bg-muted/50 transition-colors"
            onClick={() => onAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
          >
            <span className="font-bold mr-3 min-w-[1.5rem] text-primary">
              {option}.
            </span>
            <span className="flex-1 leading-relaxed">{text}</span>
          </Button>
        ))}
      </div>

      {/* Reading Tips */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Reading Strategy Tip:</p>
              <p>Read the question first, then scan the passage for relevant information. Look for keywords and context clues that relate to the question.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};