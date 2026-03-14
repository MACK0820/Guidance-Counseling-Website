import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { BookAppointment } from '../components/BookAppointment';
import { getCurrentUser, logout } from '../lib/auth';
import { getAppointmentsByStudent, Appointment } from '../lib/mockData';
import { toast } from 'sonner';
import { Calendar, Clock, CalendarPlus, X, User, LogOut, Menu, GraduationCap, Phone, MapPin, BookOpen, Edit, Key, ChevronRight, Shield } from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

export function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [editFormData, setEditFormData] = useState({
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
    guardianName: user?.guardianName || '',
    guardianContact: user?.guardianContact || '',
  });
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });

  const refreshAppointments = () => {
    if (user) setAppointments(getAppointmentsByStudent(user.id));
  };

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/');
      return;
    }
    refreshAppointments();
    const intervalId = setInterval(refreshAppointments, 3000);
    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleContactChange = (field: string, val: string) => {
    const filtered = val.replace(/[^0-9]/g, '').slice(0, 11);
    setEditFormData({ ...editFormData, [field]: filtered });
  };

  const handleSaveProfile = () => {
    if (editFormData.contactNumber && editFormData.contactNumber.length !== 11) {
      toast.error('Contact number must be exactly 11 digits');
      return;
    }
    if (editFormData.guardianContact && editFormData.guardianContact.length !== 11) {
      toast.error('Guardian contact must be exactly 11 digits');
      return;
    }
    const updatedUser = {
      ...user,
      contactNumber: editFormData.contactNumber,
      address: editFormData.address,
      guardianName: editFormData.guardianName,
      guardianContact: editFormData.guardianContact,
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
    const studentIndex = registeredStudents.findIndex((s: any) => s.id === user.id);
    if (studentIndex !== -1) {
      registeredStudents[studentIndex] = updatedUser;
      localStorage.setItem('registeredStudents', JSON.stringify(registeredStudents));
    }
    setUser(updatedUser);
    setShowEditProfile(false);
    toast.success('Profile updated successfully!');
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
    // In a real system, this would verify the current password against the backend
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

  const getYearLabel = (y: string) => {
    const map: Record<string, string> = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th' };
    return `${map[y] || y} Year`;
  };

  const upcomingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : appointments;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={tipLogo} alt="TIP" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">TIP Guidance &amp; Counseling</p>
              <p className="text-xs text-gray-400">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300 hidden sm:block">
              {user.firstName} {user.lastName}
            </span>
            <button
              onClick={() => setShowMenu(true)}
              className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-yellow-400" />
      </header>

      {/* ── HAMBURGER MENU DRAWER ── */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMenu(false)} />
          <div className="relative bg-white w-72 h-full shadow-2xl flex flex-col">
            {/* Menu header */}
            <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400">{user.id}</p>
                </div>
              </div>
              <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu options */}
            <div className="flex-1 py-2">
              {/* 1. Student Profile */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowProfilePanel(true);
                }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-yellow-50 transition border-b border-gray-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition">
                    <User className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Student Profile</p>
                    <p className="text-xs text-gray-500">View your profile information</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition" />
              </button>

              {/* 2. Change Password */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setPasswordData({ current: '', newPass: '', confirm: '' });
                  setShowChangePassword(true);
                }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-yellow-50 transition border-b border-gray-100 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Change Password</p>
                    <p className="text-xs text-gray-500">Update your account password</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition" />
              </button>
            </div>

            {/* Logout at bottom */}
            <div className="p-4 border-t-2 border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded uppercase text-sm tracking-wide transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENT PROFILE PANEL ── */}
      {showProfilePanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowProfilePanel(false)} />
          <div className="relative bg-white w-80 h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="bg-gray-900 text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-bold">Student Profile</p>
                <button onClick={() => setShowProfilePanel(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
                  <User className="w-7 h-7 text-black" />
                </div>
                <div>
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400">{user.id}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-3">
              {[
                { label: 'Email', value: user.email, icon: User },
                { label: 'Program', value: user.program, icon: GraduationCap },
                { label: 'College', value: user.college, icon: BookOpen },
                { label: 'Year Level', value: user.yearLevel ? getYearLabel(user.yearLevel) : '-', icon: GraduationCap },
                { label: 'Student Status', value: (user as any).studentStatus || 'Regular', icon: GraduationCap },
                { label: 'Gender', value: user.gender || '-', icon: User },
                { label: 'Contact', value: user.contactNumber, icon: Phone },
                { label: 'Address', value: user.address || '-', icon: MapPin },
                { label: 'Guardian', value: user.guardianName || '-', icon: User },
                { label: 'Guardian Contact', value: user.guardianContact || '-', icon: Phone },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <Icon className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                    <p className="text-sm text-gray-900">{value || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowProfilePanel(false);
                  setEditFormData({
                    contactNumber: user.contactNumber || '',
                    address: user.address || '',
                    guardianName: user.guardianName || '',
                    guardianContact: user.guardianContact || '',
                  });
                  setShowEditProfile(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                <Edit className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="bg-gray-900 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Edit Profile</h3>
                <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Contact Number *</label>
                <input
                  type="text"
                  value={editFormData.contactNumber}
                  onChange={(e) => handleContactChange('contactNumber', e.target.value)}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="09171234567"
                  maxLength={11}
                />
                {editFormData.contactNumber && editFormData.contactNumber.length !== 11 && (
                  <p className="text-xs text-red-500 mt-1">Must be exactly 11 digits</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Address *</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="123 Main St, Manila"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Guardian Name *</label>
                <input
                  type="text"
                  value={editFormData.guardianName}
                  onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="Pedro Dela Cruz"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Guardian Contact *</label>
                <input
                  type="text"
                  value={editFormData.guardianContact}
                  onChange={(e) => handleContactChange('guardianContact', e.target.value)}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="09181234567"
                  maxLength={11}
                />
                {editFormData.guardianContact && editFormData.guardianContact.length !== 11 && (
                  <p className="text-xs text-red-500 mt-1">Must be exactly 11 digits</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="bg-gray-900 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Change Password</h3>
                </div>
                <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Current Password *</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPass}
                  onChange={(e) => setPasswordData({ ...passwordData, newPass: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                  placeholder="Re-enter new password"
                />
                {passwordData.confirm && passwordData.newPass !== passwordData.confirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
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
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-white border-l-4 border-yellow-400 rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 uppercase tracking-wide">
              Welcome, {user.firstName}! <span className="text-yellow-600">(Maligayang pagdating!)</span>
            </h2>
            <p className="text-sm text-gray-500">{user.program} | {user.college}</p>
          </div>
          <button
            onClick={() => setShowBooking(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded uppercase text-xs tracking-wide transition"
          >
            <CalendarPlus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>

        {/* Booking Modal */}
        {showBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="relative bg-transparent w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowBooking(false)}
                className="absolute -top-3 -right-3 z-10 bg-white border-2 border-gray-300 rounded-full p-1.5 text-gray-600 hover:text-red-600 shadow"
              >
                <X className="w-4 h-4" />
              </button>
              <BookAppointment
                user={user}
                onSuccess={() => {
                  setShowBooking(false);
                  refreshAppointments();
                }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Sessions', value: appointments.length, color: 'border-gray-300 bg-white' },
            { label: 'Upcoming', value: upcomingAppointments.length, color: 'border-yellow-400 bg-yellow-50' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'border-green-400 bg-green-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} border-2 rounded-lg shadow p-4 text-center`}>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs uppercase text-gray-600 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-lg shadow border-2 border-gray-200">
          <div className="flex items-center justify-between p-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">My Counseling Sessions</h3>
            </div>
            <div className="flex gap-1">
              {(['upcoming', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${activeTab === tab ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {tab === 'upcoming' ? 'Upcoming' : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {displayedAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3" />
                <p className="font-semibold uppercase text-sm">No appointments yet</p>
                <p className="text-xs">Book your first counseling session above</p>
              </div>
            ) : (
              displayedAppointments.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Counseling Session with {apt.counselorName || 'TBD'}
                      </h4>
                    </div>
                    <Badge className={`${getStatusColor(apt.status)} border text-xs uppercase font-bold`}>
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-yellow-500" />
                      {new Date(apt.date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-500" />
                      {apt.timeSlot}
                    </span>
                  </div>
                  {apt.purpose && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Purpose:</span> {apt.purpose}
                    </p>
                  )}
                  {apt.status === 'cancelled' && apt.cancellationReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-semibold text-red-700 uppercase mb-0.5">Cancellation Reason:</p>
                      <p className="text-xs text-red-800">{apt.cancellationReason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}