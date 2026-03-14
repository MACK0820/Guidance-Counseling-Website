import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getCurrentUser, logout } from '../lib/auth';
import { getAllAppointments, mockUsers, Appointment, User } from '../lib/mockData';
import { toast } from 'sonner';
import {
  Calendar, Clock, LogOut, User as UserIcon, Users, Search, GraduationCap,
  Menu, X, Mail, Phone, FileText, AlertCircle, CheckCircle, BookOpen, Key
} from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'pending' | 'students' | 'counselors'>('all');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });

  const students = mockUsers.filter(u => u.role === 'student');
  const counselors = mockUsers.filter(u => u.role === 'counselor');

  const refreshAppointments = () => {
    setAppointments(getAllAppointments());
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    refreshAppointments();
    const id = setInterval(refreshAppointments, 3000);
    return () => clearInterval(id);
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleChangePassword = () => {
    if (!passwordData.current || !passwordData.newPass || !passwordData.confirm) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (passwordData.newPass.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    toast.success('Password changed successfully!');
    setPasswordData({ current: '', newPass: '', confirm: '' });
    setShowChangePassword(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filtered = appointments.filter(apt =>
    apt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.counselorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedWithReports = appointments.filter(a => a.status === 'completed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompleted = completedWithReports.filter(a => a.date === todayStr || a.createdAt?.startsWith(todayStr));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
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

      {/* Profile Drawer */}
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
              {[
                { label: 'Email', value: user.email, icon: Mail },
                { label: 'Contact', value: user.contactNumber, icon: Phone },
              ].map(({ label, value, icon: Icon }) => (
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
              {/* Change Password Button */}
              <button
                onClick={() => {
                  setPasswordData({ current: '', newPass: '', confirm: '' });
                  setShowChangePassword(true);
                }}
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
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="bg-gray-900 text-white p-5 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Change Password</h3>
              </div>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 block mb-1">Current Password</label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="border-2 border-gray-300 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 block mb-1">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password (min. 8 characters)"
                  value={passwordData.newPass}
                  onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })}
                  className="border-2 border-gray-300 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-gray-700 block mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="border-2 border-gray-300 focus:border-yellow-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'border-gray-300 bg-white' },
            { label: 'Pending', value: pendingAppointments.length, icon: AlertCircle, color: 'border-yellow-400 bg-yellow-50' },
            { label: 'Completed Today', value: todayCompleted.length, icon: CheckCircle, color: 'border-green-400 bg-green-50' },
            { label: 'Total Students', value: students.length, icon: GraduationCap, color: 'border-blue-400 bg-blue-50' },
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

        {/* Pending alert */}
        {pendingAppointments.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 font-semibold">
              {pendingAppointments.length} pending appointment(s) awaiting counselor confirmation. / {pendingAppointments.length} appointment(s) ang naghihintay ng kumpirmasyon ng counselor.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border-2 border-gray-200">
          <div className="flex flex-wrap gap-1 p-4 border-b-2 border-gray-200">
            {([
              { id: 'all', label: 'All Appointments' },
              { id: 'reports', label: `Reports (${completedWithReports.length})` },
              { id: 'pending', label: `Pending (${pendingAppointments.length})` },
              { id: 'students', label: `Students (${students.length})` },
              { id: 'counselors', label: `Counselors (${counselors.length})` },
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

          {/* All Appointments */}
          {activeTab === 'all' && (
            <div>
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by student, counselor, or program..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 border-gray-200"
                  />
                </div>
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
                        <h4 className="font-bold text-gray-900 text-sm">
                          Counseling Session with {apt.counselorName}
                        </h4>
                        <p className="text-xs text-gray-500">{apt.studentName} · {apt.program}</p>
                      </div>
                      <Badge className={`${getStatusColor(apt.status)} border text-xs uppercase font-bold`}>{apt.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-yellow-500" />{new Date(apt.date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" />{apt.timeSlot}</span>
                    </div>
                    {apt.purpose && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {completedWithReports.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-semibold uppercase text-sm">No completed sessions yet</p>
                  <p className="text-xs">Completed sessions with counselor reports will appear here.</p>
                </div>
              ) : completedWithReports.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Counseling Session with {apt.counselorName}
                      </h4>
                      <p className="text-xs text-gray-500">{apt.studentName} · {apt.program}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-yellow-500" />{new Date(apt.date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" />{apt.timeSlot}</span>
                  </div>
                  {apt.purpose && <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                  {apt.narrativeSummary ? (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs font-bold uppercase text-blue-700 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Counselor's Session Summary
                      </p>
                      <p className="text-xs text-blue-900">{apt.narrativeSummary}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">No narrative summary provided by counselor.</p>
                  )}
                  {apt.status === 'cancelled' && apt.cancellationReason && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-bold uppercase text-red-700 mb-1">Cancellation Reason:</p>
                      <p className="text-xs text-red-900">{apt.cancellationReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pending */}
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
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-yellow-500" />{new Date(apt.date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" />{apt.timeSlot}</span>
                  </div>
                  {apt.purpose && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Students */}
          {activeTab === 'students' && (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {students.map((s) => (
                <div key={s.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.program}</p>
                      <p className="text-xs text-gray-400">{s.college}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{s.id}</span>
                </div>
              ))}
            </div>
          )}

          {/* Counselors */}
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
                  <div className="ml-13">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Handled Programs:</p>
                    <div className="flex flex-wrap gap-1">
                      {c.assignedPrograms?.map((p) => (
                        <span key={p} className="inline-block bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-2 py-0.5 rounded">
                          {p}
                        </span>
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