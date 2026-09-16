import React, { useState, useEffect, useRef } from 'react';
import { sampleQuizQuestions, type Question } from './quizData';
import { QuizHeader } from './QuizHeader';
import { QuizFooter } from './QuizFooter';
import { QuestionSingleChoice } from './QuestionSingleChoice';
import { QuestionTrueFalse } from './QuestionTrueFalse';
import { QuestionMatching } from './QuestionMatching';
import { QuizResultAnalysis } from './QuizResultAnalysis';

export interface QuizPlayerModalProps {
  quizTitle?: string;
  onClose: () => void;
}
export const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  quizTitle = 'Quiz 02: Kiểm tra kiến thức E-commerce & AI',
  onClose,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const [scoreTimer, setScoreTimer] = useState(829);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Track results per question for final AI Grading & Analysis
  const [userAnswers, setUserAnswers] = useState<Record<number, { isCorrect: boolean; selected: any }>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSfx = (type: 'correct' | 'wrong' | 'click') => {
    if (!sfxEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // Audio context error
    }
  };

  const speakText = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };


  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isTimerRunning && scoreTimer > 0) {
      timer = setInterval(() => setScoreTimer((prev) => Math.max(0, prev - 1)), 120);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, scoreTimer]);

  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#86EFAC', '#A7F3D0', '#FDE68A', '#FECDD3', '#60A5FA', '#FBBF24', '#FFFFFF'];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 300,
      y: canvas.height / 2 + (Math.random() - 0.5) * 150,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.8) * 16 - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
    }));

    let animationFrameId: number;
    let alpha = 1;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      alpha -= 0.008;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      });
      if (alpha > 0) animationFrameId = requestAnimationFrame(render);
      else setShowConfetti(false);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [showConfetti]);

  const currentQ: Question = sampleQuizQuestions[currentStep];

  useEffect(() => {
    if (ttsEnabled && currentQ) speakText(currentQ.title);
  }, [currentStep, ttsEnabled]);
  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    playSfx('click');
    // Cho phép bấm lại chính đáp án đó để bỏ chọn hoặc chọn đè sang đáp án khác
    setSelectedAnswer((prev) => (prev === optId ? null : optId));
  };

  const handleSubmitAnswer = () => {
    if (isSubmitted) return;
    let isCorrect = false;

    if (currentQ.type === 'single_choice' || currentQ.type === 'true_false') {
      if (!selectedAnswer) return;
      const opt = currentQ.options?.find((o) => o.id === selectedAnswer);
      isCorrect = opt?.isCorrect ?? false;
      setIsSubmitted(true);
      setUserAnswers((prev) => ({ ...prev, [currentStep]: { isCorrect, selected: selectedAnswer } }));
      if (isCorrect) {
        playSfx('correct');
        setShowConfetti(true);
      } else {
        playSfx('wrong');
      }
    } else if (currentQ.type === 'matching') {
      const correctMap = currentQ.correctMapping || {};
      let allMatched = true;
      let count = 0;
      for (const key in correctMap) {
        if (matchingPairs[key] === correctMap[key]) count++;
        else allMatched = false;
      }
      isCorrect = allMatched && count === Object.keys(correctMap).length;
      setIsSubmitted(true);
      setUserAnswers((prev) => ({ ...prev, [currentStep]: { isCorrect, selected: matchingPairs } }));
      if (isCorrect) {
        playSfx('correct');
        setShowConfetti(true);
      } else playSfx('wrong');
    }
  };

  const handleMatchingClickLeft = (leftId: string) => {
    if (isSubmitted) return;
    playSfx('click');
    // Nếu bấm vào item bên trái đã được chọn -> bỏ chọn
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
      return;
    }
    // Nếu bấm vào item bên trái đã được nối -> gỡ mối nối để chọn lại
    if (matchingPairs[leftId]) {
      setMatchingPairs((prev) => {
        const copy = { ...prev };
        delete copy[leftId];
        return copy;
      });
    }
    setSelectedLeft(leftId);
  };

  const handleMatchingClickRight = (rightId: string) => {
    if (isSubmitted) return;
    playSfx('click');

    // Nếu đã chọn 1 mục ở cột trái
    if (selectedLeft) {
      // Nếu mục bên phải này đã được nối với mục trái khác -> gỡ mối nối cũ ra và nối đè mục mới
      setMatchingPairs((prev) => {
        const nextPairs = { ...prev };
        // Gỡ nếu rightId đã được dùng bởi k khác
        Object.keys(nextPairs).forEach((k) => {
          if (nextPairs[k] === rightId) delete nextPairs[k];
        });
        nextPairs[selectedLeft] = rightId;
        return nextPairs;
      });
      setSelectedLeft(null);
    } else {
      // Nếu chưa chọn cột trái mà bấm vào mục bên phải đã nối -> gỡ mối nối đó ra
      const matchedLeftKey = Object.keys(matchingPairs).find((k) => matchingPairs[k] === rightId);
      if (matchedLeftKey) {
        setMatchingPairs((prev) => {
          const copy = { ...prev };
          delete copy[matchedLeftKey];
          return copy;
        });
      }
    }
  };

  const handleNextQuestion = () => {
    playSfx('click');
    if (currentStep < sampleQuizQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setShowConfetti(false);
      setMatchingPairs({});
      setSelectedLeft(null);
    } else {
      setIsTimerRunning(false);
      setIsCompleted(true);
      setShowConfetti(true);
      playSfx('correct');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/90 backdrop-blur-md p-3 sm:p-4 overflow-hidden font-sans">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

      <div className="relative w-full max-w-5xl bg-[#0F172A] border-3 border-blue-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[920px]">
        {isCompleted ? (
          <QuizResultAnalysis
            quizTitle={quizTitle}
            scoreTimer={scoreTimer}
            userAnswers={userAnswers}
            onClose={onClose}
            onReset={() => {
              setIsCompleted(false);
              setCurrentStep(0);
              setSelectedAnswer(null);
              setIsSubmitted(false);
              setUserAnswers({});
              setScoreTimer(829);
              setIsTimerRunning(true);
            }}
            playSfx={playSfx}
          />
        ) : (
          <>
            <QuizHeader
              currentStep={currentStep}
              totalQuestions={sampleQuizQuestions.length}
              quizTitle={quizTitle}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              ttsEnabled={ttsEnabled}
              setTtsEnabled={setTtsEnabled}
              musicEnabled={musicEnabled}
              setMusicEnabled={setMusicEnabled}
              sfxEnabled={sfxEnabled}
              setSfxEnabled={setSfxEnabled}
              onClose={onClose}
              playSfx={playSfx}
            />

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div className="text-center max-w-3xl mx-auto shrink-0 py-1">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-snug drop-shadow-md">
                  {currentQ.title}
                </h1>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {currentQ.type === 'single_choice' && (
                  <QuestionSingleChoice currentQ={currentQ} selectedAnswer={selectedAnswer} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} />
                )}
                {currentQ.type === 'true_false' && (
                  <QuestionTrueFalse currentQ={currentQ} selectedAnswer={selectedAnswer} isSubmitted={isSubmitted} handleSelectOption={handleSelectOption} />
                )}
                {currentQ.type === 'matching' && (
                  <QuestionMatching currentQ={currentQ} isSubmitted={isSubmitted} matchingPairs={matchingPairs} selectedLeft={selectedLeft} handleMatchingClickLeft={handleMatchingClickLeft} handleMatchingClickRight={handleMatchingClickRight} />
                )}
              </div>

              <QuizFooter
                scoreTimer={scoreTimer}
                isSubmitted={isSubmitted}
                currentStep={currentStep}
                totalQuestions={sampleQuizQuestions.length}
                selectedAnswer={selectedAnswer}
                questionType={currentQ.type}
                handleSubmitAnswer={handleSubmitAnswer}
                handleNextQuestion={handleNextQuestion}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

