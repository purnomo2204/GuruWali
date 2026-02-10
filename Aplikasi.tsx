
import React, { useState, useEffect } from 'react';
import { ViewMode, Student, CounselingLog, TeacherData } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import CounselingManagement from './components/CounselingManagement';
import LPJManagement from './components/LPJManagement';
import Settings from './components/Settings';
import { Search, ChevronLeft, Calendar, Loader2, Download as DownloadIcon } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.WELCOME);
  const [students, setStudents] = useState<Student[]>([]);
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'loading' | 'error'} | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [teacherData, setTeacherData] = useState<TeacherData>({
    name: 'Wiwit Purnomo, S.Pd',
    nip: '-',
    school: 'SMP Negeri 2 Magelang',
    schoolAddress: 'Magelang',
    academicYear: '2025/2026'
  });

  useEffect(() => {
    // Listen for PWA installation prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const savedStudents = localStorage.getItem('guru_wali_students');
    const savedLogs = localStorage.getItem('guru_wali_logs');
    const savedYear = localStorage.getItem('guru_wali_academic_year');
    const savedSheetUrl = localStorage.getItem('guru_wali_spreadsheet_url');
    const savedTeacher = localStorage.getItem('guru_wali_teacher_data');
    
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedLogs) setCounselingLogs(JSON.parse(savedLogs));
    if (savedYear) setAcademicYear(savedYear);
    if (savedSheetUrl) setSpreadsheetUrl(savedSheetUrl);
    if (savedTeacher) {
      const parsedTeacher = JSON.parse(savedTeacher);
      setTeacherData(parsedTeacher);
      if (parsedTeacher.academicYear) {
        setAcademicYear(parsedTeacher.academicYear);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('guru_wali_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('guru_wali_logs', JSON.stringify(counselingLogs));
  }, [counselingLogs]);

  useEffect(() => {
    localStorage.setItem('guru_wali_academic_year', academicYear);
  }, [academicYear]);

  const showNotification = (msg: string, type: 'success' | 'loading' | 'error' = 'success') => {
    setNotification({ msg, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const syncToSpreadsheet = async (target: 'students' | 'logs', data: any) => {
    if (!spreadsheetUrl) return;
    
    showNotification("Menyinkronkan ke Cloud...", "loading");
    try {
      await fetch(spreadsheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ target, payload: data })
      });
      showNotification("Data Terkirim ke Cloud!", "success");
    } catch (error) {
      console.error("Sync error:", error);
      showNotification("Gagal Sinkronisasi ke Cloud", "error");
    }
  };

  const handleAddStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    showNotification("Data siswa berhasil ditambahkan");
    syncToSpreadsheet('students', student);
  };

  const handleUpdateStudent = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    showNotification("Data siswa berhasil diperbarui");
    syncToSpreadsheet('students', updated);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showNotification("Data siswa berhasil dihapus");
  };

  const handleAddCounseling = (log: CounselingLog) => {
    setCounselingLogs(prev => [...prev, log]);
    showNotification("Jurnal berhasil dikirim");
    syncToSpreadsheet('logs', log);
  };

  const handleSaveSpreadsheetUrl = (url: string) => {
    setSpreadsheetUrl(url);
    localStorage.setItem('guru_wali_spreadsheet_url', url);
    showNotification("Konfigurasi Cloud disimpan");
  };

  const handleUpdateTeacherData = (data: TeacherData) => {
    setTeacherData(data);
    localStorage.setItem('guru_wali_teacher_data', JSON.stringify(data));
    setAcademicYear(data.academicYear);
    showNotification("Data Guru berhasil diperbarui");
  };

  const handleExportBackup = () => {
    const backupData = {
      students,
      counselingLogs,
      teacherData,
      spreadsheetUrl,
      academicYear,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Jurnal_GuruWali_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification("Data berhasil diekspor ke hard disk");
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.students) setStudents(data.students);
        if (data.counselingLogs) setCounselingLogs(data.counselingLogs);
        if (data.teacherData) setTeacherData(data.teacherData);
        if (data.spreadsheetUrl) setSpreadsheetUrl(data.spreadsheetUrl);
        if (data.academicYear) setAcademicYear(data.academicYear);
        showNotification("Data berhasil dipulihkan dari cadangan");
      } catch (err) {
        showNotification("File tidak valid atau rusak", "error");
      }
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = counselingLogs.filter(l =>
    l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.aspect.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.academicYear.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 pb-safe pt-safe overflow-x-hidden">
      {notification && (
        <div className="fixed top-safe mt-6 right-6 z-50 animate-bounce no-print">
          <div className={`${
            notification.type === 'loading' ? 'bg-blue-600 border-blue-400' : 
            notification.type === 'error' ? 'bg-red-600 border-red-400' :
            'bg-emerald-600 border-emerald-400'
          } text-white px-6 py-3 rounded-full shadow-2xl border font-bold flex items-center gap-3`}>
            {notification.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {notification.msg}
          </div>
        </div>
      )}

      {/* Notifikasi Instalasi PC */}
      {deferredPrompt && view !== ViewMode.WELCOME && (
        <div className="fixed bottom-6 right-6 z-50 no-print animate-in slide-in-from-right-4">
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-3 bg-white text-slate-950 px-6 py-3 rounded-2xl font-bold shadow-2xl hover:bg-slate-200 transition-all border border-slate-200"
          >
            <DownloadIcon className="w-5 h-5" /> PASANG APLIKASI DESKTOP
          </button>
        </div>
      )}

      {view === ViewMode.WELCOME && (
        <WelcomeScreen teacherData={teacherData} onEnter={() => setView(ViewMode.HOME)} />
      )}

      {view !== ViewMode.WELCOME && (
        <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 no-print">
            <div className="flex items-center gap-4">
              {view !== ViewMode.HOME && (
                <button 
                  onClick={() => setView(ViewMode.HOME)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-orbitron">
                  Jurnal Guru Wali
                </h1>
                <p className="text-slate-400 text-sm">
                  {teacherData.name} - {teacherData.school}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 max-w-2xl">
              <div className="relative group flex-1 w-full">
                <input
                  type="text"
                  placeholder="Cari bimbingan atau siswa..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400" />
              </div>

              <div className="relative flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-2 min-w-[180px] w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <div className="flex flex-col flex-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 leading-none mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none w-full text-slate-200"
                    placeholder="Contoh: 2025/2026"
                  />
                </div>
              </div>
            </div>
          </div>

          <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {view === ViewMode.HOME && (
              <Dashboard setView={setView} />
            )}
            
            {(view === ViewMode.STUDENT_LIST || view === ViewMode.STUDENT_INPUT) && (
              <StudentManagement 
                view={view}
                setView={setView}
                students={filteredStudents}
                onAdd={handleAddStudent}
                onUpdate={handleUpdateStudent}
                onDelete={handleDeleteStudent}
                academicYear={academicYear}
                teacherData={teacherData}
              />
            )}

            {(view === ViewMode.COUNSELING_INPUT || view === ViewMode.COUNSELING_DATA) && (
              <CounselingManagement 
                view={view}
                setView={setView}
                students={students}
                logs={filteredLogs}
                onAdd={handleAddCounseling}
                globalAcademicYear={academicYear}
                teacherData={teacherData}
              />
            )}

            {view === ViewMode.LPJ_MANAGEMENT && (
              <LPJManagement 
                students={students}
                logs={counselingLogs}
                academicYear={academicYear}
                setView={setView}
                teacherData={teacherData}
              />
            )}

            {view === ViewMode.SETTINGS && (
              <Settings 
                spreadsheetUrl={spreadsheetUrl}
                onSaveUrl={handleSaveSpreadsheetUrl}
                setView={setView}
                teacherData={teacherData}
                onUpdateTeacherData={handleUpdateTeacherData}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
