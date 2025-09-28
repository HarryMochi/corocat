

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

export interface ContentBlock {
  type: 'coreConcept' | 'practicalExample' | 'analogy' | 'keyTerm';
  content: string;
}

export interface Step {
  stepNumber: number;
  title: string;
  shortTitle: string;
  contentBlocks?: ContentBlock[];
  content?: string; // Keep for backward compatibility, but favor contentBlocks
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
  learningMode: 'solo' | 'collaborative';
  collaborators?: string[]; // Array of user IDs
  collaboratorEmails?: string[]; // Array of emails for display
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

export interface CourseInvitation {
  id: string;
  courseId: string;
  courseTopic: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipientId?: string; // Set when user with this email exists
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export type CourseInvitationData = Omit<CourseInvitation, 'id'>;

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export type UserProfileData = Omit<UserProfile, 'id'>;

export interface CollaborativeCourse extends Course {
  creatorId: string;
  creatorName: string;
  collaborators: string[];
  collaboratorNames: string[];
  sharedNotes: string;
  discussionThreads?: DiscussionThread[];
}

export interface DiscussionThread {
  id: string;
  stepNumber?: number; // Optional, for step-specific discussions
  title: string;
  messages: DiscussionMessage[];
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface DiscussionMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface MarketplaceCourse extends Course {
    originalCourseId: string;
    marketplaceId: string;
}
