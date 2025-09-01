import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSupabaseTopics } from "@/hooks/useSupabaseTopics";

interface TopicSelectorProps {
  testType: string;
  subject?: string;
  selectedTopic?: string;
  onTopicChange: (topic: string) => void;
  className?: string;
}

export function TopicSelector({ 
  testType, 
  subject, 
  selectedTopic, 
  onTopicChange,
  className 
}: TopicSelectorProps) {
  const { fetchTopics, loading } = useSupabaseTopics();
  const [topics, setTopics] = useState<Array<{ topic: string; question_count: number }>>([]);

  useEffect(() => {
    const loadTopics = async () => {
      if (testType) {
        const fetchedTopics = await fetchTopics(testType, subject);
        setTopics(fetchedTopics);
        
        // Reset selection if current topic is not available
        if (selectedTopic && !fetchedTopics.find(t => t.topic === selectedTopic)) {
          onTopicChange('all');
        }
      }
    };

    loadTopics();
  }, [testType, subject, fetchTopics, selectedTopic, onTopicChange]);

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">
        Topic (Optional)
        {loading && <span className="text-muted-foreground ml-2">Loading...</span>}
      </label>
      <Select value={selectedTopic || 'all'} onValueChange={onTopicChange}>
        <SelectTrigger>
          <SelectValue placeholder="All topics" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All topics</SelectItem>
          {topics.map(topic => (
            <SelectItem key={topic.topic} value={topic.topic}>
              <div className="flex items-center justify-between w-full">
                <span>{topic.topic}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {topic.question_count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {topics.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground mt-1">
          No topics available for the selected criteria
        </p>
      )}
    </div>
  );
}