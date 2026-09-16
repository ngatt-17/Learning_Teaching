import React, { useState } from 'react';
import { Bot, Send, User, X } from 'lucide-react';

interface QuestionChatbotProps {
  questionTitle: string;
  explanation?: string;
  onClose: () => void;
}

export const QuestionChatbot: React.FC<QuestionChatbotProps> = ({
  questionTitle,
  explanation,
  onClose,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: `Xin chào! Tôi là AI Tutor của VinUni. Bạn có thắc mắc gì về câu hỏi: "${questionTitle}" hoặc muốn tôi giải thích rõ hơn không?`,
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    setTimeout(() => {
      let botReply = `Về vấn đề "${userMsg}": Theo giáo trình môn học, ${explanation || 'khái niệm này đòi hỏi nắm vững lý thuyết cốt lõi và ứng dụng thực tế'}. Bạn có cần tôi đưa thêm ví dụ minh họa không?`;
      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 600);
  };

  return (
    <div className="w-full bg-white border-2 border-blue-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[280px] animate-fadeIn mt-3">
      {/* Header chatbot */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold leading-none">AI Trợ Lý Hỗ Trợ Câu Hỏi</h4>
            <span className="text-[10px] text-blue-100 font-medium">Trực tuyến - Sẵn sàng giải thích</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Danh sách tin nhắn */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {m.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div
              className={`max-w-[85%] p-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input gửi */}
      <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Hỏi AI thêm về câu hỏi này..."
          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-colors shadow-2xs"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};