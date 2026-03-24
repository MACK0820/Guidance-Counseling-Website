import { useState, useEffect, useMemo } from 'react'; // ← useMemo added
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // ← Select added
import { getCurrentUser, logout } from '../lib/auth';
import { getAllAppointments, mockUsers, Appointment, User } from '../lib/mockData';
import { toast } from 'sonner';
import {
  Calendar, Clock, LogOut, User as UserIcon, Users, Search, GraduationCap,
  Menu, X, Mail, Phone, FileText, AlertCircle, CheckCircle, BookOpen, Key,
  ChevronDown, ChevronUp, Filter, // ← ChevronDown, ChevronUp, Filter added
} from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

const STATUS_COLOR: Record<string, string> = {
  confirmed:             'bg-green-100 text-green-800 border-green-300',
  pending:               'bg-yellow-100 text-yellow-800 border-yellow-300',
  completed:             'bg-blue-100 text-blue-800 border-blue-300',
  reschedule_proposed:   'bg-purple-100 text-purple-800 border-purple-300',
  reschedule_requested:  'bg-pink-100 text-pink-800 border-pink-300',
  rescheduled:           'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const STATUS_LABEL: Record<string, string> = {
  confirmed:             'Confirmed',
  pending:               'Pending',
  completed:             'Completed',
  reschedule_proposed:   'Reschedule Proposed',
  reschedule_requested:  'Reschedule Requested',
  rescheduled:           'Rescheduled',
};

function getStatusColor(s: string) { return STATUS_COLOR[s] ?? 'bg-gray-100 text-gray-800 border-gray-300'; }
function getStatusLabel(s: string) { return STATUS_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1); }

// ── NEW: group completed appointments by counselor → date ─────────────────────
function groupReports(appointments: Appointment[]): Record<string, Record<string, Appointment[]>> {
  const out: Record<string, Record<string, Appointment[]>> = {};
  for (const apt of appointments) {
    if (!out[apt.counselorName]) out[apt.counselorName] = {};
    if (!out[apt.counselorName][apt.date]) out[apt.counselorName][apt.date] = [];
    out[apt.counselorName][apt.date].push(apt);
  }
  return out;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showProfile, setShowProfile]   = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'pending' | 'students' | 'counselors'>('all');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current:'', newPass:'', confirm:'' });

  // ── NEW: All-appointments filters ─────────────────────────────────────────
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterCounselor, setFilterCounselor] = useState('all');

  // ── NEW: Reports filters ──────────────────────────────────────────────────
  const [reportFilterCounselor, setReportFilterCounselor] = useState('all');
  const [reportFilterDate,      setReportFilterDate]      = useState('');
  const [expandedCounselors,    setExpandedCounselors]    = useState<Record<string, boolean>>({});

  // ── NEW: Students filters ─────────────────────────────────────────────────
  const [studentSearch,        setStudentSearch]        = useState('');
  const [studentFilterCollege, setStudentFilterCollege] = useState('all');
  const [studentFilterYear,    setStudentFilterYear]    = useState('all');

  const students   = mockUsers.filter((u) => u.role === 'student');
  const counselors = mockUsers.filter((u) => u.role === 'counselor');
  const colleges   = [...new Set(students.map((s) => s.college).filter(Boolean))] as string[];
  const counselorNames = [...new Set(appointments.map((a) => a.counselorName))];

  const refreshAppointments = () => setAppointments(getAllAppointments());

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    refreshAppointments();
    const id = setInterval(refreshAppointments, 3000);
    return () => clearInterval(id);
  }, [user, navigate]);

  const handleLogout = () => { logout(); toast.success('Logged out successfully.'); navigate('/'); };

  const handleChangePassword = () => {
    if (!passwordData.current || !passwordData.newPass || !passwordData.confirm) { toast.error('Please fill in all fields.'); return; }
    if (passwordData.newPass.length < 8) { toast.error('New password must be at least 8 characters.'); return; }
    if (passwordData.newPass !== passwordData.confirm) { toast.error('New passwords do not match.'); return; }
    toast.success('Password changed successfully!');
    setPasswordData({ current:'', newPass:'', confirm:'' });
    setShowChangePassword(false);
  };

  // ── NEW: Derived filtered lists ───────────────────────────────────────────

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      const matchSearch =
        apt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.counselorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.program.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus    = filterStatus    === 'all' || apt.status === filterStatus;
      const matchCounselor = filterCounselor === 'all' || apt.counselorName === filterCounselor;
      return matchSearch && matchStatus && matchCounselor;
    });
  }, [appointments, searchQuery, filterStatus, filterCounselor]);

  const completedAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchCounselor = reportFilterCounselor === 'all' || a.counselorName === reportFilterCounselor;
      const matchDate      = !reportFilterDate || a.date === reportFilterDate;
      return a.status === 'completed' && matchCounselor && matchDate;
    });
  }, [appointments, reportFilterCounselor, reportFilterDate]);

  const groupedReports = useMemo(() => groupReports(completedAppointments), [completedAppointments]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchSearch  = !studentSearch || name.includes(studentSearch.toLowerCase()) || (s.studentId || '').includes(studentSearch) || (s.program || '').toLowerCase().includes(studentSearch.toLowerCase());
      const matchCollege = studentFilterCollege === 'all' || s.college === studentFilterCollege;
      const matchYear    = studentFilterYear    === 'all' || s.yearLevel === studentFilterYear;
      return matchSearch && matchCollege && matchYear;
    });
  }, [students, studentSearch, studentFilterCollege, studentFilterYear]);

  const toggleCounselor = (name: string) =>
    setExpandedCounselors((prev) => ({ ...prev, [name]: !prev[name] }));

  // Existing derived
  const completedWithReports = appointments.filter((a) => a.status === 'completed');
  const pendingAppointments  = appointments.filter((a) => a.status === 'pending');
  const rescheduleActivity   = appointments.filter((a) =>
    a.status === 'reschedule_proposed' || a.status === 'reschedule_requested'
  );
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompleted = completedWithReports.filter(
    (a) => a.date === todayStr || a.createdAt?.startsWith(todayStr)
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* ── HEADER ── */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={tipLogo} alt="TIP" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">TIP Guidance &amp; Counseling</p>
              <p className="text-xs text-gray-400">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300 hidden sm:block">{user.firstName} {user.lastName}</span>
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-yellow-400" />
      </header>

      {/* ── PROFILE DRAWER ── */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowProfile(false)} />
          <div className="relative bg-white w-80 h-full shadow-2xl flex flex-col">
            <div className="bg-gray-900 text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-bold">Admin Profile</p>
                <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
                  <UserIcon className="w-7 h-7 text-black" />
                </div>
                <div>
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-yellow-300 uppercase">Admin</p>
                  <p className="text-xs text-gray-400">{user.id}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-3 overflow-y-auto">
              {[{ label:'Email', value:user.email, icon:Mail }, { label:'Contact', value:user.contactNumber, icon:Phone }].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-100">
                  <Icon className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                    <p className="text-sm text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
              <div className="py-2">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Permissions</p>
                <p className="text-xs text-gray-700">✓ View all appointments &amp; reports</p>
                <p className="text-xs text-gray-700">✓ View student &amp; counselor data</p>
                <p className="text-xs text-red-400">✗ Cannot modify system settings</p>
              </div>
              <button
                onClick={() => { setPasswordData({ current:'',newPass:'',confirm:'' }); setShowChangePassword(true); }}
                className="w-full flex items-center gap-3 py-2 border-b border-gray-100 hover:bg-yellow-50 transition text-left"
              >
                <Key className="w-4 h-4 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Change Password</p>
                  <p className="text-sm text-gray-700">Update your account password</p>
                </div>
              </button>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD DIALOG ── */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="bg-gray-900 text-white p-5 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Change Password</h3>
              </div>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[{ label:'Current Password', key:'current', placeholder:'Enter current password' }, { label:'New Password', key:'newPass', placeholder:'Min. 8 characters' }, { label:'Confirm Password', key:'confirm', placeholder:'Re-enter new password' }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs uppercase font-bold text-gray-700 block mb-1">{label}</label>
                  <Input type="password" placeholder={placeholder} value={(passwordData as any)[key]} onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })} className="border-2 border-gray-300 focus:border-yellow-500" />
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
              <button onClick={handleChangePassword} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">Change Password</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Total Appointments', value: appointments.length,    icon: Calendar,    color:'border-gray-300 bg-white' },
            { label:'Pending',            value: pendingAppointments.length, icon: AlertCircle, color:'border-yellow-400 bg-yellow-50' },
            { label:'Completed Today',    value: todayCompleted.length,  icon: CheckCircle, color:'border-green-400 bg-green-50' },
            { label:'Total Students',     value: students.length,        icon: GraduationCap, color:'border-blue-400 bg-blue-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`${color} border-2 rounded-lg shadow p-4 flex items-center gap-3`}>
              <Icon className="w-8 h-8 text-yellow-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs uppercase text-gray-600 font-semibold">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {pendingAppointments.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 font-semibold">
              {pendingAppointments.length} pending appointment(s) awaiting counselor confirmation.
            </p>
          </div>
        )}

        {rescheduleActivity.length > 0 && (
          <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <p className="text-sm text-purple-800 font-semibold">
              {rescheduleActivity.length} appointment(s) have pending reschedule activity —{' '}
              {rescheduleActivity.filter((a) => a.status === 'reschedule_requested').length} requested by students,{' '}
              {rescheduleActivity.filter((a) => a.status === 'reschedule_proposed').length} proposed by counselors.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border-2 border-gray-200">
          <div className="flex flex-wrap gap-1 p-4 border-b-2 border-gray-200">
            {([
              { id:'all',       label:'All Appointments' },
              { id:'reports',   label:`Reports (${completedWithReports.length})` },
              { id:'pending',   label:`Pending (${pendingAppointments.length})` },
              { id:'students',  label:`Students (${students.length})` },
              { id:'counselors',label:`Counselors (${counselors.length})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${activeTab === tab.id ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── ALL APPOINTMENTS — with status + counselor filters ── */}
          {activeTab === 'all' && (
            <div>
              <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search by student, counselor, or program..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 border-2 border-gray-200" />
                </div>
                {/* ── NEW: Status + counselor dropdowns ── */}
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-44 border-2 border-gray-200 text-xs h-8">
                      <Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(STATUS_LABEL).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCounselor} onValueChange={setFilterCounselor}>
                    <SelectTrigger className="w-52 border-2 border-gray-200 text-xs h-8">
                      <SelectValue placeholder="All counselors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All counselors</SelectItem>
                      {counselorNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {(filterStatus !== 'all' || filterCounselor !== 'all' || searchQuery) && (
                    <button
                      onClick={() => { setFilterStatus('all'); setFilterCounselor('all'); setSearchQuery(''); }}
                      className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded px-2 h-8"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">Showing {filtered.length} of {appointments.length} appointments</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold uppercase text-sm">No appointments found</p>
                  </div>
                ) : filtered.map((apt) => (
                  <div key={apt.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Counseling Session with {apt.counselorName}</h4>
                        <p className="text-xs text-gray-500">{apt.studentName} · {apt.program}</p>
                      </div>
                      <Badge className={`${getStatusColor(apt.status)} border text-xs uppercase font-bold`}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-yellow-500" />{new Date(apt.date).toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" />{apt.timeSlot}</span>
                    </div>
                    {apt.purpose && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                    {apt.status === 'reschedule_requested' && apt.rescheduleProposal && (
                      <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-800">
                        <p className="font-semibold uppercase mb-0.5">Student requested reschedule</p>
                        <p>Requested: {new Date(apt.rescheduleProposal.newDate).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })} at {apt.rescheduleProposal.newTimeSlot}</p>
                        <p className="mt-0.5 italic">Reason: "{apt.rescheduleProposal.reason}"</p>
                      </div>
                    )}
                    {apt.status === 'reschedule_proposed' && apt.rescheduleProposal && (
                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
                        <p className="font-semibold uppercase mb-0.5">Counselor proposed reschedule</p>
                        <p>Proposed: {new Date(apt.rescheduleProposal.newDate).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })} at {apt.rescheduleProposal.newTimeSlot}</p>
                        <p className="mt-0.5 italic">Reason: "{apt.rescheduleProposal.reason}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REPORTS — grouped by counselor → date ── */}
          {activeTab === 'reports' && (
            <div>
              {/* Report filters */}
              <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 items-center">
                <Select value={reportFilterCounselor} onValueChange={setReportFilterCounselor}>
                  <SelectTrigger className="w-52 border-2 border-gray-200 text-xs h-8">
                    <SelectValue placeholder="All counselors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All counselors</SelectItem>
                    {counselorNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={reportFilterDate}
                  onChange={(e) => setReportFilterDate(e.target.value)}
                  className="w-40 border-2 border-gray-200 text-xs h-8"
                />
                {(reportFilterCounselor !== 'all' || reportFilterDate) && (
                  <button
                    onClick={() => { setReportFilterCounselor('all'); setReportFilterDate(''); }}
                    className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded px-2 h-8"
                  >
                    Clear
                  </button>
                )}
                <span className="text-xs text-gray-500 ml-auto">{completedAppointments.length} completed session(s)</span>
              </div>

              {completedAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-semibold uppercase text-sm">No completed sessions found</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-200">
                  {Object.entries(groupedReports).map(([counselorName, dateGroups]) => {
                    const totalSessions = Object.values(dateGroups).reduce((sum, arr) => sum + arr.length, 0);
                    const isExpanded    = expandedCounselors[counselorName] !== false; // default expanded
                    return (
                      <div key={counselorName}>
                        {/* Counselor header — clickable to collapse */}
                        <button
                          onClick={() => toggleCounselor(counselorName)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-black" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{counselorName}</p>
                              <p className="text-xs text-gray-500">
                                {totalSessions} completed session{totalSessions !== 1 ? 's' : ''} · {Object.keys(dateGroups).length} date{Object.keys(dateGroups).length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* ── High-volume badge: 5+ sessions total ── */}
                            {totalSessions >= 5 && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded font-semibold">High volume</span>
                            )}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-gray-100">
                            {Object.entries(dateGroups)
                              .sort(([a], [b]) => b.localeCompare(a)) // newest date first
                              .map(([date, apts]) => (
                                <div key={date} className="px-4 py-3">
                                  {/* Date sub-header */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-3.5 h-3.5 text-yellow-500" />
                                    <p className="text-xs font-bold uppercase text-gray-600">
                                      {new Date(date).toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                                    </p>
                                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                                      {apts.length} session{apts.length !== 1 ? 's' : ''}
                                    </span>
                                    {/* ── 5+ in a day badge ── */}
                                    {apts.length >= 5 && (
                                      <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded font-semibold">5+ in a day</span>
                                    )}
                                  </div>
                                  {/* Sessions for that date */}
                                  <div className="space-y-2 pl-5">
                                    {apts.map((apt) => (
                                      <div key={apt.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-1">
                                          <div>
                                            <p className="font-semibold text-gray-900 text-xs">{apt.studentName}</p>
                                            <p className="text-xs text-gray-500">{apt.program} · {apt.timeSlot}</p>
                                          </div>
                                          {apt.sessionType && (
                                            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">{apt.sessionType}</span>
                                          )}
                                        </div>
                                        {apt.purpose && <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                                        {apt.narrativeSummary ? (
                                          <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded">
                                            <p className="text-xs font-bold uppercase text-blue-700 mb-0.5 flex items-center gap-1">
                                              <FileText className="w-3 h-3" /> Session Summary
                                            </p>
                                            <p className="text-xs text-blue-900">{apt.narrativeSummary}</p>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-400 italic">No summary provided.</p>
                                        )}
                                        {(apt as any).facultyReport && (
                                          <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                                            <p className="font-semibold uppercase mb-0.5">Faculty Report Sent</p>
                                            <p>To: {(apt as any).facultyReport.facultyName}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PENDING ── */}
          {activeTab === 'pending' && (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {pendingAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-semibold uppercase text-sm">No pending appointments</p>
                </div>
              ) : pendingAppointments.map((apt) => (
                <div key={apt.id} className="p-4 bg-yellow-50 hover:bg-yellow-100 transition">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Counseling Session with {apt.counselorName}</h4>
                      <p className="text-xs text-gray-500">{apt.studentName} · {apt.program}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs uppercase font-bold">Pending</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-yellow-500" />{new Date(apt.date).toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" />{apt.timeSlot}</span>
                  </div>
                  {apt.purpose && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── STUDENTS — with search + college + year level filters ── */}
          {activeTab === 'students' && (
            <div>
              <div className="p-4 border-b border-gray-100 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search by name, ID, or program..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-10 border-2 border-gray-200" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={studentFilterCollege} onValueChange={setStudentFilterCollege}>
                    <SelectTrigger className="w-64 border-2 border-gray-200 text-xs h-8">
                      <SelectValue placeholder="All colleges" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All colleges</SelectItem>
                      {colleges.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={studentFilterYear} onValueChange={setStudentFilterYear}>
                    <SelectTrigger className="w-32 border-2 border-gray-200 text-xs h-8">
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {['1','2','3','4','5'].map((y) => (
                        <SelectItem key={y} value={y}>
                          {y === '1' ? '1st' : y === '2' ? '2nd' : y === '3' ? '3rd' : `${y}th`} Year
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(studentSearch || studentFilterCollege !== 'all' || studentFilterYear !== 'all') && (
                    <button
                      onClick={() => { setStudentSearch(''); setStudentFilterCollege('all'); setStudentFilterYear('all'); }}
                      className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded px-2 h-8"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">Showing {filteredStudents.length} of {students.length} students</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold uppercase text-sm">No students found</p>
                  </div>
                ) : filteredStudents.map((s) => (
                  <div key={s.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-500">{s.program}</p>
                        <p className="text-xs text-gray-400">
                          {s.college} · {s.yearLevel ? ['','1st','2nd','3rd','4th','5th'][Number(s.yearLevel)] : '?'} Year · {(s as any).studentStatus || 'Regular'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{s.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COUNSELORS ── */}
          {activeTab === 'counselors' && (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {counselors.map((c) => (
                <div key={c.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${c.isAvailable ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                      {c.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Handled Programs:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.assignedPrograms?.map((p) => (
                        <span key={p} className="inline-block bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
