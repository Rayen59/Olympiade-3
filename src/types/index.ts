export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  points: number;
  solvedProblems: string[];
  solvedCount: number;
  banned: boolean;
  banUntil: string | null;
  banReason: string | null;
  createdAt: string;
  avatarColor: string;
  bio: string;
}

export type OlympiadTheme =
  | 'Théorie des Nombres'
  | 'Géométrie'
  | 'Combinatoire'
  | 'Inégalités'
  | 'Équations Fonctionnelles';

export interface Problem {
  id: string;
  problemNumber?: string;
  theme: OlympiadTheme;
  points: number;
  difficulty: string;
  title: string;
  statement: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  category: string;
  points: number;
  userId: string;
  username: string;
  userEmail: string;
  images: string[];
  imageUrl: string;
  solutionText: string;
  status: SubmissionStatus;
  reviewReason: string | null;
  reviewImages?: string[];
  submittedAt: string;
  reviewedAt: string | null;
  updatedAt?: string;
}

export interface CourseSection {
  subtitle: string;
  content: string;
}

export interface Course {
  id: string;
  theme: string;
  title: string;
  summary: string;
  sections: CourseSection[];
}

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl?: string | null;
  images?: string[];
  createdAt: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  category: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl?: string | null;
  images?: string[];
  views: number;
  createdAt: string;
  replies: ForumReply[];
}

export interface Olympiad {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  durationMinutes: number;
  totalDurationMinutes: number;
  problemCount: number;
  pointsPerProblem: number;
  totalPoints: number;
  goldCutoff: number;
  silverCutoff: number;
  bronzeCutoff: number;
  honorableMentionCutoff: number;
  pdfUrl: string;
  pdfTitle: string;
  pdfFileSize?: string;
  pdfUpdatedAt?: string;
  status: 'active' | 'grading' | 'closed';
  resultsPublished: boolean;
  createdAt: string;
}

export interface OlympiadSubmission {
  id: string;
  olympiadId: string;
  userId: string;
  username: string;
  userEmail: string;
  images: string[];
  solutionNotes: string;
  status: 'submitted' | 'graded';
  problemScores: Record<string, number>;
  overallScore: number;
  medal: string;
  feedback: string;
  submittedAt: string;
  gradedAt: string | null;
  updatedAt?: string;
}

export type AppTab =
  | 'problems'
  | 'olympiads'
  | 'courses'
  | 'forum'
  | 'leaderboard'
  | 'admin'
  | 'profile';
