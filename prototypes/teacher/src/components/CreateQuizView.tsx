import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  Send,
  RefreshCw,
  HelpCircle,
  Layers,
  FileText,
  CheckSquare,
  Square,
  Sliders,
  Check,
  AlertCircle,
  UploadCloud,
  FileUp,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  bloom: string;
  slideRef: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

export interface SlideOption {
  id: string;
  name: string;
  title?: string;
  pageCount?: number;
}

export interface ChapterOption {
  id: string;
  title: string;
  slides: SlideOption[];
}

interface CreateQuizViewProps {
  courseCode: string;
  courseName: string;
  chapterTitle: string;
  availableSlides: SlideOption[];
  allChapters?: ChapterOption[];
  isComprehensiveDefault?: boolean;
  onBack: () => void;
  onPublishQuiz: (quizData: {
    title: string;
    count: number;
    selectedSlides: string[];
    isComprehensive?: boolean;
    targetChapterTitles?: string[];
  }) => void;
}

export const CreateQuizView: React.FC<CreateQuizViewProps> = ({
  courseCode,
  chapterTitle,
  availableSlides,
  allChapters = [],
  isComprehensiveDefault = false,
  onBack,
  onPublishQuiz,
}) => {
  // Mode: Comprehensive multi-chapter quiz vs Single-chapter quiz
  const isComprehensiveMode = isComprehensiveDefault;

  // Creation method: 'ai-slide' (AI sinh từ slide) | 'upload-bank' (Tải lên file đề thi PDF)
  const [creationMethod, setCreationMethod] = useState<'ai-slide' | 'upload-bank'>('ai-slide');

  // Multi-chapter selection for comprehensive quiz
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(() => {
    if (isComprehensiveDefault && allChapters.length > 0) {
      return allChapters.map((c) => c.id);
    }
    return [];
  });

  // Multi-slide selection: stores all selected slide IDs
  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>(() => {
    if (isComprehensiveDefault && allChapters.length > 0) {
      return allChapters.flatMap((c) => c.slides.map((s) => s.id));
    }
    return availableSlides.map((s) => s.id);
  });

  const [quizTitle, setQuizTitle] = useState<string>(() => {
    if (isComprehensiveDefault) {
      return `Quiz tổng hợp kiến thức liên chương (${courseCode})`;
    }
    return `Quiz: ${chapterTitle} (${courseCode})`;
  });

  // Question count decided by teacher: default 10, max 100
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Bloom Taxonomy distribution inputs by teacher (%)
  const [bloomRemember, setBloomRemember] = useState<number>(40);
  const [bloomUnderstand, setBloomUnderstand] = useState<number>(40);
  const [bloomApply, setBloomApply] = useState<number>(20);

  const [isGenerating, setIsGenerating] = useState(false);

  // Exam PDF Upload state
  const examInputRef = useRef<HTMLInputElement>(null);
  const [uploadedExamFile, setUploadedExamFile] = useState<{
    name: string;
    size: string;
    fileObject?: File;
  } | null>(null);
  const [isExtractingExam, setIsExtractingExam] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStatusText, setExtractStatusText] = useState('');
  const [isDragOverExam, setIsDragOverExam] = useState(false);

  // Detect topic from chapter title or slides
  const lowerTitle = chapterTitle.toLowerCase();
  const isTriangleTopic = lowerTitle.includes('tam giác') || lowerTitle.includes('góc');
  const isRadicalTopic = lowerTitle.includes('căn bậc') || lowerTitle.includes('biến đổi');

  const totalBloom = Number(bloomRemember || 0) + Number(bloomUnderstand || 0) + Number(bloomApply || 0);

  // Toggle chapter in comprehensive quiz
  const handleToggleChapter = (chapterId: string) => {
    const chapter = allChapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    const chapterSlideIds = chapter.slides.map((s) => s.id);
    const isCurrentlySelected = selectedChapterIds.includes(chapterId);

    if (isCurrentlySelected) {
      if (selectedChapterIds.length <= 1) {
        alert('Bài quiz tổng hợp cần ít nhất 1 chương học.');
        return;
      }
      setSelectedChapterIds((prev) => prev.filter((id) => id !== chapterId));
      setSelectedSlideIds((prev) => prev.filter((id) => !chapterSlideIds.includes(id)));
    } else {
      setSelectedChapterIds((prev) => [...prev, chapterId]);
      setSelectedSlideIds((prev) => Array.from(new Set([...prev, ...chapterSlideIds])));
    }
  };

  // Toggle single slide in comprehensive quiz
  const handleToggleSlideInChapter = (slideId: string, chapterId: string) => {
    const isCurrentlySelected = selectedSlideIds.includes(slideId);

    if (isCurrentlySelected) {
      if (selectedSlideIds.length <= 1) {
        alert('Cần chọn ít nhất 1 slide làm ngữ cảnh để AI trích xuất câu hỏi.');
        return;
      }
      const updatedSlides = selectedSlideIds.filter((id) => id !== slideId);
      setSelectedSlideIds(updatedSlides);

      // If no slides in this chapter are selected anymore, remove chapter
      const chapter = allChapters.find((c) => c.id === chapterId);
      if (chapter && !chapter.slides.some((s) => updatedSlides.includes(s.id))) {
        setSelectedChapterIds((prev) => prev.filter((id) => id !== chapterId));
      }
    } else {
      setSelectedSlideIds((prev) => [...prev, slideId]);
      if (!selectedChapterIds.includes(chapterId)) {
        setSelectedChapterIds((prev) => [...prev, chapterId]);
      }
    }
  };

  // Toggle select all slides in single-chapter mode
  const handleToggleSelectAll = () => {
    if (selectedSlideIds.length === availableSlides.length) {
      if (availableSlides.length > 0) {
        setSelectedSlideIds([availableSlides[0].id]);
      }
    } else {
      setSelectedSlideIds(availableSlides.map((s) => s.id));
    }
  };

  // Toggle single slide in single-chapter mode
  const handleToggleSingleSlide = (slideId: string) => {
    const isCurrentlySelected = selectedSlideIds.includes(slideId);
    if (isCurrentlySelected) {
      if (selectedSlideIds.length <= 1) {
        alert('Cần chọn ít nhất 1 slide làm ngữ cảnh để AI trích xuất câu hỏi.');
        return;
      }
      setSelectedSlideIds((prev) => prev.filter((id) => id !== slideId));
    } else {
      setSelectedSlideIds((prev) => [...prev, slideId]);
    }
  };

  // Toggle all chapters in comprehensive quiz
  const handleSelectAllChapters = () => {
    if (allChapters.length === 0) return;
    setSelectedChapterIds(allChapters.map((c) => c.id));
    setSelectedSlideIds(allChapters.flatMap((c) => c.slides.map((s) => s.id)));
  };

  const handleDeselectAllChapters = () => {
    if (allChapters.length === 0) return;
    const firstCh = allChapters[0];
    setSelectedChapterIds([firstCh.id]);
    setSelectedSlideIds(firstCh.slides.map((s) => s.id));
  };

  // Preset Bloom handlers
  const applyBloomPreset = (remember: number, understand: number, apply: number) => {
    setBloomRemember(remember);
    setBloomUnderstand(understand);
    setBloomApply(apply);
  };

  // Question Banks
  const triangleQuestionBank: Question[] = [
    {
      id: 1,
      text: 'Định lý: Tổng ba góc của một tam giác bất kỳ luôn bằng:',
      bloom: 'Nhận biết',
      slideRef: 'Chương 3: Tổng 3 góc trong 1 tam giác • Slide 1',
      options: [
        { key: 'A', text: '90°' },
        { key: 'B', text: '180°' },
        { key: 'C', text: '360°' },
        { key: 'D', text: '270°' },
      ],
      correctKey: 'B',
      explanation: 'Theo định lý cơ bản hình học: Trong mọi tam giác, tổng số đo ba góc trong luôn bằng 180°.',
    },
    {
      id: 2,
      text: 'Cho tam giác ABC có góc A = 60° và góc B = 75°. Số đo của góc C là:',
      bloom: 'Thông hiểu',
      slideRef: 'Chương 3: Tổng 3 góc trong 1 tam giác • Slide 2',
      options: [
        { key: 'A', text: '45°' },
        { key: 'B', text: '55°' },
        { key: 'C', text: '65°' },
        { key: 'D', text: '35°' },
      ],
      correctKey: 'A',
      explanation: 'Số đo góc C = 180° - (góc A + góc B) = 180° - (60° + 75°) = 180° - 135° = 45°.',
    },
    {
      id: 3,
      text: 'Trong một tam giác vuông, hai góc nhọn có mối quan hệ gì?',
      bloom: 'Nhận biết',
      slideRef: 'Chương 3: Tổng 3 góc trong 1 tam giác • Slide 2',
      options: [
        { key: 'A', text: 'Bằng nhau' },
        { key: 'B', text: 'Bù nhau (tổng bằng 180°)' },
        { key: 'C', text: 'Phụ nhau (tổng bằng 90°)' },
        { key: 'D', text: 'Kề bù nhau' },
      ],
      correctKey: 'C',
      explanation: 'Vì tam giác vuông có 1 góc bằng 90°, nên tổng hai góc nhọn còn lại = 180° - 90° = 90° (hai góc phụ nhau).',
    },
    {
      id: 4,
      text: 'Khẳng định nào sau đây về "Góc ngoài của tam giác" là ĐÚNG?',
      bloom: 'Thông hiểu',
      slideRef: 'Chương 3: Tổng 3 góc trong 1 tam giác • Slide 3',
      options: [
        { key: 'A', text: 'Mỗi góc ngoài của tam giác bằng tổng của hai góc trong không kề với nó' },
        { key: 'B', text: 'Mỗi góc ngoài luôn nhỏ hơn góc trong kề với nó' },
        { key: 'C', text: 'Tổng ba góc ngoài của tam giác bằng 180°' },
        { key: 'D', text: 'Góc ngoài kề bù với hai góc trong còn lại' },
      ],
      correctKey: 'A',
      explanation: 'Định lý góc ngoài: Số đo mỗi góc ngoài của tam giác bằng tổng hai góc trong không kề với nó.',
    },
    {
      id: 5,
      text: 'Cho tam giác MNP có góc M : góc N : góc P = 1 : 2 : 3. Số đo ba góc M, N, P lần lượt là:',
      bloom: 'Vận dụng',
      slideRef: 'Chương 3: Tổng 3 góc trong 1 tam giác • Slide 3',
      options: [
        { key: 'A', text: '30°, 60°, 90°' },
        { key: 'B', text: '20°, 40°, 120°' },
        { key: 'C', text: '40°, 60°, 80°' },
        { key: 'D', text: '15°, 30°, 135°' },
      ],
      correctKey: 'A',
      explanation: 'Gọi số đo các góc là x, 2x, 3x. Ta có x + 2x + 3x = 180° ⇒ 6x = 180° ⇒ x = 30°. Vậy 3 góc là 30°, 60°, 90°.',
    },
  ];

  const radicalQuestionBank: Question[] = [
    {
      id: 6,
      text: 'Điều kiện xác định của biểu thức √(3x - 6) là gì?',
      bloom: 'Nhận biết',
      slideRef: 'Chương 4: Biến đổi căn bậc hai • Slide 2',
      options: [
        { key: 'A', text: 'x ≥ 2' },
        { key: 'B', text: 'x > 2' },
        { key: 'C', text: 'x ≤ 2' },
        { key: 'D', text: 'x ≠ 2' },
      ],
      correctKey: 'A',
      explanation: 'Biểu thức √A xác định khi A ≥ 0, tức là 3x - 6 ≥ 0 ⇔ 3x ≥ 6 ⇔ x ≥ 2.',
    },
    {
      id: 7,
      text: 'Rút gọn biểu thức √( (√5 - 3)² ) ta được kết quả là:',
      bloom: 'Thông hiểu',
      slideRef: 'Chương 4: Biến đổi căn bậc hai • Slide 2',
      options: [
        { key: 'A', text: '√5 - 3' },
        { key: 'B', text: '3 - √5' },
        { key: 'C', text: '3 + √5' },
        { key: 'D', text: '-3 - √5' },
      ],
      correctKey: 'B',
      explanation: '√( (√5 - 3)² ) = |√5 - 3|. Vì √5 ≈ 2.236 < 3 nên √5 - 3 < 0, do đó |√5 - 3| = 3 - √5.',
    },
    {
      id: 8,
      text: 'Đưa thừa số vào trong dấu căn của biểu thức -3√2 ta được:',
      bloom: 'Thông hiểu',
      slideRef: 'Chương 4: Biến đổi căn bậc hai • Slide 3',
      options: [
        { key: 'A', text: '√18' },
        { key: 'B', text: '-√18' },
        { key: 'C', text: '√(-18)' },
        { key: 'D', text: '-√6' },
      ],
      correctKey: 'B',
      explanation: 'Với A < 0 và B ≥ 0 thì A√B = -√(A² · B). Do đó -3√2 = -√(3² · 2) = -√18.',
    },
    {
      id: 9,
      text: 'Trục căn thức ở mẫu của biểu thức 2 / (√3 - 1) ta được kết quả rút gọn là:',
      bloom: 'Vận dụng',
      slideRef: 'Chương 4: Biến đổi căn bậc hai • Slide 4',
      options: [
        { key: 'A', text: '√3 - 1' },
        { key: 'B', text: '2(√3 + 1)' },
        { key: 'C', text: '√3 + 1' },
        { key: 'D', text: '(√3 + 1) / 2' },
      ],
      correctKey: 'C',
      explanation: 'Nhân cả tử và mẫu với (√3 + 1): [2 · (√3 + 1)] / (3 - 1) = √3 + 1.',
    },
    {
      id: 10,
      text: 'Rút gọn biểu thức P = √20 - √45 + 3√5 ta được:',
      bloom: 'Thông hiểu',
      slideRef: 'Chương 4: Biến đổi căn bậc hai • Slide 3',
      options: [
        { key: 'A', text: '2√5' },
        { key: 'B', text: '3√5' },
        { key: 'C', text: '4√5' },
        { key: 'D', text: '5√5' },
      ],
      correctKey: 'A',
      explanation: '√20 = 2√5; √45 = 3√5. Do đó P = 2√5 - 3√5 + 3√5 = 2√5.',
    },
  ];

  // Bank 1: Chương 1 - Giới thiệu AI & Khung tác tử PEAS
  const chapter1AiBank: Question[] = [
    {
      id: 101,
      text: 'Bốn thành phần của khung cấu trúc tác tử PEAS gồm những gì?',
      bloom: 'Nhận biết',
      slideRef: `${chapterTitle} • Slide AI(1).pdf (Trang 5)`,
      options: [
        { key: 'A', text: 'Performance, Environment, Actuators, Sensors' },
        { key: 'B', text: 'Program, Entity, Action, State' },
        { key: 'C', text: 'Perception, Emotion, Adaptation, System' },
        { key: 'D', text: 'Probability, Expectation, Accuracy, Speed' },
      ],
      correctKey: 'A',
      explanation: 'PEAS là viết tắt của Performance Measure, Environment, Actuators, Sensors.',
    },
    {
      id: 102,
      text: 'Sự khác biệt cốt lõi giữa Simple Reflex Agent và Goal-based Agent là gì?',
      bloom: 'Thông hiểu',
      slideRef: `${chapterTitle} • Slide AI(1).pdf (Trang 12)`,
      options: [
        { key: 'A', text: 'Reflex Agent chỉ phản ứng theo luật Condition-Action, Goal-based đánh giá dựa trên trạng thái đích' },
        { key: 'B', text: 'Reflex Agent có bộ nhớ lưu lại toàn bộ lịch sử' },
        { key: 'C', text: 'Goal-based Agent không có cảm biến nhận thức' },
        { key: 'D', text: 'Hai tác tử này hoàn toàn tương đương nhau về logic' },
      ],
      correctKey: 'A',
      explanation: 'Reflex Agent hành động tức thì theo luật IF...THEN, còn Goal-based Agent kết hợp trạng thái với mục tiêu cần đạt.',
    },
    {
      id: 103,
      text: 'Một tác tử được định nghĩa là Rational Agent (Tác tử duy lý) khi nào?',
      bloom: 'Thông hiểu',
      slideRef: `${chapterTitle} • Slide AI(1).pdf (Trang 16)`,
      options: [
        { key: 'A', text: 'Tác tử hành động nhằm tối đa hóa thước đo hiệu năng kỳ vọng dựa trên chuỗi tri giác và tri thức tích lũy' },
        { key: 'B', text: 'Tác tử luôn đưa ra quyết định giống 100% con người' },
        { key: 'C', text: 'Tác tử không bao giờ mắc bất kỳ sai sót nào trong tương lai' },
        { key: 'D', text: 'Tác tử có tốc độ xử lý phần cứng nhanh nhất' },
      ],
      correctKey: 'A',
      explanation: 'Tính duy lý trong AI được định nghĩa là tối đa hóa hiệu năng kỳ vọng dựa trên chuỗi tri giác và tri thức đã tích lũy.',
    },
    {
      id: 104,
      text: 'Phép thử Turing (Turing Test) do Alan Turing đề xuất nhằm mục đích gì?',
      bloom: 'Nhận biết',
      slideRef: `${chapterTitle} • Slide AI(1).pdf (Trang 8)`,
      options: [
        { key: 'A', text: 'Đánh giá khả năng một cỗ máy thể hiện hành vi thông minh tương đương con người' },
        { key: 'B', text: 'Kiểm tra tốc độ tính toán phần cứng máy tính' },
        { key: 'C', text: 'Xác thực độ an toàn mật mã của mạng nơ-ron' },
        { key: 'D', text: 'Đo lường dung lượng bộ nhớ RAM của hệ thống' },
      ],
      correctKey: 'A',
      explanation: 'Phép thử Turing kiểm tra xem người thẩm vấn có phân biệt được câu trả lời giữa máy tính và con người qua giao tiếp văn bản hay không.',
    },
    {
      id: 105,
      text: 'Môi trường chơi cờ Vua (Chess) thuộc loại môi trường nào theo phân loại tác tử AI?',
      bloom: 'Vận dụng',
      slideRef: `${chapterTitle} • Slide AI(1).pdf (Trang 21)`,
      options: [
        { key: 'A', text: 'Fully observable, Deterministic, Static, Discrete' },
        { key: 'B', text: 'Partially observable, Stochastic, Dynamic, Continuous' },
        { key: 'C', text: 'Fully observable, Stochastic, Dynamic, Discrete' },
        { key: 'D', text: 'Partially observable, Deterministic, Static, Continuous' },
      ],
      correctKey: 'A',
      explanation: 'Cờ vua là quan sát toàn phần (thấy hết bàn cờ), đơn định (không có xúc xắc), tĩnh (bàn cờ không đổi khi suy nghĩ), và rời rạc.',
    },
  ];

  // Bank 2: Chương 2 - Thuật toán tìm kiếm mù (BFS, DFS, UCS, IDS)
  const chapter2SearchBank: Question[] = [
    {
      id: 201,
      text: 'Trong các thuật toán tìm kiếm mù (Uninformed Search), thuật toán nào đảm bảo tìm ra nghiệm tối ưu khi chi phí mỗi bước đi bằng nhau?',
      bloom: 'Thông hiểu',
      slideRef: `${chapterTitle} • Slide AI(2).pdf (Trang 8)`,
      options: [
        { key: 'A', text: 'Depth-First Search (DFS)' },
        { key: 'B', text: 'Breadth-First Search (BFS)' },
        { key: 'C', text: 'Depth-Limited Search (DLS)' },
        { key: 'D', text: 'Iterative Deepening Search' },
      ],
      correctKey: 'B',
      explanation: 'BFS duyệt theo từng tầng nên nghiệm tìm thấy đầu tiên luôn có độ sâu nhỏ nhất, tối ưu khi chi phí bước đồng nhất.',
    },
    {
      id: 202,
      text: 'Độ phức tạp không gian của thuật toán DFS với hệ số rẽ nhánh b và độ sâu tối đa m là:',
      bloom: 'Nhận biết',
      slideRef: `${chapterTitle} • Slide AI(2).pdf (Trang 14)`,
      options: [
        { key: 'A', text: 'O(b^m)' },
        { key: 'B', text: 'O(b * m)' },
        { key: 'C', text: 'O(m^b)' },
        { key: 'D', text: 'O(b + m)' },
      ],
      correctKey: 'B',
      explanation: 'DFS chỉ cần lưu vết một đường đi từ gốc đến nút hiện tại, bộ nhớ là tuyến tính O(bm).',
    },
    {
      id: 203,
      text: 'Uniform Cost Search (UCS) sử dụng cấu trúc dữ liệu nào cho danh sách hàng đợi biên (Frontier)?',
      bloom: 'Thông hiểu',
      slideRef: `${chapterTitle} • Slide AI(2).pdf (Trang 19)`,
      options: [
        { key: 'A', text: 'Ngăn xếp (Stack - LIFO)' },
        { key: 'B', text: 'Hàng đợi thông thường (Queue - FIFO)' },
        { key: 'C', text: 'Hàng đợi ưu tiên (Priority Queue theo chi phí g(n))' },
        { key: 'D', text: 'Cây nhị phân tìm kiếm' },
      ],
      correctKey: 'C',
      explanation: 'UCS luôn mở rộng nút có chi phí đường đi g(n) nhỏ nhất, nên dùng Priority Queue.',
    },
    {
      id: 204,
      text: 'Thuật toán Iterative Deepening Search (IDS) kết hợp ưu điểm nổi bật nào?',
      bloom: 'Thông hiểu',
      slideRef: `${chapterTitle} • Slide AI(2).pdf (Trang 24)`,
      options: [
        { key: 'A', text: 'Tiết kiệm không gian bộ nhớ của DFS và tính tối ưu/hoàn chỉnh của BFS' },
        { key: 'B', text: 'Tốc độ nhanh của Greedy Search và tính chính xác của A*' },
        { key: 'C', text: 'Tìm kiếm hai chiều và chi phí đồng nhất' },
        { key: 'D', text: 'Không gian tuyến tính của BFS và thời gian hằng số của DFS' },
      ],
      correctKey: 'A',
      explanation: 'IDS duyệt DFS nhiều lần với độ sâu tăng dần, đạt được tính hoàn chỉnh và tối ưu như BFS nhưng chỉ tốn bộ nhớ O(bd) như DFS.',
    },
    {
      id: 205,
      text: 'Trong đồ thị trạng thái có chu trình, cơ chế nào giúp Graph Search tránh rơi vào lặp vô hạn so với Tree Search?',
      bloom: 'Vận dụng',
      slideRef: `${chapterTitle} • Slide AI(2).pdf (Trang 29)`,
      options: [
        { key: 'A', text: 'Sử dụng Explored Set (tập đã đóng) để ghi nhớ các trạng thái đã mở rộng' },
        { key: 'B', text: 'Sử dụng hàm Heuristic ước lượng khoảng cách' },
        { key: 'C', text: 'Tăng hệ số rẽ nhánh b lên vô hạn' },
        { key: 'D', text: 'Đảo ngược chiều duyệt từ đích về gốc' },
      ],
      correctKey: 'A',
      explanation: 'Explored Set lưu trữ mọi trạng thái đã duyệt; nếu trạng thái mới sinh ra đã có trong tập này thì sẽ không duyệt lại, ngăn chặn lặp chu trình.',
    },
  ];

  // Combine banks for comprehensive quiz (Tổng hợp liên chương)
  const comprehensiveBank: Question[] = [
    ...chapter1AiBank.map((q) => ({ ...q, slideRef: 'Chương 1: Giới thiệu AI • Slide AI(1).pdf' })),
    ...chapter2SearchBank.map((q) => ({ ...q, slideRef: 'Chương 2: Tìm kiếm mù • Slide AI(2).pdf' })),
    ...triangleQuestionBank,
    ...radicalQuestionBank,
  ];

  const currentTopicBank = isComprehensiveMode
    ? comprehensiveBank
    : isTriangleTopic
    ? triangleQuestionBank
    : isRadicalTopic
    ? radicalQuestionBank
    : lowerTitle.includes('tìm kiếm') || lowerTitle.includes('2')
    ? chapter2SearchBank
    : chapter1AiBank;

  // Initialize questions
  const [questions, setQuestions] = useState<Question[]>(() => {
    return currentTopicBank.slice(0, 10);
  });

  // Action 1: CHỐT CẤU HÌNH VÀ BẮT ĐẦU TẠO CÂU HỎI
  const handleConfirmConfigAndGenerate = () => {
    if (questionCount < 1 || questionCount > 100) {
      alert('Số lượng câu hỏi phải nằm trong khoảng từ 1 đến 100.');
      return;
    }

    if (isComprehensiveMode && selectedChapterIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 chương học vào bài quiz tổng hợp.');
      return;
    }

    if (selectedSlideIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 slide làm ngữ cảnh để AI trích xuất câu hỏi.');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const targetCount = questionCount;
      const countRemember = Math.round((bloomRemember / 100) * targetCount);
      const countUnderstand = Math.round((bloomUnderstand / 100) * targetCount);

      const generated: Question[] = [];

      for (let i = 0; i < targetCount; i++) {
        const baseIndex = i % currentTopicBank.length;
        const template = currentTopicBank[baseIndex];

        let bloomLevel = 'Thông hiểu';
        if (i < countRemember) {
          bloomLevel = 'Nhận biết';
        } else if (i < countRemember + countUnderstand) {
          bloomLevel = 'Thông hiểu';
        } else {
          bloomLevel = 'Vận dụng';
        }

        generated.push({
          ...template,
          id: i + 1,
          bloom: bloomLevel,
          text:
            i < currentTopicBank.length
              ? template.text
              : `[Câu hỏi mở rộng ${i + 1}]: ${template.text}`,
        });
      }

      setQuestions(generated);
      setIsGenerating(false);

      const el = document.getElementById('questions-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 900);
  };

  // Action 2: UPLOAD FILE NGÂN HÀNG ĐỀ THI (PDF) VÀ BÓC TÁCH CÂU HỎI
  const handleExamFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setUploadedExamFile({
      name: file.name,
      size: sizeMb,
      fileObject: file,
    });
    if (e.target) e.target.value = '';
  };

  const handleStartExtractExam = () => {
    if (!uploadedExamFile) {
      alert('Vui lòng chọn 1 file đề thi PDF từ máy tính.');
      return;
    }

    setIsExtractingExam(true);
    setExtractProgress(25);
    setExtractStatusText(`Đang đọc cấu trúc tệp ${uploadedExamFile.name}...`);

    setTimeout(() => {
      setExtractProgress(60);
      setExtractStatusText('Đang quét và nhận diện các câu hỏi trắc nghiệm cùng các đáp án A, B, C, D...');
    }, 700);

    setTimeout(() => {
      setExtractProgress(90);
      setExtractStatusText('Đang bóc tách bảng đáp án chuẩn và phân loại thang đo Bloom...');
    }, 1400);

    setTimeout(() => {
      setExtractProgress(100);
      setExtractStatusText('Bóc tách thành công toàn bộ câu hỏi từ file đề thi!');

      setTimeout(() => {
        const extractedQuestions: Question[] = currentTopicBank.map((q, idx) => ({
          ...q,
          id: idx + 1,
          slideRef: `Đề thi PDF: ${uploadedExamFile.name}`,
        }));

        setQuestions(extractedQuestions);
        setQuestionCount(extractedQuestions.length);
        setIsExtractingExam(false);
        setExtractProgress(0);

        const el = document.getElementById('questions-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }, 2000);
  };

  const handlePublish = () => {
    let selectedSlideNames: string[] = [];
    let targetChapterTitles: string[] = [];

    if (isComprehensiveMode) {
      selectedSlideNames = allChapters
        .flatMap((c) => c.slides)
        .filter((s) => selectedSlideIds.includes(s.id))
        .map((s) => s.name);

      targetChapterTitles = allChapters
        .filter((c) => selectedChapterIds.includes(c.id))
        .map((c) => c.title);
    } else {
      selectedSlideNames = availableSlides
        .filter((s) => selectedSlideIds.includes(s.id))
        .map((s) => s.name);

      targetChapterTitles = [chapterTitle];
    }

    onPublishQuiz({
      title: quizTitle,
      count: questions.length,
      selectedSlides: selectedSlideNames,
      isComprehensive: isComprehensiveMode,
      targetChapterTitles,
    });
  };

  // Nút thêm câu hỏi thủ công (được đặt ở dưới cùng danh sách câu hỏi)
  const handleAddQuestionManual = () => {
    const newId = questions.length + 1;
    const newQ: Question = {
      id: newId,
      text: `Câu hỏi tự biên soạn số ${newId}: [Nhập nội dung câu hỏi tại đây]`,
      bloom: 'Thông hiểu', // Default bloom level
      slideRef: isComprehensiveMode
        ? 'Nguồn: Tự biên soạn (Quiz tổng hợp)'
        : 'Nguồn: Tự biên soạn',
      options: [
        { key: 'A', text: 'Phương án A' },
        { key: 'B', text: 'Phương án B' },
        { key: 'C', text: 'Phương án C' },
        { key: 'D', text: 'Phương án D' },
      ],
      correctKey: 'A',
      explanation: 'Giải thích lý do chọn phương án đúng...',
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (id: number) => {
    if (questions.length <= 1) {
      alert('Bộ đề thi cần ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* HIDDEN FILE INPUT FOR EXAM BANK UPLOAD */}
      <input
        type="file"
        ref={examInputRef}
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleExamFileSelected}
      />

      {/* TOP HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Quay lại khóa học"
            >
              <ArrowLeft size={16} />
              <span>Quay lại</span>
            </button>
            <span className="text-slate-300">|</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {courseCode}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                    isComprehensiveMode
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-blue-50 text-[#1E3A6E] border-blue-200'
                  }`}
                >
                  {isComprehensiveMode ? (
                    <>
                      <Sparkles size={12} className="text-purple-600" />
                      <span>🎯 Tạo Quiz Tổng Hợp Liên Chương</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={12} className="text-[#1E3A6E]" />
                      <span>📘 Tạo Quiz Theo Từng Chương</span>
                    </>
                  )}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1E3A6E] tracking-tight">
                {isComprehensiveMode
                  ? 'Soạn & Cấu hình Đề thi Quiz tổng hợp liên chương'
                  : `Soạn & Duyệt câu hỏi: ${chapterTitle}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Đã lưu bản nháp bộ câu hỏi thành công!')}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>Lưu nháp</span>
            </button>
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send size={14} />
              <span>Phát hành cho sinh viên</span>
            </button>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH SCROLLABLE CONTAINER (Scrollbar strictly on the far right of screen) */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">


          {/* QUIZ TITLE INPUT */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tiêu đề bài kiểm tra / Quiz
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full font-bold text-sm text-slate-800 p-2.5 rounded-lg border border-slate-200 focus:border-[#1E3A6E] focus:outline-none"
              placeholder="Nhập tên bài tập..."
            />
          </div>

          {/* METHOD SELECTION TABS: AI GENERATE FROM SLIDE vs UPLOAD EXAM BANK PDF */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs flex gap-1.5">
            <button
              type="button"
              onClick={() => setCreationMethod('ai-slide')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                creationMethod === 'ai-slide'
                  ? 'bg-[#1E3A6E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={16} className={creationMethod === 'ai-slide' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Cách 1: AI sinh câu hỏi từ các Bài / Chương / Slide</span>
            </button>

            <button
              type="button"
              onClick={() => setCreationMethod('upload-bank')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                creationMethod === 'upload-bank'
                  ? 'bg-[#1E3A6E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UploadCloud size={17} className={creationMethod === 'upload-bank' ? 'text-blue-300' : 'text-slate-400'} />
              <span>Cách 2: Tải lên Ngân hàng đề thi (PDF) trích xuất tự động</span>
            </button>
          </div>

          {/* TAB 1: AI SLIDE / MULTI-CHAPTER CONFIGURATION */}
          {creationMethod === 'ai-slide' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#1E3A6E] text-white rounded-lg">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                      {isComprehensiveMode
                        ? 'Cấu hình phạm vi kiến thức cho Quiz tổng hợp (Nhiều chương & Slide)'
                        : `Cấu hình đề thi & Phân bổ câu hỏi AI (${chapterTitle})`}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isComprehensiveMode
                        ? 'Chọn những bài / chương / slide nào sẽ được thêm vào đề thi tổng hợp bằng các nút bên dưới.'
                        : 'Chọn slide nguồn trong chương này, nhập số lượng câu hỏi và điều chỉnh tỷ lệ thang đo Bloom.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. SELECTION BLOCK: COMPREHENSIVE MULTI-CHAPTER/SLIDE SELECTION WITH TOGGLE BUTTONS */}
              {isComprehensiveMode && allChapters.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers size={15} className="text-[#1E3A6E]" />
                      1. Danh sách các bài học & chương trong môn học ({allChapters.length} chương):
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllChapters}
                        className="px-2.5 py-1 rounded bg-blue-50 text-[#1E3A6E] hover:bg-blue-100 font-semibold cursor-pointer border border-blue-200 transition-colors"
                      >
                        + Chọn tất cả các chương
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllChapters}
                        className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium cursor-pointer border border-slate-200 transition-colors"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  </div>

                  {/* CHAPTERS AND SLIDES ACCORDION/LIST WITH USER-REQUESTED TOGGLE BUTTONS */}
                  <div className="space-y-3">
                    {allChapters.map((chapter, cIdx) => {
                      const isChapterSelected = selectedChapterIds.includes(chapter.id);
                      const selectedSlidesCountInChapter = chapter.slides.filter((s) =>
                        selectedSlideIds.includes(s.id)
                      ).length;

                      return (
                        <div
                          key={chapter.id}
                          className={`rounded-xl border transition-all p-4 space-y-3 ${
                            isChapterSelected
                              ? 'bg-blue-50/30 border-blue-200 shadow-2xs'
                              : 'bg-slate-50/60 border-slate-200'
                          }`}
                        >
                          {/* Chapter Header with Primary Toggle Button */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-md bg-[#1E3A6E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {cIdx + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {chapter.title}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  {chapter.slides.length} slide bài giảng • Đang chọn {selectedSlidesCountInChapter}/{chapter.slides.length} slide
                                </p>
                              </div>
                            </div>

                            {/* NÚT THÊM NÓ VÀO TRONG QUIZ TỔNG HỢP (Requirement) */}
                            <button
                              type="button"
                              onClick={() => handleToggleChapter(chapter.id)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto ${
                                isChapterSelected
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                              title={
                                isChapterSelected
                                  ? 'Nhấn để loại bỏ chương này khỏi bài quiz tổng hợp'
                                  : 'Nhấn để thêm toàn bộ chương này vào bài quiz tổng hợp'
                              }
                            >
                              {isChapterSelected ? (
                                <>
                                  <CheckCircle2 size={14} className="text-white" />
                                  <span>Đã thêm vào quiz tổng hợp</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} className="text-[#1E3A6E]" />
                                  <span>+ Thêm chương này vào quiz tổng hợp</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* SLIDES LIST IN THIS CHAPTER WITH INDIVIDUAL TOGGLE BUTTONS */}
                          {chapter.slides.length > 0 && (
                            <div className="space-y-2 pt-1 border-t border-slate-200/60">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                                Chi tiết các slide trong chương:
                              </span>

                              <div className="grid grid-cols-1 gap-2">
                                {chapter.slides.map((slide) => {
                                  const isSlideSelected = selectedSlideIds.includes(slide.id);

                                  return (
                                    <div
                                      key={slide.id}
                                      className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                                        isSlideSelected
                                          ? 'bg-white border-blue-300 shadow-2xs font-medium'
                                          : 'bg-slate-100/70 border-slate-200 text-slate-500'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={15} className="text-red-500 shrink-0" />
                                        <span className="font-bold text-slate-800 truncate">
                                          {slide.name}
                                        </span>
                                        {slide.title && (
                                          <span className="text-slate-500 text-[11px] truncate hidden md:inline">
                                            — {slide.title}
                                          </span>
                                        )}
                                      </div>

                                      {/* Nút thêm/bỏ slide lẻ */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSlideInChapter(slide.id, chapter.id)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 self-start sm:self-auto ${
                                          isSlideSelected
                                            ? 'bg-blue-50 text-[#1E3A6E] border border-blue-300'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        {isSlideSelected ? (
                                          <>
                                            <Check size={12} className="text-[#1E3A6E]" />
                                            <span>Đã thêm slide</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus size={12} className="text-slate-500" />
                                            <span>Thêm slide</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-[#1E3A6E] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>
                      Phạm vi bài Quiz tổng hợp: <strong>{selectedChapterIds.length} chương</strong> và{' '}
                      <strong>{selectedSlideIds.length} slide bài giảng</strong> đã được chọn.
                    </span>
                  </div>
                </div>
              ) : (
                /* SINGLE CHAPTER SLIDE SELECTION */
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-[#1E3A6E] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen size={15} className="text-[#1E3A6E]" />
                      <span>
                        Chương học áp dụng: <strong>{chapterTitle}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Tạo quiz riêng cho chương này (Tab Home)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Layers size={14} className="text-[#1E3A6E]" />
                      1. Tài liệu slide nguồn trong chương ({availableSlides.length} slide):
                    </span>

                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs text-[#1E3A6E] hover:underline cursor-pointer font-medium"
                    >
                      {selectedSlideIds.length === availableSlides.length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả slide'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableSlides.map((slide) => {
                      const isChecked = selectedSlideIds.includes(slide.id);
                      return (
                        <div
                          key={slide.id}
                          onClick={() => handleToggleSingleSlide(slide.id)}
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-[#1E3A6E] bg-blue-50/50 shadow-2xs font-medium text-slate-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="mt-0.5 text-[#1E3A6E]">
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <FileText size={14} className="text-red-500 shrink-0" />
                              <span className="font-bold truncate">{slide.name}</span>
                            </div>
                            {slide.title && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {slide.title}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <hr className="border-slate-100" />

              {/* 2. QUESTION COUNT DECIDED BY TEACHER (Mặc định 10, max 100) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    2. Số lượng câu hỏi muốn tạo (Mặc định 10 câu, Tối đa 100 câu):
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>Chọn nhanh:</span>
                    {[5, 10, 15, 20, 30, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`px-2 py-0.5 rounded border text-[10.5px] font-semibold transition-colors cursor-pointer ${
                          questionCount === num
                            ? 'bg-[#1E3A6E] text-white border-[#1E3A6E]'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={questionCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuestionCount(Math.min(100, Math.max(1, val)));
                    }}
                    className="w-36 p-2 rounded-lg border border-slate-300 font-bold text-sm text-[#1E3A6E] focus:border-[#1E3A6E] focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">
                    câu hỏi trắc nghiệm (Bạn có thể tự nhập số lượng từ 1 đến 100)
                  </span>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 3. PHÂN BỔ THANG ĐO BLOOM CHO GIẢNG VIÊN TỰ NHẬP (%) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      3. Phân bổ thang đo nhận thức Bloom (Giảng viên tự sắp xếp %):
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Nhập tỷ lệ phần trăm cho từng mức độ nhận thức (tổng các tỷ lệ nên đạt 100%).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Mẫu gợi ý:</span>
                    <button
                      type="button"
                      onClick={() => applyBloomPreset(40, 40, 20)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer border border-slate-200"
                    >
                      Chuẩn (40-40-20)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBloomPreset(50, 35, 15)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer border border-slate-200"
                    >
                      Cơ bản (50-35-15)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyBloomPreset(20, 40, 40)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer border border-slate-200"
                    >
                      Nâng cao (20-40-40)
                    </button>
                  </div>
                </div>

                {/* 3 percentage inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-[#1E3A6E]">1. Nhận biết</span>
                      <span className="text-[10px] text-slate-500">Ghi nhớ định nghĩa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={bloomRemember}
                        onChange={(e) => setBloomRemember(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full p-1.5 rounded-lg bg-white border border-slate-300 font-bold text-xs text-slate-800 focus:border-[#1E3A6E] focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-emerald-800">2. Thông hiểu</span>
                      <span className="text-[10px] text-slate-500">Giải thích nguyên lý</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={bloomUnderstand}
                        onChange={(e) => setBloomUnderstand(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full p-1.5 rounded-lg bg-white border border-slate-300 font-bold text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-amber-800">3. Vận dụng</span>
                      <span className="text-[10px] text-slate-500">Giải bài toán thực tế</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={bloomApply}
                        onChange={(e) => setBloomApply(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-full p-1.5 rounded-lg bg-white border border-slate-300 font-bold text-xs text-slate-800 focus:border-amber-600 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  </div>
                </div>

                {/* Total percentage status badge */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    {totalBloom === 100 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <Check size={13} />
                        Tổng thang đo: {totalBloom}% (Chuẩn)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                        <AlertCircle size={13} />
                        Tổng thang đo hiện tại: {totalBloom}% (Chưa bằng 100%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. NÚT CHỐT CẤU HÌNH & BẮT ĐẦU TẠO CÂU HỎI */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {isComprehensiveMode
                    ? `AI sẽ tổng hợp và sinh ${questionCount} câu hỏi từ ${selectedChapterIds.length} chương học đã chọn.`
                    : `Sau khi chọn cấu hình xong, hãy nhấn nút bên phải để AI tiến hành trích xuất ${questionCount} câu hỏi tương ứng.`}
                </p>

                <button
                  type="button"
                  onClick={handleConfirmConfigAndGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-amber-300" />
                      <span>AI đang tổng hợp & sinh {questionCount} câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-amber-400" />
                      <span>
                        {isComprehensiveMode
                          ? `Chốt cấu hình & Tạo ${questionCount} câu hỏi tổng hợp`
                          : `Chốt cấu hình & Bắt đầu tạo ${questionCount} câu hỏi`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD NGÂN HÀNG ĐỀ THI (PDF) ĐỂ TRÍCH XUẤT CÂU HỎI VÀ ĐÁP ÁN */}
          {creationMethod === 'upload-bank' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#1E3A6E] text-white rounded-lg">
                    <FileUp size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                      Tải lên file Đề thi / Ngân hàng câu hỏi (PDF)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Hệ thống sẽ tự động bóc tách từng câu hỏi, các phương án A, B, C, D và đáp án đúng đưa vào danh sách duyệt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverExam(true);
                }}
                onDragLeave={() => setIsDragOverExam(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverExam(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    setUploadedExamFile({
                      name: file.name,
                      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                      fileObject: file,
                    });
                  }
                }}
                onClick={() => examInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOverExam
                    ? 'border-[#1E3A6E] bg-blue-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-[#1E3A6E] bg-slate-50/60 hover:bg-blue-50/20'
                }`}
              >
                <UploadCloud size={36} className="mx-auto text-[#1E3A6E] mb-2" />
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Nhấn vào đây để chọn tệp đề thi PDF từ máy tính của bạn (hoặc kéo thả tệp vào đây)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Định dạng hỗ trợ: <strong>.PDF, .DOCX</strong> (Đề trắc nghiệm chuẩn gồm câu hỏi, lựa chọn và bảng đáp án)
                </p>
              </div>

              {/* Uploaded Exam Info Display */}
              {uploadedExamFile && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-[#C8232C] rounded-lg">
                      <FileText size={22} />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                        {uploadedExamFile.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Kích thước: {uploadedExamFile.size} • Đã sẵn sàng phân tích bóc tách câu hỏi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadedExamFile(null)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-white text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Chọn file khác
                    </button>
                    <button
                      type="button"
                      onClick={handleStartExtractExam}
                      disabled={isExtractingExam}
                      className="px-4 py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Bắt đầu trích xuất câu hỏi & đáp án</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Extraction Progress Animation */}
              {isExtractingExam && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 font-bold text-xs text-[#1E3A6E]">
                    <RefreshCw size={15} className="animate-spin text-[#1E3A6E]" />
                    <span>{extractStatusText}</span>
                  </div>
                  <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 bg-gradient-to-r from-[#1E3A6E] to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${extractProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">{extractProgress}%</span>
                </div>
              )}
            </div>
          )}

          {/* QUESTIONS LIST SECTION */}
          <div id="questions-section" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Danh sách câu hỏi cần duyệt ({questions.length} câu)
                </h3>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    isComprehensiveMode
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {creationMethod === 'upload-bank'
                    ? 'Bóc tách từ file đề thi PDF'
                    : isComprehensiveMode
                    ? `Đề thi tổng hợp (${selectedChapterIds.length} chương)`
                    : 'Đã sinh theo cấu hình AI'}
                </span>
              </div>

              <span className="text-xs text-slate-500">
                {isComprehensiveMode
                  ? 'Đề tổng hợp liên chương'
                  : isTriangleTopic
                  ? 'Chuyên đề: Tổng 3 góc trong 1 tam giác'
                  : isRadicalTopic
                  ? 'Chuyên đề: Biến đổi căn bậc hai'
                  : 'Học phần: Trí tuệ nhân tạo'}
              </span>
            </div>

            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4 transition-all hover:border-slate-300"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-[#1E3A6E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>

                    {/* MỨC ĐỘ BLOOM TÙY CHỌN CHO TỪNG CÂU HỎI */}
                    <div className="relative">
                      <select
                        value={q.bloom}
                        onChange={(e) => {
                          const newBloom = e.target.value;
                          setQuestions(
                            questions.map((item) => (item.id === q.id ? { ...item, bloom: newBloom } : item))
                          );
                        }}
                        className={`text-xs font-semibold py-1 pl-2.5 pr-7 rounded-md border cursor-pointer focus:outline-none appearance-none transition-colors ${
                          q.bloom === 'Nhận biết'
                            ? 'bg-blue-50 text-[#1E3A6E] border-blue-200 hover:bg-blue-100'
                            : q.bloom === 'Thông hiểu'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Tùy chọn mức độ thang đo nhận thức Bloom"
                      >
                        <option value="Nhận biết">Mức độ: Nhận biết</option>
                        <option value="Thông hiểu">Mức độ: Thông hiểu</option>
                        <option value="Vận dụng">Mức độ: Vận dụng</option>
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                      />
                    </div>

                    <span className="text-xs text-slate-400">
                      Nguồn: <strong className="text-slate-600">{q.slideRef}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Question Content */}
                <div>
                  <textarea
                    value={q.text}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setQuestions(questions.map((item) => (item.id === q.id ? { ...item, text: newText } : item)));
                    }}
                    rows={2}
                    className="w-full text-xs font-medium text-slate-800 p-2.5 rounded-lg border border-slate-200 focus:border-[#1E3A6E] focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Các lựa chọn đáp án (Chọn nút tròn để đổi đáp án đúng):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => {
                      const isCorrect = q.correctKey === opt.key;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            setQuestions(
                              questions.map((item) =>
                                item.id === q.id ? { ...item, correctKey: opt.key } : item
                              )
                            );
                          }}
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isCorrect
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isCorrect && <CheckCircle2 size={12} />}
                          </div>
                          <div className="flex-1">
                            <span className="font-bold mr-1.5">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation & RAG Citation */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1E3A6E] text-[11px]">
                    <HelpCircle size={13} />
                    <span>Giải thích đáp án & Căn cứ kiểm chứng:</span>
                  </div>
                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              </div>
            ))}

            {/* NÚT THÊM CÂU HỎI THỦ CÔNG ĐẶT Ở DƯỚI CÙNG (Requirement) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddQuestionManual}
                className="w-full py-3.5 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#1E3A6E] text-[#1E3A6E] text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus size={16} />
                <span>+ Thêm câu hỏi thủ công vào cuối danh sách</span>
              </button>
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="flex items-center justify-end gap-3 pt-4 pb-8 border-t border-slate-200">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Hủy & Quay lại
            </button>
            <button
              onClick={handlePublish}
              className="px-5 py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={15} />
              <span>Xác nhận & Phát hành {questions.length} câu hỏi</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
