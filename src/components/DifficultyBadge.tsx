import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const getVariant = () => {
    switch (difficulty) {
      case 'Easy': return 'secondary';
      case 'Medium': return 'default';
      case 'Hard': return 'destructive';
      default: return 'default';
    }
  };

  const getColor = () => {
    switch (difficulty) {
      case 'Easy': return 'bg-success/10 text-success hover:bg-success/20';
      case 'Medium': return 'bg-warning/10 text-warning hover:bg-warning/20';
      case 'Hard': return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default: return '';
    }
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={`${getColor()} ${className}`}
    >
      {difficulty}
    </Badge>
  );
}