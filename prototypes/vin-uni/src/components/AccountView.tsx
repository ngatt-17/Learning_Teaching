import React, { useState } from 'react';
import { User, Mail, GraduationCap, ShieldCheck, Check, Edit3, Save } from 'lucide-react';

interface AccountViewProps {
  userName: string;
  onUpdateName: (newName: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ userName, onUpdateName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (!nameInput.trim()) return;
    onUpdateName(nameInput.trim());
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 p-5 sm:p-8 max-w-5xl w-full mx-auto overflow-y-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Account Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hồ sơ tài khoản sinh viên VinUniversity — College of Engineering & Computer Science
          </p>
        </div>

        {savedSuccess && (
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <Check size={14} className="text-emerald-600" />
            Đã cập nhật tên thành công!
          </span>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
            alt="Student Avatar"
            className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover shadow-sm"
          />
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Active Student" />
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-lg font-bold px-3 py-1 border border-[#1E3A6E] rounded-lg outline-none text-slate-900"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-[#1E3A6E] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#14274E]"
                  >
                    <Save size={14} />
                    <span>Lưu</span>
                  </button>
                  <button
                    onClick={() => {
                      setNameInput(userName);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-slate-900">{userName}</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-slate-400 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    title="Đổi tên hiển thị"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-0.5">Mã sinh viên: 22010205 • Khóa 2022 - 2026</p>
            </div>

            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-[#1E3A6E] border border-blue-200">
                Sinh viên chính quy (Student)
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Đang học (Active)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <GraduationCap size={16} className="text-[#C8232C]" />
              <span>Viện Kỹ thuật & Khoa học Máy tính (CECS)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={16} className="text-[#1E3A6E]" />
              <span>tung.nt@vinuni.edu.vn</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Xác thực tài khoản SSO VinUni</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <User size={16} className="text-[#1E3A6E]" />
            <span>Thông tin cá nhân</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Họ và tên hiển thị</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{userName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Email sinh viên</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">tung.nt@vinuni.edu.vn</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Chuyên ngành</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">Computer Science (Khoa học Máy tính)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Cài đặt hệ thống học tập</span>
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1">
              <span>Trợ lý AI Socratic tương tác</span>
              <span className="font-bold text-emerald-600">Bật (Mặc định)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-100">
              <span>Thông báo bài tập & hạn nộp</span>
              <span className="font-bold text-emerald-600">Bật (Email & Web)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-100">
              <span>Đề luyện tập củng cố cá nhân hóa</span>
              <span className="font-bold text-indigo-600">Tự động sinh theo lỗ hổng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
