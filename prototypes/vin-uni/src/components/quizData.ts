export type QuestionType = 'single_choice' | 'true_false' | 'matching' | 'short_answer' | 'scenario';

export interface SingleChoiceOption {
  id: string;
  text: string;
  bg: string;
  border: string;
  hoverBg: string;
  isCorrect: boolean;
}

export interface MatchingItem {
  id: string;
  label: string;
}

export interface ScenarioNode {
  context: string;
  question: string;
  options: Array<{
    text: string;
    nextBranchId?: string;
    feedback: string;
    isGoodChoice: boolean;
  }>;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  image?: string;
  options?: SingleChoiceOption[];
  leftItems?: MatchingItem[];
  rightItems?: MatchingItem[];
  correctMapping?: Record<string, string>;
  correctShortAnswer?: string;
  acceptableKeywords?: string[];
  explanation?: string;
  citation?: string;
  branches?: Record<string, ScenarioNode>;
}

export const sampleQuizQuestions: Question[] = [
  {
    id: 'q1',
    type: 'single_choice',
    title: 'Website nào không phải là Sàn Thương mại điện tử?',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    options: [
      { id: 'opt1', text: 'Lazada', bg: 'bg-emerald-100', border: 'border-emerald-300', hoverBg: 'hover:bg-emerald-200', isCorrect: false },
      { id: 'opt2', text: 'Shopee', bg: 'bg-lime-100', border: 'border-lime-300', hoverBg: 'hover:bg-lime-200', isCorrect: false },
      { id: 'opt3', text: 'Tiktok Shop', bg: 'bg-amber-100', border: 'border-amber-300', hoverBg: 'hover:bg-amber-200', isCorrect: false },
      { id: 'opt4', text: 'Tiktok.com', bg: 'bg-rose-100', border: 'border-rose-300', hoverBg: 'hover:bg-rose-200', isCorrect: true },
    ],
    explanation: 'Tiktok.com là mạng xã hội chia sẻ video ngắn, còn Tiktok Shop mới là tính năng sàn Thương mại Điện tử tích hợp trong ứng dụng.',
    citation: 'Tài liệu: E-Commerce Foundations - Chương 1, Trang 14',
  },
  {
    id: 'q2',
    type: 'true_false',
    title: 'Mô hình AI Generative chỉ xử lý được văn bản (Text), không xử lý được hình ảnh hay âm thanh?',
    options: [
      { id: 'true', text: 'Đúng', bg: 'bg-rose-100', border: 'border-rose-300', hoverBg: 'hover:bg-rose-200', isCorrect: false },
      { id: 'false', text: 'Sai', bg: 'bg-emerald-100', border: 'border-emerald-300', hoverBg: 'hover:bg-emerald-200', isCorrect: true },
    ],
    explanation: 'Các mô hình AI hiện đại như GPT-4o hay Gemini là mô hình Đa thức (Multimodal), xử lý tốt văn bản, hình ảnh và âm thanh.',
    citation: 'Tài liệu: AI Infrastructure & Multimodal LLMs - Chương 2, Trang 35',
  },
  {
    id: 'q3',
    type: 'matching',
    title: 'Nối các Thuật toán Machine Learning (Trái) với Bài toán thực tế phù hợp (Phải):',
    leftItems: [
      { id: 'l1', label: '1. Linear Regression' },
      { id: 'l2', label: '2. K-Means Clustering' },
      { id: 'l3', label: '3. Convolutional Neural Network (CNN)' },
    ],
    rightItems: [
      { id: 'r1', label: 'A. Dự đoán giá nhà dựa trên diện tích' },
      { id: 'r2', label: 'B. Phân nhóm khách hàng chưa phân nhãn' },
      { id: 'r3', label: 'C. Nhận diện khối u trên ảnh y tế' },
    ],
    correctMapping: { l1: 'r1', l2: 'r2', l3: 'r3' },
    explanation: 'Linear Regression giải quyết bài toán Hồi quy liên tục; K-Means phân nhóm Phân cụm khách hàng không nhãn; CNN chuyên trách tối ưu xử lý dữ liệu hình ảnh.',
    citation: 'Tài liệu: Machine Learning Algorithms - Chương 3, Trang 56',
  },
  {
    id: 'q4',
    type: 'short_answer',
    title: 'Nêu tên thuật toán AI phổ biến dùng để phân nhóm khách hàng dựa trên hành vi mua sắm trong Thương mại điện tử (Trả lời ngắn):',
    correctShortAnswer: 'K-Means Clustering (hoặc Clustering / Phân cụm)',
    acceptableKeywords: ['k-means', 'kmeans', 'clustering', 'phân cụm', 'collaborative filtering'],
    explanation: 'Thuật toán K-Means Clustering giúp tự động gom nhóm các tập khách hàng có đặc điểm hành vi tương đồng mà không cần dán nhãn trước.',
    citation: 'Tài liệu: Customer Analytics & Segmentation - Chương 4, Trang 88',
  },
];
