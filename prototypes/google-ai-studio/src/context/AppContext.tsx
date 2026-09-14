import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserPersona,
  UserRole,
  CourseData,
  CourseMaterial,
  QuestionBank,
  QuizQuestion,
  StudentPracticeAttempt,
  MisconceptionInsight,
  CanvasExportRecord,
  AuditLogEntry,
  GovernanceItem,
  ConversationThread,
  PersonalStudyMaterial,
  SourceCitation
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_MATERIALS,
  INITIAL_QUESTION_BANKS,
  INITIAL_MISCONCEPTIONS,
  INITIAL_CANVAS_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_GOVERNANCE_ITEMS,
  INITIAL_CONVERSATIONS,
  INITIAL_PERSONAL_MATERIALS
} from '../mockData';

interface AppContextType {
  // Authentication & Persona
  currentUser: UserPersona;
  allUsers: UserPersona[];
  switchUser: (userId: string) => void;
  simulateSSOLogin: (email?: string) => void;
  simulateSignOut: () => void;
  isSSOLoading: boolean;

  // Active Course
  activeCourse: CourseData;
  courses: CourseData[];
  setActiveCourseId: (courseId: string) => void;

  // Materials
  materials: CourseMaterial[];
  addMaterial: (material: Partial<CourseMaterial>) => Promise<void>;
  updateMaterial: (id: string, updates: Partial<CourseMaterial>) => void;
  deleteMaterial: (id: string) => void;
  toggleApproveForAI: (id: string) => void;

  // Question Banks
  questionBanks: QuestionBank[];
  addQuestionBank: (bank: Partial<QuestionBank>) => void;
  updateQuestionBank: (id: string, updates: Partial<QuestionBank>) => void;
  deleteQuestionBank: (id: string) => void;
  publishQuestionBank: (id: string) => { success: boolean; message: string };
  unpublishQuestionBank: (id: string) => void;
  regenerateQuestion: (bankId: string, questionId: string) => void;

  // Conversations & Q&A
  conversations: ConversationThread[];
  activeConversation: ConversationThread | null;
  setActiveConversationId: (id: string | null) => void;
  askGroundedQuestion: (params: {
    question: string;
    courseId: string;
    includeWeb: boolean;
    materialScopeId?: string;
  }) => Promise<void>;
  rateAnswer: (convId: string, messageId: string, rating: 'helpful' | 'unhelpful') => void;
  reportAnswer: (convId: string, messageId: string, reason: string) => void;

  // Private Study Workspace
  personalMaterials: PersonalStudyMaterial[];
  addPersonalMaterial: (mat: Partial<PersonalStudyMaterial>) => void;
  deletePersonalMaterial: (id: string) => void;
  askPrivateWorkspaceQuestion: (params: {
    question: string;
    courseId: string;
    personalMaterialId?: string;
    isAssignmentWork: boolean;
    guidedHelpMode: 'explain' | 'socratic' | 'review_attempt' | 'next_steps';
  }) => Promise<void>;

  // Practice & Attempts
  practiceAttempts: StudentPracticeAttempt[];
  recordPracticeAttempt: (attempt: Omit<StudentPracticeAttempt, 'id' | 'completedAt'>) => void;

  // Canvas Integration
  canvasRecords: CanvasExportRecord[];
  exportToCanvas: (params: {
    courseId: string;
    activityTitle: string;
    questionsAttempted: number;
  }) => Promise<{ success: boolean; record: CanvasExportRecord }>;

  // Insights & Governance
  misconceptions: MisconceptionInsight[];
  governanceItems: GovernanceItem[];
  auditLogs: AuditLogEntry[];
  resolveGovernanceItem: (id: string) => void;
  assignSupportOwner: (itemId: string, ownerName: string) => void;

  // Active Citation Drawer
  activeCitation: SourceCitation | null;
  setActiveCitation: (cit: SourceCitation | null) => void;

  // Quick Usability Scenario Launcher
  loadScenario: (scenarioId: 'student_concurrency' | 'ta_question_bank' | 'prof_review' | 'admin_readiness') => void;

  // Demo state reset
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'cecs_hub_v1_data';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserPersona>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Student default
  });

  const [courses, setCourses] = useState<CourseData[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_courses`);
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [activeCourseId, setActiveCourseId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_activeCourseId`);
    return saved || 'course-comp2030';
  });

  const [materials, setMaterials] = useState<CourseMaterial[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_materials`);
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_qbanks`);
    return saved ? JSON.parse(saved) : INITIAL_QUESTION_BANKS;
  });

  const [conversations, setConversations] = useState<ConversationThread[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_conversations`);
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return 'conv-comp-1';
  });

  const [personalMaterials, setPersonalMaterials] = useState<PersonalStudyMaterial[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_personal`);
    return saved ? JSON.parse(saved) : INITIAL_PERSONAL_MATERIALS;
  });

  const [practiceAttempts, setPracticeAttempts] = useState<StudentPracticeAttempt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_attempts`);
    return saved ? JSON.parse(saved) : [];
  });

  const [canvasRecords, setCanvasRecords] = useState<CanvasExportRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_canvas`);
    return saved ? JSON.parse(saved) : INITIAL_CANVAS_RECORDS;
  });

  const [misconceptions, setMisconceptions] = useState<MisconceptionInsight[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_misc`);
    return saved ? JSON.parse(saved) : INITIAL_MISCONCEPTIONS;
  });

  const [governanceItems, setGovernanceItems] = useState<GovernanceItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gov`);
    return saved ? JSON.parse(saved) : INITIAL_GOVERNANCE_ITEMS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
    localStorage.setItem(`${STORAGE_KEY}_courses`, JSON.stringify(courses));
    localStorage.setItem(`${STORAGE_KEY}_activeCourseId`, activeCourseId);
    localStorage.setItem(`${STORAGE_KEY}_materials`, JSON.stringify(materials));
    localStorage.setItem(`${STORAGE_KEY}_qbanks`, JSON.stringify(questionBanks));
    localStorage.setItem(`${STORAGE_KEY}_conversations`, JSON.stringify(conversations));
    localStorage.setItem(`${STORAGE_KEY}_personal`, JSON.stringify(personalMaterials));
    localStorage.setItem(`${STORAGE_KEY}_attempts`, JSON.stringify(practiceAttempts));
    localStorage.setItem(`${STORAGE_KEY}_canvas`, JSON.stringify(canvasRecords));
    localStorage.setItem(`${STORAGE_KEY}_misc`, JSON.stringify(misconceptions));
    localStorage.setItem(`${STORAGE_KEY}_gov`, JSON.stringify(governanceItems));
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [
    currentUser,
    courses,
    activeCourseId,
    materials,
    questionBanks,
    conversations,
    personalMaterials,
    practiceAttempts,
    canvasRecords,
    misconceptions,
    governanceItems,
    auditLogs
  ]);

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  const switchUser = (userId: string) => {
    const target = INITIAL_USERS.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      // If user is not enrolled in active course, switch to their first enrolled course
      if (!target.enrolledCourseIds.includes(activeCourseId) && target.enrolledCourseIds.length > 0) {
        setActiveCourseId(target.enrolledCourseIds[0]);
      }
    }
  };

  const simulateSSOLogin = (email?: string) => {
    setIsSSOLoading(true);
    setTimeout(() => {
      if (email) {
        const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        }
      }
      setIsSSOLoading(false);
    }, 600);
  };

  const simulateSignOut = () => {
    setCurrentUser(INITIAL_USERS[0]);
  };

  const addAuditLog = (action: string, target: string, details: string, complianceFlag?: string) => {
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      target,
      details,
      complianceFlag: complianceFlag || 'Academic Policy Compliant'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Material Actions
  const addMaterial = async (newMat: Partial<CourseMaterial>): Promise<void> => {
    const id = `mat-${Date.now()}`;
    const initialItem: CourseMaterial = {
      id,
      courseId: activeCourseId,
      title: newMat.title || 'Untitled Document',
      filename: newMat.filename || 'document.pdf',
      fileSize: newMat.fileSize || '2.4 MB',
      topic: newMat.topic || activeCourse.currentTopic,
      week: newMat.week || activeCourse.currentWeek,
      status: 'processing',
      statusMessage: 'Simulated text extraction & vector indexing in progress...',
      studentVisible: newMat.studentVisible ?? true,
      approvedForAI: false, // Default false until approved
      uploadedBy: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      uploadedAt: new Date().toISOString(),
      version: 1,
      extractedSectionsCount: 0,
      contentSnippet: newMat.contentSnippet || 'Analyzing document structure...'
    };

    setMaterials((prev) => [initialItem, ...prev]);

    // Simulate multi-stage processing
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setMaterials((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'approved',
              approvedForAI: true,
              extractedSectionsCount: Math.floor(Math.random() * 20) + 12,
              statusMessage: 'Document extracted into structured sections. Approved for AI scope.',
              contentSnippet:
                newMat.contentSnippet ||
                'Extracted structured lecture slides with definitions, code snippets, and review questions.'
            }
          : m
      )
    );

    // Update course approved source count
    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourseId
          ? {
              ...c,
              approvedSourcesCount: c.approvedSourcesCount + 1,
              aiReadinessStatus: 'ready'
            }
          : c
      )
    );

    addAuditLog(
      'Material Uploaded & Indexed',
      newMat.filename || 'document.pdf',
      `Uploaded to ${activeCourse.code} with status approved for AI`
    );
  };

  const updateMaterial = (id: string, updates: Partial<CourseMaterial>) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    addAuditLog('Material Updated', id, `Modified material metadata`);
  };

  const deleteMaterial = (id: string) => {
    const mat = materials.find((m) => m.id === id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (mat && mat.approvedForAI) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === mat.courseId ? { ...c, approvedSourcesCount: Math.max(0, c.approvedSourcesCount - 1) } : c
        )
      );
    }
    addAuditLog('Material Removed', mat?.title || id, `Deleted from course resources`);
  };

  const toggleApproveForAI = (id: string) => {
    // Only professor can approve official sources
    if (currentUser.role === 'ta' && !currentUser.delegatedPermissions?.canApproveOfficialSources) {
      alert('Permission Denied: Teaching Assistants require faculty approval to designate official AI course sources.');
      return;
    }

    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextVal = !m.approvedForAI;
          return {
            ...m,
            approvedForAI: nextVal,
            status: nextVal ? 'approved' : 'draft'
          };
        }
        return m;
      })
    );

    addAuditLog(
      'AI Approval Toggled',
      id,
      `Toggled official course AI groundability by ${currentUser.name}`
    );
  };

  // Question Bank Actions
  const addQuestionBank = (bank: Partial<QuestionBank>) => {
    const id = `qb-${Date.now()}`;
    const newBank: QuestionBank = {
      id,
      courseId: activeCourseId,
      title: bank.title || 'New Practice Question Bank',
      description: bank.description || 'Generated practice bank from approved course sources.',
      topic: bank.topic || activeCourse.currentTopic,
      status: 'draft',
      createdBy: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      createdAt: new Date().toISOString(),
      version: 1,
      isInstructorCurated: currentUser.role === 'professor',
      attemptsCount: 0,
      questions: bank.questions || []
    };

    setQuestionBanks((prev) => [newBank, ...prev]);
    addAuditLog(
      'Question Bank Created',
      newBank.title,
      `Created with ${newBank.questions.length} questions`
    );
  };

  const updateQuestionBank = (id: string, updates: Partial<QuestionBank>) => {
    setQuestionBanks((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestionBank = (id: string) => {
    setQuestionBanks((prev) => prev.filter((q) => q.id !== id));
    addAuditLog('Question Bank Deleted', id, `Removed question bank from course`);
  };

  const publishQuestionBank = (id: string): { success: boolean; message: string } => {
    // Check role authority
    if (currentUser.role === 'ta' && !currentUser.delegatedPermissions?.canPublishQuestionBanks) {
      return {
        success: false,
        message: 'Permission Restricted: TAs can draft and edit question banks, but only Professor David Miller can publish to students.'
      };
    }

    setQuestionBanks((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'published',
              publishedAt: new Date().toISOString(),
              publishedBy: currentUser.name
            }
          : q
      )
    );

    addAuditLog(
      'Question Bank Published',
      id,
      `Published to enrolled students by ${currentUser.name}`,
      'Faculty Academic Authority Verified'
    );

    return { success: true, message: 'Question bank published successfully to students!' };
  };

  const unpublishQuestionBank = (id: string) => {
    setQuestionBanks((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'draft', publishedAt: undefined } : q))
    );
    addAuditLog('Question Bank Unpublished', id, 'Returned to draft review status');
  };

  const regenerateQuestion = (bankId: string, questionId: string) => {
    setQuestionBanks((prev) =>
      prev.map((b) => {
        if (b.id !== bankId) return b;
        return {
          ...b,
          questions: b.questions.map((q) => {
            if (q.id !== questionId) return q;
            return {
              ...q,
              stem: `[Regenerated] ${q.stem.replace('[Regenerated] ', '')} (Focusing on Edge Cases & Invariants)`,
              explanation: `${q.explanation} Additionally, consider the race condition window when context switching occurs immediately after the comparison instruction.`
            };
          })
        };
      })
    );
  };

  // Grounded Q&A Assistant Actions
  const askGroundedQuestion = async (params: {
    question: string;
    courseId: string;
    includeWeb: boolean;
    materialScopeId?: string;
  }) => {
    const course = courses.find((c) => c.id === params.courseId) || activeCourse;

    // Check if course has approved sources
    if (course.approvedSourcesCount === 0) {
      const errorMsg = `The AI assistant is currently unavailable for ${course.code} because no instructor-approved materials have been approved for AI indexing. Course owners must approve official sources first before students can ask questions.`;
      const newThread: ConversationThread = {
        id: `conv-${Date.now()}`,
        courseId: params.courseId,
        userId: currentUser.id,
        title: params.question.slice(0, 45),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}-u`,
            sender: 'user',
            content: params.question,
            timestamp: new Date().toISOString(),
            sourceScopeUsed: params.includeWeb ? 'expanded_web' : 'course_only'
          },
          {
            id: `msg-${Date.now()}-a`,
            sender: 'assistant',
            content: errorMsg,
            timestamp: new Date().toISOString(),
            evidenceQuality: 'insufficient',
            evidenceSummary: '0 approved course sources available in this course.'
          }
        ]
      };
      setConversations((prev) => [newThread, ...prev]);
      setActiveConversationId(newThread.id);
      return;
    }

    const citations: SourceCitation[] = [
      {
        id: `cit-${Date.now()}-1`,
        sourceType: 'course',
        title: 'Lecture 4: Mutex Locks and Semaphores',
        location: 'Slide 14 (Mutual Exclusion Implementation)',
        excerpt:
          'pthread_mutex_lock acquires the mutex if available; if held by another thread, the calling thread blocks until released.',
        verifiedCourseApproved: true
      },
      {
        id: `cit-${Date.now()}-2`,
        sourceType: 'course',
        title: 'Textbook Ch. 6: Synchronization Tools',
        location: 'Section 6.4 (Hardware Support for Synchronization)',
        excerpt:
          'Modern architectures provide atomic hardware instructions such as test_and_set() and compare_and_swap() to construct spinlocks.',
        verifiedCourseApproved: true
      }
    ];

    if (params.includeWeb) {
      citations.push({
        id: `cit-${Date.now()}-web`,
        sourceType: 'web',
        title: 'POSIX 1003.1-2017 System Interfaces — pthread_mutex_lock Specification',
        location: 'The Open Group Base Specifications Issue 7 / IEEE Std 1003.1',
        excerpt:
          'If the mutex type is PTHREAD_MUTEX_ERRORCHECK, error checking is provided. If a thread attempts to relock a mutex without unlocking, it returns an error.',
        authorOrPublisher: 'IEEE & The Open Group',
        accessDate: 'Sept 6, 2026'
      });
    }

    let answerBody = '';
    const qLower = params.question.toLowerCase();

    if (qLower.includes('race condition') || qLower.includes('thread') || qLower.includes('counter')) {
      answerBody = `A **race condition** occurs when multiple threads concurrently access and manipulate shared data, and the final result depends on the specific order in which execution steps interleave.

### Key Conceptual Pillars from Course Materials:
1. **Critical Section Problem**: Any portion of code that accesses shared mutable state (like \`counter++\` or buffer pointers) is a critical section. To prevent race conditions, the solution must satisfy **Mutual Exclusion**, **Progress**, and **Bounded Waiting**.
2. **Instruction Decomposition**: As illustrated in **Lecture 4 (Slide 8)**, a statement like \`counter++\` translates to three atomic machine operations: \`LOAD\`, \`ADD\`, and \`STORE\`. Without synchronization, preemption between these steps causes lost updates.
3. **Hardware & Software Primitives**: Hardware provides atomic primitives (e.g. \`compare_and_swap\`), upon which OS mutexes and semaphores are built to protect critical regions.`;
    } else if (qLower.includes('deadlock') || qLower.includes('banker')) {
      answerBody = `In concurrent computing, a **deadlock** occurs when a set of threads is blocked because each thread is holding a resource and waiting for another resource acquired by some other thread in the same set.

### The Four Necessary Coffman Conditions:
- **Mutual Exclusion**: Resources cannot be simultaneously shared.
- **Hold and Wait**: Threads hold existing resources while requesting new ones.
- **No Preemption**: Resources cannot be forcibly confiscated.
- **Circular Wait**: A closed chain of threads exists where each waits for a resource held by the next.

**Remedy**: Banker's Algorithm dynamically ensures that granting a resource keeps the system in a safe state with a valid finish sequence.`;
    } else {
      answerBody = `Based on your course materials in **${course.name}**:

In thread synchronization, shared resources require coordinated access to maintain invariant consistency. When multiple concurrent entities read and write shared memory locations without serialization, race conditions emerge.

Review **Lecture 4** and **Textbook Chapter 6** for full mathematical proofs and POSIX examples of mutual exclusion locks.`;
    }

    if (params.includeWeb) {
      answerBody += `\n\n*(Web Expansion Note: External POSIX documentation was consulted to supplement course definitions with standard IEEE 1003.1 runtime return error codes. Note that external API versions should be validated against the Linux distribution used in our course VM).*`;
    }

    const newThread: ConversationThread = {
      id: `conv-${Date.now()}`,
      courseId: params.courseId,
      userId: currentUser.id,
      title: params.question.slice(0, 48),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          content: params.question,
          timestamp: new Date().toISOString(),
          sourceScopeUsed: params.includeWeb ? 'expanded_web' : 'course_only'
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          content: answerBody,
          timestamp: new Date().toISOString(),
          evidenceQuality: 'high',
          evidenceSummary: params.includeWeb
            ? 'Grounded in 2 official course sources + 1 secondary verified web specification.'
            : 'Grounded strictly in approved course lecture slides and textbook chapters.',
          citations,
          hasConflict: params.includeWeb ? false : false
        }
      ]
    };

    setConversations((prev) => [newThread, ...prev]);
    setActiveConversationId(newThread.id);
  };

  const rateAnswer = (convId: string, messageId: string, rating: 'helpful' | 'unhelpful') => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => (m.id === messageId ? { ...m, helpfulRating: rating } : m))
        };
      })
    );
  };

  const reportAnswer = (convId: string, messageId: string, reason: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId ? { ...m, reported: true, reportReason: reason } : m
          )
        };
      })
    );

    // Add to governance queue
    const newGov: GovernanceItem = {
      id: `gov-${Date.now()}`,
      courseId: activeCourseId,
      courseCode: activeCourse.code,
      type: 'reported_ai_answer',
      title: `Student Reported Answer: ${reason.slice(0, 45)}`,
      description: `Reported in conversation ${convId}. Reason: ${reason}`,
      reportedBy: `${currentUser.name} (${currentUser.email})`,
      reportedAt: new Date().toISOString(),
      status: 'unresolved'
    };
    setGovernanceItems((prev) => [newGov, ...prev]);
    addAuditLog('AI Answer Reported', convId, `Reason: ${reason}`, 'Governance Flag Raised');
  };

  // Private Study Workspace
  const addPersonalMaterial = (mat: Partial<PersonalStudyMaterial>) => {
    const newPersonal: PersonalStudyMaterial = {
      id: `pers-${Date.now()}`,
      studentId: currentUser.id,
      courseId: activeCourseId,
      title: mat.title || 'My Study Notes.md',
      filename: mat.filename || 'notes.md',
      uploadedAt: new Date().toISOString(),
      isAssignmentDraft: mat.isAssignmentDraft || false,
      assignmentName: mat.assignmentName,
      contentExcerpt: mat.contentExcerpt || 'Self-authored notes and draft thoughts.'
    };
    setPersonalMaterials((prev) => [newPersonal, ...prev]);
  };

  const deletePersonalMaterial = (id: string) => {
    setPersonalMaterials((prev) => prev.filter((p) => p.id !== id));
  };

  const askPrivateWorkspaceQuestion = async (params: {
    question: string;
    courseId: string;
    personalMaterialId?: string;
    isAssignmentWork: boolean;
    guidedHelpMode: 'explain' | 'socratic' | 'review_attempt' | 'next_steps';
  }) => {
    const personal = personalMaterials.find((p) => p.id === params.personalMaterialId);

    const citations: SourceCitation[] = [];
    if (personal) {
      citations.push({
        id: `cit-pers-${Date.now()}`,
        sourceType: 'personal',
        title: personal.title,
        location: 'Personal Note Section 1',
        excerpt: personal.contentExcerpt.slice(0, 140),
        verifiedCourseApproved: false
      });
    }

    // Always link course source as ground
    citations.push({
      id: `cit-course-${Date.now()}`,
      sourceType: 'course',
      title: 'Assignment 2 Handout: Bounded Buffer Producer-Consumer',
      location: 'Section 4 (Deadlock Prevention Guidelines)',
      excerpt: 'Ensure lock acquisition order is consistent between producer and consumer threads.',
      verifiedCourseApproved: true
    });

    let guidedAnswer = '';

    if (params.isAssignmentWork) {
      // SAFEGUARD: Guided-Help Mode strictly enforces no direct solution!
      if (params.guidedHelpMode === 'review_attempt') {
        guidedAnswer = `🛡️ **Guided-Help Mode Active (Assignment 2 Policy Enforced)**

I have inspected your draft attempt against course concurrency invariants.

### 1. Strengths in your current code:
- You correctly identified that \`empty\` and \`full\` semaphores should manage capacity signaling.
- Your circular buffer index calculation \`(in + 1) % N\` properly wraps around.

### 2. Critical Socratic Check — Lock Ordering:
Look closely at this sequence in your draft:
\`\`\`c
sem_wait(&empty);
pthread_mutex_lock(&mutex);
\`\`\`
**Consider this scenario:** What would happen if a programmer reversed these two lines to:
\`\`\`c
pthread_mutex_lock(&mutex);
sem_wait(&empty);
\`\`\`
If the buffer was completely full, which thread would be blocked while still holding the mutex? Would the consumer thread ever be able to enter and free up a slot?

*Hint: Remember Coffman's "Hold and Wait" condition! Walk through the invariant before compiling.*`;
      } else if (params.guidedHelpMode === 'socratic') {
        guidedAnswer = `🛡️ **Socratic Guided Inquiry:**

To help you resolve this conceptual barrier yourself without giving away the direct code implementation:

1. **What is the invariant condition** of the shared buffer counter when both producer and consumer are active?
2. If two producer threads execute concurrently, which specific line of code modifies shared state without serialization?
3. What is the difference between a condition where a thread waits for a slot vs. where it needs exclusive access to the memory pointers?`;
      } else {
        guidedAnswer = `🛡️ **Guided Conceptual Explanation:**

In bounded-buffer architectures, semaphores track resource availability (how many empty/full slots exist), whereas mutex locks guarantee mutual exclusion around the buffer data structure itself.

Always acquire the resource semaphore *first*, and only lock the mutex when you are ready to write to the physical memory.`;
      }
    } else {
      guidedAnswer = `In your private notes **"${personal?.title || 'Personal Workspace'}"**, you highlighted the relationship between thread synchronization and memory models. 

Grounded in **Lecture 4**, your understanding is solid. Review slide 18 for POSIX condition variables to complement this topic.`;
    }

    const thread: ConversationThread = {
      id: `conv-pers-${Date.now()}`,
      courseId: params.courseId,
      userId: currentUser.id,
      title: `[Private] ${params.question.slice(0, 36)}`,
      updatedAt: new Date().toISOString(),
      isPrivateWorkspace: true,
      associatedPersonalSourceId: params.personalMaterialId,
      activeAssignmentDeclared: params.isAssignmentWork,
      messages: [
        {
          id: `msg-${Date.now()}-u`,
          sender: 'user',
          content: params.question,
          timestamp: new Date().toISOString(),
          guidedHelpMode: params.guidedHelpMode,
          sourceScopeUsed: 'course_and_personal'
        },
        {
          id: `msg-${Date.now()}-a`,
          sender: 'assistant',
          content: guidedAnswer,
          timestamp: new Date().toISOString(),
          evidenceQuality: 'high',
          evidenceSummary:
            'Grounded in your private draft + Course Assignment 2 specifications (Guided-Help mode enabled).',
          citations
        }
      ]
    };

    setConversations((prev) => [thread, ...prev]);
    setActiveConversationId(thread.id);
  };

  // Practice Attempts
  const recordPracticeAttempt = (attempt: Omit<StudentPracticeAttempt, 'id' | 'completedAt'>) => {
    const newAttempt: StudentPracticeAttempt = {
      ...attempt,
      id: `att-${Date.now()}`,
      completedAt: new Date().toISOString()
    };
    setPracticeAttempts((prev) => [newAttempt, ...prev]);
  };

  // Canvas Participation Export
  const exportToCanvas = async (params: {
    courseId: string;
    activityTitle: string;
    questionsAttempted: number;
  }): Promise<{ success: boolean; record: CanvasExportRecord }> => {
    const course = courses.find((c) => c.id === params.courseId) || activeCourse;

    const newRecord: CanvasExportRecord = {
      id: `canv-${Date.now()}`,
      courseId: params.courseId,
      courseCode: course.code,
      studentId: currentUser.id,
      studentName: currentUser.name,
      activityTitle: params.activityTitle,
      attemptDate: new Date().toISOString(),
      questionsAttempted: params.questionsAttempted,
      status: 'synced',
      transmittedFields: {
        courseId: `${course.code}-${course.term}`,
        studentCanvasId: `VNU_${currentUser.id.toUpperCase()}`,
        activityType: 'Formative AI Practice Participation',
        completedDate: new Date().toISOString(),
        questionsAttemptedCount: params.questionsAttempted,
        completionStatus: 'Completed (Formative)',
        gradeIncluded: false,
        chatContentIncluded: false
      }
    };

    setCanvasRecords((prev) => [newRecord, ...prev]);
    addAuditLog(
      'Canvas Participation Exported',
      params.activityTitle,
      `Formative record synced for ${currentUser.name} in ${course.code}. Zero grade passback verified.`,
      'Canvas Privacy Protocol Compliant'
    );

    return { success: true, record: newRecord };
  };

  // Governance Actions
  const resolveGovernanceItem = (id: string) => {
    setGovernanceItems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: 'resolved' } : g))
    );
    addAuditLog('Governance Issue Resolved', id, `Marked resolved by ${currentUser.name}`);
  };

  const assignSupportOwner = (itemId: string, ownerName: string) => {
    setGovernanceItems((prev) =>
      prev.map((g) => (g.id === itemId ? { ...g, assignedSupportOwner: ownerName } : g))
    );
    addAuditLog('Support Assigned', itemId, `Assigned to ${ownerName}`);
  };

  // Quick Scenarios (from PRD Section 18)
  const loadScenario = (
    scenarioId: 'student_concurrency' | 'ta_question_bank' | 'prof_review' | 'admin_readiness'
  ) => {
    if (scenarioId === 'student_concurrency') {
      setCurrentUser(INITIAL_USERS[0]); // Linh Nguyen (Student)
      setActiveCourseId('course-comp2030');
      setActiveConversationId('conv-comp-1');
    } else if (scenarioId === 'ta_question_bank') {
      setCurrentUser(INITIAL_USERS[2]); // Alex Le (TA)
      setActiveCourseId('course-comp2030');
    } else if (scenarioId === 'prof_review') {
      setCurrentUser(INITIAL_USERS[1]); // Prof. David Miller
      setActiveCourseId('course-comp2030');
    } else if (scenarioId === 'admin_readiness') {
      setCurrentUser(INITIAL_USERS[3]); // Dr. Elena Rossi (Admin)
      setActiveCourseId('course-swe3020');
    }
  };

  // Reset Demo
  const resetDemoData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_user`);
    localStorage.removeItem(`${STORAGE_KEY}_courses`);
    localStorage.removeItem(`${STORAGE_KEY}_activeCourseId`);
    localStorage.removeItem(`${STORAGE_KEY}_materials`);
    localStorage.removeItem(`${STORAGE_KEY}_qbanks`);
    localStorage.removeItem(`${STORAGE_KEY}_conversations`);
    localStorage.removeItem(`${STORAGE_KEY}_personal`);
    localStorage.removeItem(`${STORAGE_KEY}_attempts`);
    localStorage.removeItem(`${STORAGE_KEY}_canvas`);
    localStorage.removeItem(`${STORAGE_KEY}_misc`);
    localStorage.removeItem(`${STORAGE_KEY}_gov`);
    localStorage.removeItem(`${STORAGE_KEY}_audit`);

    setCurrentUser(INITIAL_USERS[0]);
    setCourses(INITIAL_COURSES);
    setActiveCourseId('course-comp2030');
    setMaterials(INITIAL_MATERIALS);
    setQuestionBanks(INITIAL_QUESTION_BANKS);
    setConversations(INITIAL_CONVERSATIONS);
    setActiveConversationId('conv-comp-1');
    setPersonalMaterials(INITIAL_PERSONAL_MATERIALS);
    setPracticeAttempts([]);
    setCanvasRecords(INITIAL_CANVAS_RECORDS);
    setMisconceptions(INITIAL_MISCONCEPTIONS);
    setGovernanceItems(INITIAL_GOVERNANCE_ITEMS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActiveCitation(null);
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers: INITIAL_USERS,
        switchUser,
        simulateSSOLogin,
        simulateSignOut,
        isSSOLoading,
        activeCourse,
        courses,
        setActiveCourseId,
        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        toggleApproveForAI,
        questionBanks,
        addQuestionBank,
        updateQuestionBank,
        deleteQuestionBank,
        publishQuestionBank,
        unpublishQuestionBank,
        regenerateQuestion,
        conversations,
        activeConversation,
        setActiveConversationId,
        askGroundedQuestion,
        rateAnswer,
        reportAnswer,
        personalMaterials,
        addPersonalMaterial,
        deletePersonalMaterial,
        askPrivateWorkspaceQuestion,
        practiceAttempts,
        recordPracticeAttempt,
        canvasRecords,
        exportToCanvas,
        misconceptions,
        governanceItems,
        auditLogs,
        resolveGovernanceItem,
        assignSupportOwner,
        activeCitation,
        setActiveCitation,
        loadScenario,
        resetDemoData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
