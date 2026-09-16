import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CourseCard, type Course } from './components/CourseCard';
import { CourseDetailView } from './components/CourseDetailView';
import { Filter, ArrowUpDown, LayoutGrid, ChevronDown, Bell } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const courses: Course[] = [
    {
      id: 1,
      code: 'BL-ED3220-175097',
      name: 'Kỹ năng mềm',
      department: 'Khoa Khoa học và Công nghệ Giáo dục',
      progress: 0,
      patternType: 'waves',
    },
    {
      id: 2,
      code: 'CS-AI3010-184022',
      name: 'Trí tuệ nhân tạo nâng cao',
      department: 'Viện Kỹ thuật và Khoa học Máy tính',
      progress: 45,
      patternType: 'grid',
    },
    {
      id: 3,
      code: 'ENG-LANG201-10029',
      name: 'Tiếng Anh Chuyên ngành Kỹ thuật',
      department: 'Trung tâm Phát triển Ngôn ngữ',
      progress: 80,
      patternType: 'stripes',
    },
    {
      id: 4,
      code: 'MATH-2010-99482',
      name: 'Đại số tuyến tính & Giải tích',
      department: 'Khoa Khoa học Cơ bản',
      progress: 20,
      patternType: 'abstract',
    },
  ];

  const filteredCourses = courses.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      {/* LEFT NAVIGATION SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {selectedCourse ? (
          <CourseDetailView
            course={selectedCourse}
            onBack={() => setSelectedCourse(null)}
          />
        ) : (
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            {/* Header Row with Greeting & Notifications Bell Icon centered vertically */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hi, NGUYỄN THỊ MÍ!
                </h1>
                <span className="text-2xl md:text-3xl">👋</span>
              </div>

              {/* Centered Vertically Notification Icon Button */}
              <button
                className="relative p-2 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-200/50 rounded-full transition-colors flex items-center justify-center"
                title="Notifications"
              >
                <Bell size={24} />
                <span className="absolute top-1 right-1 bg-[#C8232C] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  2
                </span>
              </button>
            </div>

            {/* Subheader */}
            <h2 className="text-lg font-semibold text-slate-700 mt-2 mb-4">
              Course overview
            </h2>

            <hr className="border-slate-200 mb-6" />

            {/* Filter Bar Controls (Matching Image 2) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              {/* Left Filter & Search Inputs */}
              <div className="flex items-center gap-3 flex-1 max-w-xl">
                <button className="text-[#C8232C] hover:text-red-700 p-1.5 transition-colors shrink-0" title="Filter menu">
                  <Filter size={20} className="fill-[#C8232C]" />
                </button>

                <div className="relative shrink-0">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="appearance-none bg-slate-600 text-[#1E3A6E] font-medium text-white hover:bg-slate-700 text-sm py-2 pl-3.5 pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="All">All</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                </div>

                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-[#1E3A6E] text-slate-800 text-sm py-2 px-3.5 rounded-lg focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Right Sorting & Display View Controls */}
              <div className="flex items-center gap-4 shrink-0 text-sm text-slate-700">
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <ArrowUpDown size={18} className="text-[#C8232C]" />
                  <span className="font-medium text-slate-700">Sort by course name</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>

                <div className="flex items-center gap-1.5 cursor-pointer">
                  <LayoutGrid size={18} className="text-[#C8232C]" />
                  <span className="font-medium text-slate-700">Card</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* COURSE CARDS GRID AREA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={(c) => setSelectedCourse(c)}
                />
              ))}
            </div>
          </main>
        )}

        {/* FOOTER */}
        <footer className="py-3 px-6 border-t border-slate-200 text-right text-xs text-slate-400 bg-white shrink-0">
          © 2026 VinUniversity CECS
        </footer>
      </div>
    </div>
  );
}

export default App;


