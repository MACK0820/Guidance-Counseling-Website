import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { BookAppointment } from '../components/BookAppointment';
import { getCurrentUser, logout } from '../lib/auth';
import {
  getAppointmentsByStudent,
  updateAppointmentInStorage,
  Appointment,
  timeSlots,
} from '../lib/mockData';
import { toast } from 'sonner';
import {
  Calendar, Clock, CalendarPlus, X, User, LogOut, Menu,
  GraduationCap, Phone, MapPin, BookOpen, Edit, Key, ChevronRight,
  Shield, CalendarClock, CheckCircle, XCircle,
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import tipLogo from '../../assets/tip-logo.png';

// ── helpers ──────────────────────────────────────────────────────────────────

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

function getStatusColor(status: string) {
  return STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-800 border-gray-300';
}
function getStatusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}
function getYearLabel(y: string) {
  const m: Record<string, string> = { '1':'1st','2':'2nd','3':'3rd','4':'4th','5':'5th' };
  return `${m[y] || y} Year`;
}

// ── component ─────────────────────────────────────────────────────────────────

export function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showBooking, setShowBooking]   = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showEditProfile, setShowEditProfile]   = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  const [editFormData, setEditFormData] = useState({
    contactNumber: user?.contactNumber || '',
    address:       user?.address       || '',
    guardianName:  user?.guardianName  || '',
    guardianContact: user?.guardianContact || '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '', newPass: '', confirm: '',
  });

  // ── Student-initiated reschedule state ────────────────────────────────────
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '', newTimeSlot: '', reason: '',
  });

  // ── data ──────────────────────────────────────────────────────────────────
  const refreshAppointments = () => {
    if (user) setAppointments(getAppointmentsByStudent(user.id));
  };

  useEffect(() => {
    if (!user || user.role !== 'student') { navigate('/'); return; }
    refreshAppointments();
    const id = setInterval(refreshAppointments, 3000);
    return () => clearInterval(id);
  }, [user, navigate]);

  // ── handlers ──────────────────────────────────────────────────────────────

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
      toast.error('Contact number must be exactly 11 digits'); return;
    }
    if (editFormData.guardianContact && editFormData.guardianContact.length !== 11) {
      toast.error('Guardian contact must be exactly 11 digits'); return;
    }
    const updatedUser = { ...user, ...editFormData };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    const students = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
    const idx = students.findIndex((s: any) => s.id === user!.id);
    if (idx !== -1) { students[idx] = updatedUser; localStorage.setItem('registeredStudents', JSON.stringify(students)); }
    setUser(updatedUser);
    setShowEditProfile(false);
    toast.success('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (!passwordData.current || !passwordData.newPass || !passwordData.confirm) {
      toast.error('Please fill in all fields.'); return;
    }
    if (passwordData.newPass.length < 8) {
      toast.error('New password must be at least 8 characters.'); return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      toast.error('New passwords do not match.'); return;
    }
    toast.success('Password changed successfully!');
    setPasswordData({ current: '', newPass: '', confirm: '' });
    setShowChangePassword(false);
  };

  // ── ACCEPT counselor's reschedule proposal ────────────────────────────────
  const handleAcceptReschedule = (appointmentId: string) => {
    const stored: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
    const apt = stored.find((a) => a.id === appointmentId);
    if (!apt?.rescheduleProposal) return;

    const changes: Partial<Appointment> = {
      status:            'rescheduled',
      date:              apt.rescheduleProposal.newDate,
      timeSlot:          apt.rescheduleProposal.newTimeSlot,
      rescheduleProposal: null,
    };
    updateAppointmentInStorage(appointmentId, changes);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, ...changes } : a))
    );
    toast.success('You accepted the new schedule!');
  };

  // ── DECLINE counselor's reschedule proposal ───────────────────────────────
  const handleDeclineCounselorReschedule = (appointmentId: string) => {
    // Revert to whatever it was before — for simplicity revert to pending
    const changes: Partial<Appointment> = {
      status:            'pending',
      rescheduleProposal: null,
    };
    updateAppointmentInStorage(appointmentId, changes);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, ...changes } : a))
    );
    toast.info('Reschedule declined. Your original appointment is back to pending.');
  };

  // ── OPEN student's own reschedule request modal ───────────────────────────
  const handleOpenStudentReschedule = (apt: Appointment) => {
    setRescheduleData({ newDate: '', newTimeSlot: '', reason: '' });
    setRescheduleDialog({ open: true, appointment: apt });
  };

  // ── SUBMIT student reschedule request ────────────────────────────────────
  const handleSubmitStudentReschedule = () => {
    if (!rescheduleData.newDate || !rescheduleData.newTimeSlot) {
      toast.error('Please select a new date and time slot.'); return;
    }
    if (!rescheduleData.reason.trim()) {
      toast.error('Please provide a reason for rescheduling.'); return;
    }

    const apt = rescheduleDialog.appointment!;
    const changes: Partial<Appointment> = {
      status: 'reschedule_requested',
      rescheduleProposal: {
        newDate:     rescheduleData.newDate,
        newTimeSlot: rescheduleData.newTimeSlot,
        reason:      rescheduleData.reason.trim(),
        proposedAt:  new Date().toISOString(),
        proposedBy:  'student',
      },
    };
    updateAppointmentInStorage(apt.id, changes);
    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? { ...a, ...changes } : a))
    );
    setRescheduleDialog({ open: false, appointment: null });
    toast.success('Reschedule request sent to your counselor!');
  };

  // ── CANCEL student's own reschedule request ───────────────────────────────
  const handleCancelStudentRescheduleRequest = (appointmentId: string) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) return;
    // Revert to the status before the request (pending or confirmed)
    // We store the previous status on rescheduleProposal.previousStatus ideally,
    // but since we don't have that yet we default back to pending
    const changes: Partial<Appointment> = {
      status:            'pending',
      rescheduleProposal: null,
    };
    updateAppointmentInStorage(appointmentId, changes);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, ...changes } : a))
    );
    toast.info('Reschedule request cancelled. Appointment is back to pending.');
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const counselorProposals   = appointments.filter((a) => a.status === 'reschedule_proposed');
  const upcomingAppointments = appointments.filter((a) =>
    ['pending', 'confirmed', 'rescheduled', 'reschedule_requested', 'reschedule_proposed'].includes(a.status)
  );
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : appointments;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* ── HEADER ── */}
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
            <span className="text-sm text-gray-300 hidden sm:block">{user.firstName} {user.lastName}</span>
            <div className="relative">
              <button
                onClick={() => setShowMenu(true)}
                className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition"
              >
                <Menu className="w-4 h-4" />
              </button>
              {counselorProposals.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {counselorProposals.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="h-1 bg-yellow-400" />
      </header>

      {/* ── HAMBURGER DRAWER ── */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMenu(false)} />
          <div className="relative bg-white w-72 h-full shadow-2xl flex flex-col">
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
            <div className="flex-1 py-2">
              {[
                { label: 'Student Profile', sub: 'View your profile information', icon: User, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', action: () => { setShowMenu(false); setShowProfilePanel(true); } },
                { label: 'Change Password', sub: 'Update your account password', icon: Shield, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', action: () => { setShowMenu(false); setPasswordData({ current:'',newPass:'',confirm:'' }); setShowChangePassword(true); } },
              ].map(({ label, sub, icon: Icon, iconBg, iconColor, action }) => (
                <button key={label} onClick={action} className="w-full flex items-center justify-between px-5 py-4 hover:bg-yellow-50 transition border-b border-gray-100 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${iconBg} rounded-full flex items-center justify-center group-hover:opacity-80 transition`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{label}</p>
                      <p className="text-xs text-gray-500">{sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition" />
                </button>
              ))}
            </div>
            <div className="p-4 border-t-2 border-gray-200">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded uppercase text-sm tracking-wide transition">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE PANEL ── */}
      {showProfilePanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowProfilePanel(false)} />
          <div className="relative bg-white w-80 h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="bg-gray-900 text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-bold">Student Profile</p>
                <button onClick={() => setShowProfilePanel(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center"><User className="w-7 h-7 text-black" /></div>
                <div>
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400">{user.id}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-3">
              {[
                { label:'Email',           value: user.email,                                    icon: User },
                { label:'Program',         value: user.program,                                  icon: GraduationCap },
                { label:'College',         value: user.college,                                  icon: BookOpen },
                { label:'Year Level',      value: user.yearLevel ? getYearLabel(user.yearLevel) : '-', icon: GraduationCap },
                { label:'Student Status',  value: (user as any).studentStatus || 'Regular',      icon: GraduationCap },
                { label:'Gender',          value: user.gender || '-',                            icon: User },
                { label:'Contact',         value: user.contactNumber,                            icon: Phone },
                { label:'Address',         value: user.address || '-',                           icon: MapPin },
                { label:'Guardian',        value: user.guardianName || '-',                      icon: User },
                { label:'Guardian Contact',value: user.guardianContact || '-',                   icon: Phone },
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
                  setEditFormData({ contactNumber: user.contactNumber||'', address: user.address||'', guardianName: user.guardianName||'', guardianContact: user.guardianContact||'' });
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
            <div className="bg-gray-900 text-white p-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label:'Contact Number *', field:'contactNumber', placeholder:'09171234567', maxLength:11, isContact:true },
                { label:'Address *',        field:'address',       placeholder:'123 Main St, Manila', isContact:false },
                { label:'Guardian Name *',  field:'guardianName',  placeholder:'Pedro Dela Cruz', isContact:false },
                { label:'Guardian Contact *',field:'guardianContact',placeholder:'09181234567', maxLength:11, isContact:true },
              ].map(({ label, field, placeholder, maxLength, isContact }) => (
                <div key={field}>
                  <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">{label}</label>
                  <input
                    type="text"
                    value={(editFormData as any)[field]}
                    onChange={(e) => isContact ? handleContactChange(field, e.target.value) : setEditFormData({ ...editFormData, [field]: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500"
                    placeholder={placeholder}
                    maxLength={maxLength}
                  />
                  {isContact && (editFormData as any)[field] && (editFormData as any)[field].length !== 11 && (
                    <p className="text-xs text-red-500 mt-1">Must be exactly 11 digits</p>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button onClick={() => setShowEditProfile(false)} className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
              <button onClick={handleSaveProfile} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="bg-gray-900 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400">Change Password</h3>
              </div>
              <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label:'Current Password *',      key:'current',  placeholder:'Enter current password' },
                { label:'New Password *',          key:'newPass',  placeholder:'Minimum 8 characters' },
                { label:'Confirm New Password *',  key:'confirm',  placeholder:'Re-enter new password' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">{label}</label>
                  <input type="password" value={(passwordData as any)[key]} onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-yellow-500" placeholder={placeholder} />
                </div>
              ))}
              {passwordData.confirm && passwordData.newPass !== passwordData.confirm && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
              <button onClick={handleChangePassword} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">Update Password</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENT RESCHEDULE REQUEST DIALOG ── */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog({ open, appointment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-pink-500" />
              Request a Reschedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current schedule info */}
            {rescheduleDialog.appointment && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded">
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Current Schedule</p>
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Counselor:</span> {rescheduleDialog.appointment.counselorName}
                </p>
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(rescheduleDialog.appointment.date).toLocaleDateString('en-PH', {
                    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
                  })}{' '}
                  at {rescheduleDialog.appointment.timeSlot}
                </p>
              </div>
            )}

            {/* New date */}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Preferred new date *</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-8 border-2 border-gray-300 focus:border-pink-500"
                />
              </div>
            </div>

            {/* New time slot */}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Preferred time slot *</Label>
              <Select
                value={rescheduleData.newTimeSlot}
                onValueChange={(v) => setRescheduleData({ ...rescheduleData, newTimeSlot: v })}
              >
                <SelectTrigger className="mt-1 border-2 border-gray-300">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">
                Reason *{' '}
                <span className="normal-case font-normal text-gray-500">(shown to counselor)</span>
              </Label>
              <Textarea
                placeholder="e.g. I have a lab exam at the original time and cannot attend..."
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                className="mt-1 border-2 border-gray-300 focus:border-pink-500 min-h-[90px]"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <p className="font-semibold uppercase mb-0.5">What happens next</p>
              <p>Your counselor will review your request and either <strong>approve your preferred time</strong> or <strong>propose a different time</strong>. Your current appointment stays active until they respond.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmitStudentReschedule}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Send request to counselor
              </button>
              <button
                onClick={() => setRescheduleDialog({ open: false, appointment: null })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Counselor-proposed reschedule banners */}
        {counselorProposals.length > 0 && (
          <div className="mb-6 space-y-3">
            {counselorProposals.map((apt) => (
              <div key={apt.id} className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <CalendarClock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-purple-900 text-sm uppercase tracking-wide">
                      Your counselor proposed a reschedule
                    </p>
                    <p className="text-xs text-purple-700 mt-0.5">
                      {apt.counselorName} · Original:{' '}
                      {new Date(apt.date).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}{' '}
                      at {apt.timeSlot}
                    </p>
                  </div>
                </div>
                {apt.rescheduleProposal && (
                  <>
                    <div className="bg-white border border-purple-200 rounded p-3 mb-3">
                      <p className="text-xs font-bold uppercase text-gray-600 mb-1">Proposed New Schedule</p>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        {new Date(apt.rescheduleProposal.newDate).toLocaleDateString('en-PH', {
                          weekday:'long', year:'numeric', month:'long', day:'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        {apt.rescheduleProposal.newTimeSlot}
                      </p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Counselor's reason:</p>
                      <p className="text-xs text-gray-700 italic">"{apt.rescheduleProposal.reason}"</p>
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptReschedule(apt.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded text-xs uppercase tracking-wide transition"
                  >
                    <CheckCircle className="w-3 h-3" /> Accept New Schedule
                  </button>
                  <button
                    onClick={() => handleDeclineCounselorReschedule(apt.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white hover:bg-gray-50 border border-purple-300 text-purple-700 font-bold py-2 rounded text-xs uppercase tracking-wide transition"
                  >
                    <XCircle className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
            <CalendarPlus className="w-4 h-4" /> Book Appointment
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
              <BookAppointment user={user} onSuccess={() => { setShowBooking(false); refreshAppointments(); }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label:'Total Sessions', value: appointments.length,                                        color:'border-gray-300 bg-white' },
            { label:'Upcoming',       value: upcomingAppointments.length,                                color:'border-yellow-400 bg-yellow-50' },
            { label:'Completed',      value: appointments.filter((a) => a.status === 'completed').length, color:'border-green-400 bg-green-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} border-2 rounded-lg shadow p-4 text-center`}>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs uppercase text-gray-600 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Appointments list */}
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
                      {getStatusLabel(apt.status)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-yellow-500" />
                      {new Date(apt.date).toLocaleDateString('en-PH', {
                        weekday:'short', year:'numeric', month:'long', day:'numeric',
                      })}
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

                  {/* ── Student requested reschedule — show their pending request ── */}
                  {apt.status === 'reschedule_requested' && apt.rescheduleProposal && (
                    <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-800">
                      <p className="font-semibold uppercase mb-1">Your reschedule request — waiting for counselor</p>
                      <p>
                        Requested:{' '}
                        {new Date(apt.rescheduleProposal.newDate).toLocaleDateString('en-PH', {
                          weekday:'short', month:'long', day:'numeric', year:'numeric',
                        })}{' '}
                        at {apt.rescheduleProposal.newTimeSlot}
                      </p>
                      <p className="mt-0.5 italic">Reason: "{apt.rescheduleProposal.reason}"</p>
                      <button
                        onClick={() => handleCancelStudentRescheduleRequest(apt.id)}
                        className="mt-2 flex items-center gap-1 text-pink-700 hover:text-pink-900 font-bold uppercase text-xs transition"
                      >
                        <XCircle className="w-3 h-3" /> Cancel this request
                      </button>
                    </div>
                  )}

                  {/* ── Rescheduled confirmation note ── */}
                  {apt.status === 'rescheduled' && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-800">
                      <p className="font-semibold uppercase mb-0.5">Session rescheduled — new time confirmed</p>
                    </div>
                  )}

                  {/* ── Action buttons — Request reschedule (pending or confirmed only) ── */}
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleOpenStudentReschedule(apt)}
                        className="flex items-center justify-center gap-1 bg-pink-50 hover:bg-pink-100 border border-pink-300 text-pink-700 font-bold py-1.5 px-3 rounded text-xs uppercase tracking-wide transition"
                      >
                        <CalendarClock className="w-3 h-3" /> Request Reschedule
                      </button>
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
