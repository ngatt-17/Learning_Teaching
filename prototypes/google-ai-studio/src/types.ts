export type UserRole = 'student' | 'professor' | 'ta' | 'admin';

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  title: string;
  enrolledCourseIds: string[];
  delegatedPermissions?: {
    canUploadDrafts: boolean;
    canGenerateQuestions: boolean;
    canPublishQuestionBanks: boolean;
    canApproveOfficialSources: boolean;
    canManageCanvas: boolean;
  };
}

export type SourceType = 'course' | 'personal' | 'web';

export interface SourceCitation {
  id: string;
  sourceType: SourceType;
  title: string;
  location: string; // e.g. "Slide 18", "Section 3.2", "Page 45", "URL"
  excerpt: string;
  authorOrPublisher?: string;
  accessDate?: string;
  verifiedCourseApproved?: boolean;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  filename: string;
  fileSize: string;
  topic: string;
  week: number;
  status: 'approved' | 'draft' | 'processing' | 'warning' | 'failed' | 'archived';
  statusMessage?: string;
  studentVisible: boolean;
  approvedForAI: boolean;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  extractedSectionsCount: number;
  contentSnippet: string;
}

export interface PersonalStudyMaterial {
  id: string;
  studentId: string;
  courseId: string;
  title: string;
  filename: string;
  uploadedAt: string;
  isAssignmentDraft: boolean;
  assignmentName?: string;
  contentExcerpt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: SourceCitation[];
  evidenceQuality?: 'high' | 'moderate' | 'limited' | 'insufficient';
  evidenceSummary?: string;
  hasConflict?: boolean;
  conflictDescription?: string;
  helpfulRating?: 'helpful' | 'unhelpful';
  reported?: boolean;
  reportReason?: string;
  guidedHelpMode?: 'explain' | 'socratic' | 'review_attempt' | 'next_steps';
  sourceScopeUsed?: 'course_only' | 'course_and_personal' | 'expanded_web';
}

export interface ConversationThread {
  id: string;
  courseId: string;
  userId: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  isPrivateWorkspace?: boolean;
  associatedPersonalSourceId?: string;
  activeAssignmentDeclared?: boolean;
}

export type QuestionType = 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  stem: string;
  type: QuestionType;
  options?: string[]; // for mc / ms
  correctAnswer: string | string[]; // index or text or boolean
  explanation: string;
  difficulty: DifficultyLevel;
  topic: string;
  citations: SourceCitation[];
  validationWarnings?: string[];
}

export interface QuestionBank {
  id: string;
  courseId: string;
  title: string;
  description: string;
  topic: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  publishedBy?: string;
  version: number;
  questions: QuizQuestion[];
  isInstructorCurated: boolean;
  attemptsCount: number;
  averageScorePct?: number;
}

export interface StudentPracticeAttempt {
  id: string;
  studentId: string;
  courseId: string;
  activityTitle: string;
  bankTitle?: string;
  questionBankId?: string;
  totalQuestions: number;
  correctCount: number;
  score?: number;
  percentage?: number;
  completedAt: string;
  timestamp?: string;
  topic: string;
  misconceptionsEncountered: string[];
  misconceptionsIdentified?: string[];
  canvasExportStatus?: 'not_exported' | 'pending' | 'exported' | 'failed';
  canvasExportedAt?: string;
  answers?: {
    questionId: string;
    studentAnswer: string | string[];
    isCorrect: boolean;
    timeSpentSeconds: number;
  }[];
}

export interface MisconceptionInsight {
  id: string;
  courseId: string;
  topic: string;
  conceptTitle: string;
  misconceptionDescription: string;
  affectedStudentsPct: number;
  sampleSize: number; // minimum cohort size protection
  evidenceQuotes: string[];
  recommendedAction: string;
  severity: 'high' | 'medium' | 'low';
}

export interface CanvasExportRecord {
  id: string;
  courseId: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  activityTitle: string;
  attemptDate: string;
  questionsAttempted: number;
  status: 'synced' | 'pending' | 'failed';
  transmittedFields: {
    courseId: string;
    studentCanvasId: string;
    activityType: string;
    completedDate: string;
    questionsAttemptedCount: number;
    completionStatus: string;
    gradeIncluded: false;
    chatContentIncluded: false;
  };
}

export interface CourseData {
  id: string;
  code: string;
  name: string;
  term: string;
  instructorName: string;
  instructorEmail: string;
  enrolledStudentsCount: number;
  currentTopic: string;
  currentWeek: number;
  approvedSourcesCount: number;
  aiReadinessStatus: 'ready' | 'needs_sources' | 'processing_warning';
  activeAssignmentPolicy?: {
    assignmentName: string;
    dueDate: string;
    guidedHelpOnly: boolean;
    directSolutionsBlocked: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  details: string;
  complianceFlag?: string;
}

export interface GovernanceItem {
  id: string;
  courseId: string;
  courseCode: string;
  type: 'reported_ai_answer' | 'unresolved_source_warning' | 'failed_extraction' | 'permission_change';
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'unresolved' | 'in_review' | 'resolved';
  assignedSupportOwner?: string;
}
