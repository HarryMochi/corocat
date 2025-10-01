

export interface BaseQuestion {
    type: 'multipleChoice'; // Only multiple choice for now
    question: string;
    explanation: string;
    userAnswer: string | number | null;
    isCorrect: boolean | null;
    feedback?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'multipleChoice';
    options: string[];
    correctAnswerIndex: number;
}

export type Quiz = MultipleChoiceQuestion; // Only MultipleChoiceQuestion

export interface QuizSet {
    questions: Quiz[];
    score: number | null;
}

export interface ExternalLink {
    title: string;
    url: string;
}

export interface Exercise {
  description: string;
  startingCode?: string;
}

export interface SubStep {
  title: string;
  content: string;
  exercise: Exercise;
}

export interface Step {
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  subSteps?: SubStep[];
  content?: string; // Keep for backward compatibility
  quiz?: QuizSet;
  funFact?: string;
  externalLinks?: ExternalLink[];
  completed: boolean;
}

export interface Course {
  id: string;
  userId: string;
  userName?: string;
  topic: string;
  depth: 'Quick Overview' | 'Normal Path' | 'Long Mastery';
  outline: string;
  steps: Step[];
  notes: string;
  createdAt: string;
  isPublic: boolean;
  category?: string;
  likes?: number;
  likedBy?: string[];
}

export type CourseData = Omit<Course, 'id'>;


export interface MarketplaceCourse extends Course {
    originalCourseId: string;
    marketplaceId: string;
}
