import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CourseCard, type Course } from './components/CourseCard';
import { CourseDetailView } from './components/CourseDetailView';
import {
  Filter,
  ArrowUpDown,
  LayoutGrid,
  ChevronDown,
  Bell,
} from 'lucide-react';

const courses: Course[] = [
  {
    id: 1,
    code: 'CS-AI3010-184022',
    name: 'Trí tuệ nhân tạo nâng cao',
    department: 'Viện Kỹ thuật và Khoa học Máy tính (CECS)',
    patternType: 'grid',
    enrolledStudents: 74,
    materialsCount: 16,
    quizzesCount: 5,
    pendingReviews: 2,
    status: 'Review Needed',
  },
  {
    id: 2,
    code: 'COMP1010-110293',
    name: 'Lập trình C/C++ & Cấu trúc dữ liệu',
    department: 'Viện Kỹ thuật và Khoa học Máy tính (CECS)',
    patternType: 'waves',
    enrolledStudents: 112,
    materialsCount: 24,
    quizzesCount: 8,
    pendingReviews: 0,
    status: 'Ready',
  },
  {
    id: 3,
    code: 'MATH-2010-99482',
    name: 'Đại số tuyến tính & Xác suất thống kê',
    department: 'Khoa Khoa học Cơ bản & CECS',
    patternType: 'stripes',
    enrolledStudents: 88,
    materialsCount: 12,
    quizzesCount: 4,
    pendingReviews: 1,
    status: 'Review Needed',
  },
  {
    id: 4,
    code: 'CECS-OS3020-44910',
    name: 'Hệ điều hành & Điện toán đám mây',
    department: 'Viện Kỹ thuật và Khoa học Máy tính (CECS)',
    patternType: 'abstract',
    enrolledStudents: 65,
    materialsCount: 7,
    quizzesCount: 2,
    pendingReviews: 0,
    status: 'Processing',
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(courses[0]);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterCategory === 'All') return matchesSearch;
    if (filterCategory === 'Ready') return matchesSearch && c.status === 'Ready';
    if (filterCategory === 'Needs Review') return matchesSearch && c.status === 'Review Needed';
    if (filterCategory === 'Processing') return matchesSearch && c.status === 'Processing';

    return matchesSearch;
  });

  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'Courses' || tab === 'Dashboard') {
      setSelectedCourse(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      {/* LEFT NAVIGATION SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSidebarTabChange}
      />

      {/* MAIN VIEW: COURSE DETAIL WORKSPACE OR OVERVIEW DASHBOARD */}
      {selectedCourse ? (
        <CourseDetailView
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
        />
      ) : (
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* MAIN BODY LAYOUT */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            {/* Header Row with Instructor Greeting & Notification Bell */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hi, DR. NGUYỄN THANH TÙNG!
                </h1>
                <span className="text-2xl md:text-3xl">👨‍🏫</span>
              </div>

              {/* Notification Icon Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                  className="relative p-2 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-200/60 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={24} />
                  <span className="absolute top-1 right-1 bg-[#C8232C] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                    3
                  </span>
                </button>

                {/* Notification Popover */}
                {showNotificationPopup && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-slate-100">
                      <span>Teacher Notifications</span>
                      <span className="text-[10px] bg-red-100 text-[#C8232C] px-1.5 py-0.5 rounded font-semibold">3 New</span>
                    </div>
                    <div className="divide-y divide-slate-100 mt-2">
                      <div className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1">
                        <p className="font-semibold text-slate-800">2 Quiz Drafts Generated</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">CS-AI3010: AI generated 2 draft questions from Week 4 slides.</p>
                      </div>
                      <div className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1">
                        <p className="font-semibold text-slate-800">Slide Processing Complete</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">COMP1010: Lecture 08 embeddings ready for instructor review.</p>
                      </div>
                      <div className="py-2 hover:bg-slate-50 cursor-pointer rounded px-1">
                        <p className="font-semibold text-slate-800">Misconception Alert</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">MATH2010: 64% of students struggled with Eigenvalues quiz.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subheader */}
            <div className="mt-2 mb-4">
              <h2 className="text-lg font-semibold text-slate-700">
                Course overview
              </h2>
            </div>

            <hr className="border-slate-200 mb-6" />

            {/* Filter Bar Controls (Matching vin-uni layout) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              {/* Left Filter & Search Inputs */}
              <div className="flex items-center gap-3 flex-1 max-w-xl">
                <button
                  className="text-[#C8232C] hover:text-red-700 p-1.5 transition-colors shrink-0 cursor-pointer"
                  title="Reset filters"
                  onClick={() => {
                    setFilterCategory('All');
                    setSearchQuery('');
                  }}
                >
                  <Filter size={20} className="fill-[#C8232C]" />
                </button>

                <div className="relative shrink-0">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="appearance-none bg-slate-600 text-white hover:bg-slate-700 text-sm font-medium py-2 pl-3.5 pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="All">All Courses</option>
                    <option value="Ready">Ready for Students</option>
                    <option value="Needs Review">Needs Review (3)</option>
                    <option value="Processing">Processing</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>

                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search teaching courses, codes, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-[#1E3A6E] text-slate-800 text-sm py-2 px-3.5 rounded-lg focus:outline-none transition-colors shadow-2xs"
                  />
                </div>
              </div>

              {/* Right Sorting & Display View Controls */}
              <div className="flex items-center gap-4 shrink-0 text-sm text-slate-700">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors">
                  <ArrowUpDown size={18} className="text-[#C8232C]" />
                  <span className="font-medium text-slate-700">Sort by course name</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>

                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors">
                  <LayoutGrid size={18} className="text-[#C8232C]" />
                  <span className="font-medium text-slate-700">Card</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* COURSE CARDS GRID AREA */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onSelectCourse={(c) => setSelectedCourse(c)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500">
                <p className="font-semibold text-slate-700 text-base">No courses found</p>
                <p className="text-xs mt-1">Try adjusting your search query or filter category.</p>
                <button
                  onClick={() => {
                    setFilterCategory('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#1E3A6E] text-white text-xs font-semibold rounded-lg hover:bg-[#14274E] transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>

          {/* FOOTER */}
          <footer className="py-3 px-6 border-t border-slate-200 text-right text-xs text-slate-400 bg-white shrink-0">
            © 2026 VinUniversity CECS — AI Learning Hub (Teacher Portal)
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
