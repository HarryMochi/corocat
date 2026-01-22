

export interface BaseQuestion {
  type: 'multipleChoice';
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
  multipleChoice: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation?: string;
  };
  trueOrFalse: {
    question: string;
    correctAnswer: boolean;
    explanation?: string;
  };
}

export interface SubStep {
  title: string;
  content: string;
  exercise: Exercise;
  summary?: string;
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

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: any;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string | null;
  status?: string;
  data?: any;
  relatedEntityId?: string;
  relatedEntityName?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}
export interface Course {
  id: string;
  userId: string;
  userName?: string;
  topic: string;
  depth: 'Quick Overview' | 'Normal Path' | 'Long Mastery';
  courseMode: 'Solo' | 'Collaborative';
  invitedFriends?: User[];
  outline?: string;
  steps?: Step[];
  notes?: string;
  createdAt: string;
  isPublic: boolean;
  category?: string;
  likes?: number;
  likedBy?: string[];
  originalOwnerId?: string;
  originalOwnerName?: string;
  sharedAt?: any;
}

export type CourseData = Omit<Course, 'id'>;

export type BoardOptions =
  "Select" | "Draw" | "Shapes" | "Eraser" | "Undo" | "Redo";

export type ShapeType =
  "Square" | "Rectangle" | "Circle"
export interface MarketplaceCourse extends Course {
  originalCourseId: string;
  marketplaceId: string;
}
export type Color = {
  r: number;
  g: number;
  b: number;
};

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
  Text,
}

export type Camera = {
  x: number;
  y: number;
};

export type Layer = RectangleLayer | EllipseLayer | PathLayer | TextLayer;

export type RectangleLayer = {
  type: LayerType.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
};

export type EllipseLayer = {
  type: LayerType.Ellipse;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
};

export type PathLayer = {
  type: LayerType.Path;
  x: number;
  y: number;
  // Could be computed based on points
  height: number;
  // Could be computed based on points
  width: number;
  fill: Color;
  points: number[][];
};

export type TextLayer = {
  type: LayerType.Text;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  value: string;
};

export type Point = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

export type CanvasState =
  | {
    mode: CanvasMode.None;
  }
  | {
    mode: CanvasMode.SelectionNet;
    origin: Point;
    current?: Point;
  }
  | {
    mode: CanvasMode.Translating;
    current: Point;
  }
  | {
    mode: CanvasMode.Inserting;
    layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text;
  }
  | {
    mode: CanvasMode.Pencil;
  }
  | {
    mode: CanvasMode.Pressing;
    origin: Point;
  }
  | {
    mode: CanvasMode.Resizing;
    initialBounds: XYWH;
    corner: Side;
  };

export enum CanvasMode {

  None,

  Pressing,

  SelectionNet,

  Translating,

  Inserting,

  Resizing,

  Pencil,
}