import {
  UserPersona,
  CourseData,
  CourseMaterial,
  QuestionBank,
  StudentPracticeAttempt,
  MisconceptionInsight,
  CanvasExportRecord,
  AuditLogEntry,
  GovernanceItem,
  ConversationThread,
  PersonalStudyMaterial
} from './types';

export const INITIAL_USERS: UserPersona[] = [
  {
    id: 'user-student-1',
    name: 'Linh Nguyen',
    email: 'linh.nguyen@vinuni.edu.vn',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'College of Engineering & Computer Science',
    title: 'B.S. Computer Science, Year 3',
    enrolledCourseIds: ['course-comp2030', 'course-dsa2010', 'course-ai3010']
  },
  {
    id: 'user-prof-1',
    name: 'Prof. David Miller',
    email: 'david.miller@vinuni.edu.vn',
    role: 'professor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'CECS - Systems & Networks Group',
    title: 'Associate Professor & Course Lead',
    enrolledCourseIds: ['course-comp2030', 'course-swe3020']
  },
  {
    id: 'user-ta-1',
    name: 'Alex Le',
    email: 'alex.le@vinuni.edu.vn',
    role: 'ta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'CECS Graduate Teaching Fellows',
    title: 'Teaching Assistant (COMP2030)',
    enrolledCourseIds: ['course-comp2030'],
    delegatedPermissions: {
      canUploadDrafts: true,
      canGenerateQuestions: true,
      canPublishQuestionBanks: false, // delegated: CANNOT publish without professor approval
      canApproveOfficialSources: false, // CANNOT approve official sources
      canManageCanvas: false
    }
  },
  {
    id: 'user-admin-1',
    name: 'Dr. Elena Rossi',
    email: 'elena.rossi@vinuni.edu.vn',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'CECS Academic Dean Office',
    title: 'Vice Dean of Academic Affairs & Accreditation',
    enrolledCourseIds: ['course-comp2030', 'course-dsa2010', 'course-ai3010', 'course-swe3020']
  }
];

export const INITIAL_COURSES: CourseData[] = [
  {
    id: 'course-comp2030',
    code: 'COMP2030',
    name: 'Operating Systems & Concurrency',
    term: 'Fall 2026',
    instructorName: 'Prof. David Miller',
    instructorEmail: 'david.miller@vinuni.edu.vn',
    enrolledStudentsCount: 48,
    currentTopic: 'Thread Synchronization & Mutexes',
    currentWeek: 5,
    approvedSourcesCount: 5,
    aiReadinessStatus: 'ready',
    activeAssignmentPolicy: {
      assignmentName: 'Assignment 2: Multi-threaded Producer-Consumer Buffer',
      dueDate: 'Oct 24, 2026',
      guidedHelpOnly: true,
      directSolutionsBlocked: true
    }
  },
  {
    id: 'course-dsa2010',
    code: 'DSA2010',
    name: 'Data Structures & Algorithms',
    term: 'Fall 2026',
    instructorName: 'Prof. Ananya Sen',
    instructorEmail: 'ananya.sen@vinuni.edu.vn',
    enrolledStudentsCount: 56,
    currentTopic: 'Graph Algorithms & Shortest Path',
    currentWeek: 6,
    approvedSourcesCount: 6,
    aiReadinessStatus: 'ready'
  },
  {
    id: 'course-ai3010',
    code: 'AI3010',
    name: 'Machine Learning & Neural Networks',
    term: 'Fall 2026',
    instructorName: 'Dr. Hoang Vu',
    instructorEmail: 'hoang.vu@vinuni.edu.vn',
    enrolledStudentsCount: 42,
    currentTopic: 'Backpropagation & Gradient Descent',
    currentWeek: 4,
    approvedSourcesCount: 8,
    aiReadinessStatus: 'ready'
  },
  {
    id: 'course-swe3020',
    code: 'SWE3020',
    name: 'Software Architecture & Cloud Systems',
    term: 'Fall 2026',
    instructorName: 'Prof. David Miller',
    instructorEmail: 'david.miller@vinuni.edu.vn',
    enrolledStudentsCount: 38,
    currentTopic: 'Microservices & Event-Driven Patterns',
    currentWeek: 2,
    approvedSourcesCount: 0,
    aiReadinessStatus: 'needs_sources'
  }
];

export const INITIAL_MATERIALS: CourseMaterial[] = [
  {
    id: 'mat-comp-1',
    courseId: 'course-comp2030',
    title: 'Lecture 4: Mutex Locks and Semaphores',
    filename: 'COMP2030_Lec04_Mutex_Semaphores.pdf',
    fileSize: '4.2 MB',
    topic: 'Thread Synchronization & Mutexes',
    week: 4,
    status: 'approved',
    studentVisible: true,
    approvedForAI: true,
    uploadedBy: 'Prof. David Miller',
    uploadedAt: '2026-09-01T08:30:00Z',
    version: 2,
    extractedSectionsCount: 28,
    contentSnippet: 'Critical Section Problem requires three conditions: Mutual Exclusion, Progress, and Bounded Waiting. A race condition occurs when multiple threads concurrently execute read-modify-write instructions on shared memory without atomic synchronization.'
  },
  {
    id: 'mat-comp-2',
    courseId: 'course-comp2030',
    title: 'Textbook Ch. 6: Synchronization Tools (Silberschatz)',
    filename: 'OS_Concepts_Silberschatz_Ch06_Excerpt.pdf',
    fileSize: '7.8 MB',
    topic: 'Thread Synchronization & Mutexes',
    week: 4,
    status: 'approved',
    studentVisible: true,
    approvedForAI: true,
    uploadedBy: 'Prof. David Miller',
    uploadedAt: '2026-09-02T10:15:00Z',
    version: 1,
    extractedSectionsCount: 44,
    contentSnippet: 'Hardware instructions like Test-and-Set and Compare-and-Swap execute atomically. Higher-level synchronization primitives include mutex locks, counting semaphores, and condition variables.'
  },
  {
    id: 'mat-comp-3',
    courseId: 'course-comp2030',
    title: 'Lecture 5: Deadlocks & Banker\'s Algorithm',
    filename: 'COMP2030_Lec05_Deadlocks.pdf',
    fileSize: '3.9 MB',
    topic: 'Deadlocks',
    week: 5,
    status: 'approved',
    studentVisible: true,
    approvedForAI: true,
    uploadedBy: 'Prof. David Miller',
    uploadedAt: '2026-09-04T14:00:00Z',
    version: 1,
    extractedSectionsCount: 22,
    contentSnippet: 'Four Coffman conditions must hold simultaneously for a deadlock: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Banker\'s Algorithm safely evaluates allocation states before granting resource requests.'
  },
  {
    id: 'mat-comp-4',
    courseId: 'course-comp2030',
    title: 'Lab 3 Guide: POSIX Threads (pthreads) Synchronization',
    filename: 'COMP2030_Lab03_Pthreads_Guide.pdf',
    fileSize: '1.8 MB',
    topic: 'Thread Synchronization & Mutexes',
    week: 4,
    status: 'approved',
    studentVisible: true,
    approvedForAI: true,
    uploadedBy: 'Alex Le (TA)',
    uploadedAt: '2026-09-03T11:20:00Z',
    version: 1,
    extractedSectionsCount: 16,
    contentSnippet: 'Using pthread_mutex_lock(&mutex) and pthread_mutex_unlock(&mutex). Common pitfall: calling unlock without acquiring or double-locking on same thread causing recursive deadlock.'
  },
  {
    id: 'mat-comp-5',
    courseId: 'course-comp2030',
    title: 'Assignment 2 Handout: Bounded Buffer Producer-Consumer',
    filename: 'COMP2030_Assignment2_Specification.pdf',
    fileSize: '850 KB',
    topic: 'Thread Synchronization & Mutexes',
    week: 5,
    status: 'approved',
    studentVisible: true,
    approvedForAI: true,
    uploadedBy: 'Prof. David Miller',
    uploadedAt: '2026-09-05T09:00:00Z',
    version: 1,
    extractedSectionsCount: 12,
    contentSnippet: 'Implement circular buffer bounded_buffer_t with sem_t empty_slots, sem_t filled_slots, and pthread_mutex_t lock. Submissions are subject to guided-help academic integrity policy.'
  },
  {
    id: 'mat-comp-6',
    courseId: 'course-comp2030',
    title: 'Draft: Lecture 6 Virtual Memory & Paging',
    filename: 'COMP2030_Lec06_Virtual_Memory_DRAFT.pdf',
    fileSize: '5.1 MB',
    topic: 'Virtual Memory',
    week: 6,
    status: 'draft',
    studentVisible: false,
    approvedForAI: false,
    uploadedBy: 'Alex Le (TA)',
    uploadedAt: '2026-09-05T16:45:00Z',
    version: 1,
    extractedSectionsCount: 30,
    contentSnippet: 'Page tables map virtual page numbers (VPN) to physical page frames (PPN). Translation Lookaside Buffer (TLB) speeds up page address translation.'
  },
  {
    id: 'mat-comp-7',
    courseId: 'course-comp2030',
    title: 'Supplementary Code Examples Archive',
    filename: 'concurrency_samples_v2.tar.gz',
    fileSize: '14.2 MB',
    topic: 'Thread Synchronization & Mutexes',
    week: 4,
    status: 'warning',
    statusMessage: 'Partial extraction: 3 binary files skipped; 4 C source headers extracted.',
    studentVisible: true,
    approvedForAI: false,
    uploadedBy: 'Alex Le (TA)',
    uploadedAt: '2026-09-04T18:10:00Z',
    version: 1,
    extractedSectionsCount: 6,
    contentSnippet: 'Source code snippets demonstrating race condition on counter++ assembly instructions (mov, add, mov).'
  }
];

export const INITIAL_QUESTION_BANKS: QuestionBank[] = [
  {
    id: 'qb-comp-published',
    courseId: 'course-comp2030',
    title: 'Quiz 3: Concurrency Primitives & Critical Sections',
    description: 'Instructor-approved practice activity covering race conditions, mutual exclusion conditions, and semaphore vs mutex mechanics.',
    topic: 'Thread Synchronization & Mutexes',
    status: 'published',
    createdBy: 'Prof. David Miller',
    createdAt: '2026-09-03T10:00:00Z',
    publishedAt: '2026-09-04T08:00:00Z',
    publishedBy: 'Prof. David Miller',
    version: 2,
    isInstructorCurated: true,
    attemptsCount: 38,
    averageScorePct: 76,
    questions: [
      {
        id: 'q-sync-1',
        stem: 'Which of the following conditions is NOT one of the three requirements for a valid solution to the Critical Section Problem?',
        type: 'multiple_choice',
        options: [
          'Mutual Exclusion: No two processes execute in their critical sections simultaneously',
          'Progress: Only processes wishing to enter can participate in deciding who enters next',
          'Bounded Waiting: A bound exists on the number of times others can enter before a request is granted',
          'Strict Alternation: Processes must strictly alternate execution in round-robin order'
        ],
        correctAnswer: '3',
        explanation: 'Strict Alternation is NOT a requirement of the Critical Section Problem; in fact, strict alternation violates the Progress requirement because a process that does not want to enter the critical section can block another process that does.',
        difficulty: 'medium',
        topic: 'Thread Synchronization & Mutexes',
        citations: [
          {
            id: 'c-1',
            sourceType: 'course',
            title: 'Lecture 4: Mutex Locks and Semaphores',
            location: 'Slide 12 (Critical Section Criteria)',
            excerpt: 'Requirements for Critical-Section: 1. Mutual Exclusion 2. Progress 3. Bounded Waiting. Solutions cannot assume speed or number of CPUs.',
            verifiedCourseApproved: true
          }
        ]
      },
      {
        id: 'q-sync-2',
        stem: 'Why does the statement "counter++" lead to a race condition when shared between two un-synchronized threads?',
        type: 'multiple_choice',
        options: [
          'Because counter++ allocates heap memory dynamically on each iteration',
          'Because counter++ decomposes into three separate machine instructions (load, increment, store) that can be interleaved',
          'Because the CPU cache invalidates registers whenever a thread sleeps',
          'Because the compiler optimizes away integer variables in multi-core chips'
        ],
        correctAnswer: '1',
        explanation: 'At the assembly level, "counter++" is typically translated into three instructions: register = counter; register = register + 1; counter = register. A context switch between these instructions causes inconsistent shared memory states.',
        difficulty: 'medium',
        topic: 'Thread Synchronization & Mutexes',
        citations: [
          {
            id: 'c-2',
            sourceType: 'course',
            title: 'Lecture 4: Mutex Locks and Semaphores',
            location: 'Slide 8 (Race Condition Example)',
            excerpt: 'Interleaving of register = counter; register + 1; counter = register results in lost updates.',
            verifiedCourseApproved: true
          }
        ]
      },
      {
        id: 'q-sync-3',
        stem: 'True or False: A binary semaphore initialized to 1 behaves identically in all respects to a standard POSIX pthread mutex lock.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'False. A key conceptual difference is ownership: a mutex lock enforces ownership (only the thread that locked the mutex may unlock it). A binary semaphore can be signaled (sem_post) by a different thread, which is why semaphores are often used for signaling/synchronization across threads while mutexes are for mutual exclusion.',
        difficulty: 'hard',
        topic: 'Thread Synchronization & Mutexes',
        citations: [
          {
            id: 'c-3',
            sourceType: 'course',
            title: 'Textbook Ch. 6: Synchronization Tools',
            location: 'Section 6.6 (Semaphores vs Mutexes)',
            excerpt: 'Mutexes have ownership properties; semaphores have no thread ownership and support arbitrary signaling across thread contexts.',
            verifiedCourseApproved: true
          }
        ]
      },
      {
        id: 'q-sync-4',
        stem: 'Select all Coffman conditions that must hold simultaneously for a system deadlock to occur:',
        type: 'multiple_select',
        options: [
          'Mutual Exclusion: At least one resource must be held in a nonshareable mode',
          'Hold and Wait: A thread must hold at least one resource and wait to acquire additional resources held by others',
          'Preemption: The operating system can forcibly take resources away from any running thread at any time',
          'Circular Wait: A closed chain of threads exists such that each thread holds a resource needed by the next'
        ],
        correctAnswer: ['0', '1', '3'],
        explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, NO Preemption (resources cannot be forcibly confiscated), and Circular Wait. Preemption breaks the deadlock condition.',
        difficulty: 'medium',
        topic: 'Deadlocks',
        citations: [
          {
            id: 'c-4',
            sourceType: 'course',
            title: 'Lecture 5: Deadlocks & Banker\'s Algorithm',
            location: 'Slide 9 (The Four Coffman Conditions)',
            excerpt: 'Deadlock can arise if and only if Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait hold simultaneously.',
            verifiedCourseApproved: true
          }
        ]
      },
      {
        id: 'q-sync-5',
        stem: 'In the bounded buffer problem with capacity N, what initial value should the empty_slots semaphore have?',
        type: 'multiple_choice',
        options: [
          '0',
          '1',
          'N (the buffer capacity)',
          'N - 1'
        ],
        correctAnswer: '2',
        explanation: 'The empty_slots semaphore represents available free slots for producers to write to. Initially, the entire buffer of capacity N is empty, so empty_slots is initialized to N. The filled_slots semaphore is initialized to 0.',
        difficulty: 'easy',
        topic: 'Thread Synchronization & Mutexes',
        citations: [
          {
            id: 'c-5',
            sourceType: 'course',
            title: 'Assignment 2 Handout: Bounded Buffer Producer-Consumer',
            location: 'Page 3 (Semaphore Initialization Specs)',
            excerpt: 'sem_init(&empty_slots, 0, BUFFER_SIZE); sem_init(&filled_slots, 0, 0);',
            verifiedCourseApproved: true
          }
        ]
      }
    ]
  },
  {
    id: 'qb-comp-draft-ta',
    courseId: 'course-comp2030',
    title: 'Draft: Concurrency Invariants & Deadlock Avoidance (Prepared by TA Alex Le)',
    description: 'Draft question bank generated by TA Alex Le for Week 5 revision. Pending Professor David Miller\'s final approval and publication.',
    topic: 'Deadlocks',
    status: 'draft',
    createdBy: 'Alex Le (TA)',
    createdAt: '2026-09-05T14:30:00Z',
    version: 1,
    isInstructorCurated: false,
    attemptsCount: 0,
    questions: [
      {
        id: 'q-ta-1',
        stem: 'How does the Banker\'s Algorithm determine if granting a resource request leaves the system in a safe state?',
        type: 'multiple_choice',
        options: [
          'By verifying that the sum of currently available resources exceeds the maximum claimed by any single thread',
          'By finding at least one safe execution sequence where all threads can eventually finish given their remaining needs',
          'By terminating the thread with the largest memory consumption whenever resources become low',
          'By executing a dry-run thread context switch with watchdog timer verification'
        ],
        correctAnswer: '1',
        explanation: 'A system state is safe if there exists a safe sequence <T1, T2, ... Tn> such that for each Ti, the resources that Ti can still request can be satisfied by currently available resources plus resources held by all preceding threads.',
        difficulty: 'hard',
        topic: 'Deadlocks',
        citations: [
          {
            id: 'c-ta-1',
            sourceType: 'course',
            title: 'Lecture 5: Deadlocks & Banker\'s Algorithm',
            location: 'Slide 22 (Safety Algorithm Definition)',
            excerpt: 'State is safe if there exists a sequence of threads such that each thread can finish with currently available resources.',
            verifiedCourseApproved: true
          }
        ],
        validationWarnings: []
      },
      {
        id: 'q-ta-2',
        stem: 'Which technique prevents Circular Wait by imposing a total ordering on all resource acquisitions?',
        type: 'multiple_choice',
        options: [
          'Resource Ordering / Hierarchy Protocol',
          'Aging algorithm',
          'Peterson\'s Software Flag Algorithm',
          'Exponential Backoff Retry'
        ],
        correctAnswer: '0',
        explanation: 'By assigning an integer index F(R) to each resource type and enforcing that threads must request resources in strictly ascending order, cycles in the resource allocation graph become impossible.',
        difficulty: 'medium',
        topic: 'Deadlocks',
        citations: [
          {
            id: 'c-ta-2',
            sourceType: 'course',
            title: 'Lecture 5: Deadlocks & Banker\'s Algorithm',
            location: 'Slide 16 (Deadlock Prevention Strategies)',
            excerpt: 'To eliminate circular wait: define a linear ordering function F: R -> N and require threads to request in increasing order.',
            verifiedCourseApproved: true
          }
        ],
        validationWarnings: [
          'Review note: Ensure distractors do not confuse Peterson\'s algorithm with hardware ordering.'
        ]
      }
    ]
  }
];

export const INITIAL_MISCONCEPTIONS: MisconceptionInsight[] = [
  {
    id: 'misc-1',
    courseId: 'course-comp2030',
    topic: 'Thread Synchronization & Mutexes',
    conceptTitle: 'Confusing Mutex Locks with Binary Semaphores',
    misconceptionDescription: 'Students frequently treat binary semaphores and mutexes as interchangeable synonyms, overlooking the strict thread-ownership requirement of mutexes and signaling patterns.',
    affectedStudentsPct: 38,
    sampleSize: 42,
    evidenceQuotes: [
      'Over 38% answered incorrectly on Quiz 3 Question 3 regarding whether another thread can unlock a mutex.',
      '14 student Q&A inquiries asked: "Can my consumer thread signal a mutex locked by the producer?"'
    ],
    recommendedAction: 'Add a 5-minute live code demo comparing pthread_mutex_unlock error with sem_post in Lecture 5 recap.',
    severity: 'high'
  },
  {
    id: 'misc-2',
    courseId: 'course-comp2030',
    topic: 'Thread Synchronization & Mutexes',
    conceptTitle: 'Assuming Java/C "volatile" Guarantees Multi-Core Atomicity',
    misconceptionDescription: 'Students assume marking a shared counter as volatile makes counter++ thread-safe, confusing memory visibility with read-modify-write atomicity.',
    affectedStudentsPct: 29,
    sampleSize: 39,
    evidenceQuotes: [
      'Common inquiry in AI Chat: "If my variable is declared volatile, why does my race condition test still fail?"',
      'Lab 3 code reviews showed 11 submissions omitting mutex locks around volatile loop counters.'
    ],
    recommendedAction: 'Generate a targeted 3-question formative practice check emphasizing assembly decomposition of volatile variables.',
    severity: 'medium'
  },
  {
    id: 'misc-3',
    courseId: 'course-comp2030',
    topic: 'Deadlocks',
    conceptTitle: 'Confusing Deadlock Prevention with Deadlock Avoidance',
    misconceptionDescription: 'Students blur the distinction between static structural constraints (Deadlock Prevention by eliminating Coffman conditions) and runtime dynamic checks (Deadlock Avoidance via Banker\'s Algorithm).',
    affectedStudentsPct: 24,
    sampleSize: 35,
    evidenceQuotes: [
      'Practice attempts frequently misclassify resource hierarchy ordering as Banker\'s Algorithm.',
      'AI Assistant logged 9 queries regarding whether Banker\'s Algorithm prevents Hold and Wait.'
    ],
    recommendedAction: 'Publish a comparative summary chart highlighting static compile/design constraints vs dynamic runtime graph checks.',
    severity: 'low'
  }
];

export const INITIAL_CANVAS_RECORDS: CanvasExportRecord[] = [
  {
    id: 'canv-1',
    courseId: 'course-comp2030',
    courseCode: 'COMP2030',
    studentId: 'user-student-1',
    studentName: 'Linh Nguyen',
    activityTitle: 'Quiz 3: Concurrency Primitives & Critical Sections',
    attemptDate: '2026-09-05T15:20:00Z',
    questionsAttempted: 5,
    status: 'synced',
    transmittedFields: {
      courseId: 'COMP2030-Fall2026',
      studentCanvasId: 'VNU_STU_882910',
      activityType: 'Formative AI Practice Participation',
      completedDate: '2026-09-05T15:20:00Z',
      questionsAttemptedCount: 5,
      completionStatus: 'Completed',
      gradeIncluded: false,
      chatContentIncluded: false
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-1',
    timestamp: '2026-09-05T14:30:00Z',
    actorName: 'Alex Le',
    actorRole: 'ta',
    action: 'Question Bank Draft Created',
    target: 'Draft: Concurrency Invariants & Deadlock Avoidance',
    details: 'Generated 2 draft questions using Lecture 5 sources. Awaiting professor review.',
    complianceFlag: 'Delegated TA Workflow Compliant'
  },
  {
    id: 'audit-2',
    timestamp: '2026-09-04T08:00:00Z',
    actorName: 'Prof. David Miller',
    actorRole: 'professor',
    action: 'Question Bank Published',
    target: 'Quiz 3: Concurrency Primitives & Critical Sections',
    details: 'Approved and published formative practice activity to 48 enrolled students.',
    complianceFlag: 'Faculty Authority Verified'
  },
  {
    id: 'audit-3',
    timestamp: '2026-09-03T11:20:00Z',
    actorName: 'Alex Le',
    actorRole: 'ta',
    action: 'Material Uploaded (Draft/Review)',
    target: 'COMP2030_Lab03_Pthreads_Guide.pdf',
    details: 'Extracted 16 structured sections. Approved for AI use by Prof. David Miller.',
    complianceFlag: 'Source Integrity Checked'
  },
  {
    id: 'audit-4',
    timestamp: '2026-09-01T09:00:00Z',
    actorName: 'Dr. Elena Rossi',
    actorRole: 'admin',
    action: 'Integration Health Check',
    target: 'VinUni Microsoft SSO & Canvas Participation Gateway',
    details: 'Verified sandbox participation dispatch tokens and zero-grade passback policy enforcement.',
    complianceFlag: 'Privacy Policy AA-2026.1 Confirmed'
  }
];

export const INITIAL_GOVERNANCE_ITEMS: GovernanceItem[] = [
  {
    id: 'gov-1',
    courseId: 'course-swe3020',
    courseCode: 'SWE3020',
    type: 'unresolved_source_warning',
    title: 'Course AI Unavailable: Zero Approved Sources',
    description: 'SWE3020 has 38 enrolled students but 0 approved learning materials. Assistant remains disabled to protect course grounding.',
    reportedBy: 'System Readiness Monitor',
    reportedAt: '2026-09-05T02:00:00Z',
    status: 'unresolved',
    assignedSupportOwner: 'Dr. Elena Rossi'
  },
  {
    id: 'gov-2',
    courseId: 'course-comp2030',
    courseCode: 'COMP2030',
    type: 'reported_ai_answer',
    title: 'Student Hallucination Flag on Peterson\'s Solution',
    description: 'Student flagged an answer claiming Peterson\'s solution works natively on modern out-of-order x86 processors without memory barriers.',
    reportedBy: 'Student (ID: 99401)',
    reportedAt: '2026-09-04T16:30:00Z',
    status: 'in_review',
    assignedSupportOwner: 'Prof. David Miller'
  },
  {
    id: 'gov-3',
    courseId: 'course-comp2030',
    courseCode: 'COMP2030',
    type: 'failed_extraction',
    title: 'Binary Archive Parsing Warning',
    description: 'concurrency_samples_v2.tar.gz contained 3 unparseable binary executables (.o/.so).',
    reportedBy: 'Ingestion Worker #4',
    reportedAt: '2026-09-04T18:11:00Z',
    status: 'resolved',
    assignedSupportOwner: 'Alex Le (TA)'
  }
];

export const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv-comp-1',
    courseId: 'course-comp2030',
    userId: 'user-student-1',
    title: 'Why race conditions occur in thread synchronization',
    updatedAt: '2026-09-05T14:15:00Z',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'Why does a race condition occur when two threads update a shared counter simultaneously? Please explain with course lecture references.',
        timestamp: '2026-09-05T14:12:00Z',
        sourceScopeUsed: 'course_only'
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        content: `In multi-threaded programming, a **race condition** occurs when the final outcome of an operation depends on the relative timing or interleaving of multiple concurrent threads executing without proper synchronization.

### 1. The Underlying Cause: Non-Atomic Instructions
In high-level languages like C, incrementing a shared counter (\`counter++\`) appears to be a single operation. However, as explained in our course materials, the compiler decomposes this single statement into three distinct machine-level instructions:

1. \`LOAD\`: Fetch the current value of \`counter\` from main memory into a CPU register.
2. \`ADD\`: Increment the register value by 1.
3. \`STORE\`: Write the new value back from the register into the memory location for \`counter\`.

### 2. Concrete Interleaving Example
Suppose \`counter = 5\`:
- **Thread A** executes \`LOAD\` (Thread A register = 5).
- An OS timer interrupt occurs; the scheduler preempts Thread A and switches to **Thread B**.
- **Thread B** runs all three instructions: \`LOAD\` (5), \`ADD\` (6), and \`STORE\` (memory is now 6).
- The scheduler switches back to **Thread A**. Thread A resumes at \`ADD\` (using its saved register value 5 + 1 = 6) and executes \`STORE\` (overwriting memory with 6).

Even though both threads ran \`counter++\`, the final value is **6 instead of 7**. Thread B's update was lost because the read-modify-write sequence was not executed atomically.

### 3. Course-Approved Remedy
According to **Lecture 4**, this critical section must be guarded using hardware-supported atomic primitives or software mutex locks (such as \`pthread_mutex_lock(&lock)\` and \`pthread_mutex_unlock(&lock)\`) to ensure mutual exclusion.`,
        timestamp: '2026-09-05T14:12:18Z',
        evidenceQuality: 'high',
        evidenceSummary: 'Directly grounded in 2 course sources: Lecture 4 slides 8–10 and Textbook Chapter 6, Section 6.1.',
        helpfulRating: 'helpful',
        citations: [
          {
            id: 'cit-1',
            sourceType: 'course',
            title: 'Lecture 4: Mutex Locks and Semaphores',
            location: 'Slide 8 (Race Condition Mechanics)',
            excerpt: 'Interleaving of register = counter; register + 1; counter = register results in lost updates when preempted.',
            verifiedCourseApproved: true
          },
          {
            id: 'cit-2',
            sourceType: 'course',
            title: 'Textbook Ch. 6: Synchronization Tools',
            location: 'Section 6.1, Page 258 (The Critical Section Problem)',
            excerpt: 'A race condition arises where multiple threads manipulate shared data and the outcome depends on the particular order of execution.',
            verifiedCourseApproved: true
          }
        ]
      }
    ]
  }
];

export const INITIAL_PERSONAL_MATERIALS: PersonalStudyMaterial[] = [
  {
    id: 'pers-1',
    studentId: 'user-student-1',
    courseId: 'course-comp2030',
    title: 'My Lecture 4 Reading Notes & Questions.md',
    filename: 'Lecture4_MySummary_Linh.md',
    uploadedAt: '2026-09-04T19:00:00Z',
    isAssignmentDraft: false,
    contentExcerpt: 'Question I need to check: In Peterson\'s solution, why is turn = j set AFTER flag[i] = true? If turn was set first, could both threads get stuck waiting?'
  },
  {
    id: 'pers-2',
    studentId: 'user-student-1',
    courseId: 'course-comp2030',
    title: 'Assignment 2 Draft Attempt (Producer-Consumer).c',
    filename: 'producer_consumer_attempt1.c',
    uploadedAt: '2026-09-05T11:00:00Z',
    isAssignmentDraft: true,
    assignmentName: 'Assignment 2: Multi-threaded Producer-Consumer Buffer',
    contentExcerpt: 'void* producer(void* arg) { while(1) { sem_wait(&empty); pthread_mutex_lock(&mutex); buffer[in] = item; in = (in+1)%N; pthread_mutex_unlock(&mutex); sem_post(&full); } }'
  }
];
