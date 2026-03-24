import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { getCurrentUser, logout } from '../lib/auth';
import {
  getAppointmentsByCounselor,
  updateAppointmentInStorage,
  getFacultyMembers,  // ← NEW
  isWithin3Hours,     // ← NEW
  Appointment,
  timeSlots,
  User,
} from '../lib/mockData';
import { toast } from 'sonner';
import {
  Calendar, Clock, CheckCircle, AlertCircle, Menu, X,
  User as UserIcon, LogOut, Phone, Mail, BookOpen, FileText, Key,
  CalendarClock, Send, // ← Send added
} from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── component ─────────────────────────────────────────────────────────────────

export function CounselorDashboard() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAvailable, setIsAvailable]   = useState(true);
  const [showProfile, setShowProfile]   = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed'>('pending');

  // Report dialog — narrativeSummary is now REQUIRED
  const [reportDialog, setReportDialog] = useState<{
    open: boolean; appointmentId: string | null; appointment?: Appointment | null;
  }>({ open: false, appointmentId: null, appointment: null });
  const [reportData, setReportData] = useState({
    narrativeSummary: '', sessionType: '' as Appointment['sessionType'],
  });
  // ── NEW: validation errors for report form ────────────────────────────────
  const [reportErrors, setReportErrors] = useState({ narrativeSummary: '', sessionType: '' });

  // ── NEW: Faculty report dialog ────────────────────────────────────────────
  const [facultyReportDialog, setFacultyReportDialog] = useState<{
    open: boolean; appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [facultyReportData, setFacultyReportData] = useState({ facultyId: '', summary: '' });
  const [facultyMembers, setFacultyMembers]        = useState<User[]>([]);

  // Counselor-initiated reschedule dialog
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean; appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '', newTimeSlot: '', reason: '',
  });

  // Counter-propose dialog
  const [counterDialog, setCounterDialog] = useState<{
    open: boolean; appointment: Appointment | null;
  }>({ open: false, appointment: null });
  const [counterData, setCounterData] = useState({
    newDate: '', newTimeSlot: '', reason: '',
  });

  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });

  // ── data ──────────────────────────────────────────────────────────────────

  const refreshAppointments = () => {
    if (user) setAppointments(getAppointmentsByCounselor(user.id));
  };

  useEffect(() => {
    if (!user || user.role !== 'counselor') { navigate('/'); return; }
    setIsAvailable(user.isAvailable || false);
    setFacultyMembers(getFacultyMembers()); // ← NEW
    refreshAppointments();
    const id = setInterval(refreshAppointments, 3000);
    return () => clearInterval(id);
  }, [user, navigate]);

  // ── helpers ───────────────────────────────────────────────────────────────

  const applyChange = (appointmentId: string, changes: Partial<Appointment>) => {
    updateAppointmentInStorage(appointmentId, changes);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, ...changes } : a))
    );
  };

  const checkConflict = (
    counselorId: string,
    date: string,
    timeSlot: string,
    excludeId?: string
  ): boolean => {
    const stored: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
    return stored.some(
      (a) =>
        a.id !== excludeId &&
        a.counselorId === counselorId &&
        a.date === date &&
        a.timeSlot === timeSlot &&
        ['confirmed', 'pending', 'rescheduled'].includes(a.status)
    );
  };

  // ── CONFIRM ───────────────────────────────────────────────────────────────
  const handleConfirm = (appointmentId: string) => {
    applyChange(appointmentId, { status: 'confirmed' });
    toast.success('Appointment confirmed!');
  };

  // ── MARK DONE ─────────────────────────────────────────────────────────────
  const handleMarkDone = (appointmentId: string) => {
    applyChange(appointmentId, { status: 'completed' });
    toast.success('Session marked as done!');
  };

  // ── REPORT — narrative summary now REQUIRED ───────────────────────────────
  const handleOpenReport = (apt: Appointment) => {
    setReportErrors({ narrativeSummary: '', sessionType: '' });
    setReportData({ narrativeSummary: apt.narrativeSummary || '', sessionType: apt.sessionType || '' as any });
    setReportDialog({ open: true, appointmentId: apt.id, appointment: apt });
  };

  const handleSubmitReport = () => {
    // Validate both fields
    const errs = { narrativeSummary: '', sessionType: '' };
    if (!reportData.sessionType)             errs.sessionType      = 'Please select a session type.';
    if (!reportData.narrativeSummary.trim()) errs.narrativeSummary = 'Narrative summary is required.';
    if (errs.sessionType || errs.narrativeSummary) {
      setReportErrors(errs);
      return;
    }
    applyChange(reportDialog.appointmentId!, {
      status: 'completed',
      sessionType: reportData.sessionType,
      narrativeSummary: reportData.narrativeSummary.trim(),
    });
    setReportDialog({ open: false, appointmentId: null, appointment: null });
    setReportData({ narrativeSummary: '', sessionType: '' as any });
    toast.success('Report submitted successfully!');
  };

  // ── NEW: Faculty report ───────────────────────────────────────────────────
  const handleOpenFacultyReport = (apt: Appointment) => {
    setFacultyReportData({ facultyId: apt.referredByFacultyId || '', summary: apt.narrativeSummary || '' });
    setFacultyReportDialog({ open: true, appointment: apt });
  };

  const handleSendFacultyReport = () => {
    if (!facultyReportData.facultyId)      { toast.error('Please select a faculty member.'); return; }
    if (!facultyReportData.summary.trim()) { toast.error('Please write a summary to send.'); return; }
    const faculty = facultyMembers.find((f) => f.id === facultyReportData.facultyId);
    if (!faculty) return;
    applyChange(facultyReportDialog.appointment!.id, {
      facultyReport: {
        facultyId:    faculty.id,
        facultyName:  `${faculty.firstName} ${faculty.lastName}`,
        facultyEmail: faculty.email,
        summary:      facultyReportData.summary.trim(),
        sentAt:       new Date().toISOString(),
      },
    });
    setFacultyReportDialog({ open: false, appointment: null });
    toast.success(`Report sent to ${faculty.firstName} ${faculty.lastName}!`);
  };

  // ── COUNSELOR-INITIATED RESCHEDULE — with 3-hour guard ───────────────────
  const handleOpenReschedule = (apt: Appointment) => {
    // ── 3-HOUR GUARD ──────────────────────────────────────────────────────
    if (isWithin3Hours(apt.date, apt.timeSlot)) {
      toast.error('Cannot reschedule within 3 hours of the appointment time.');
      return;
    }
    // ──────────────────────────────────────────────────────────────────────
    setRescheduleData({ newDate: '', newTimeSlot: '', reason: '' });
    setRescheduleDialog({ open: true, appointment: apt });
  };

  const handleSubmitReschedule = () => {
    if (!rescheduleData.newDate || !rescheduleData.newTimeSlot) {
      toast.error('Please select a new date and time slot.'); return;
    }
    if (!rescheduleData.reason.trim()) {
      toast.error('Please provide a reason for rescheduling.'); return;
    }
    const apt = rescheduleDialog.appointment!;
    if (checkConflict(apt.counselorId, rescheduleData.newDate, rescheduleData.newTimeSlot, apt.id)) {
      toast.error('That time slot is already booked. Please choose a different one.'); return;
    }
    applyChange(apt.id, {
      status: 'reschedule_proposed',
      rescheduleProposal: {
        newDate:     rescheduleData.newDate,
        newTimeSlot: rescheduleData.newTimeSlot,
        reason:      rescheduleData.reason.trim(),
        proposedAt:  new Date().toISOString(),
        proposedBy:  'counselor',
      },
    });
    setRescheduleDialog({ open: false, appointment: null });
    toast.success('Reschedule proposal sent to student!');
  };

  // ── APPROVE STUDENT'S RESCHEDULE REQUEST ──────────────────────────────────
  const handleApproveStudentRequest = (apt: Appointment) => {
    if (!apt.rescheduleProposal) return;
    if (checkConflict(apt.counselorId, apt.rescheduleProposal.newDate, apt.rescheduleProposal.newTimeSlot, apt.id)) {
      toast.error("That slot is already taken. Use 'Propose different time' instead."); return;
    }
    applyChange(apt.id, {
      status:             'rescheduled',
      date:               apt.rescheduleProposal.newDate,
      timeSlot:           apt.rescheduleProposal.newTimeSlot,
      rescheduleProposal: null,
    });
    toast.success("Student's reschedule request approved!");
  };

  // ── COUNTER-PROPOSE ───────────────────────────────────────────────────────
  const handleOpenCounter = (apt: Appointment) => {
    setCounterData({ newDate: '', newTimeSlot: '', reason: '' });
    setCounterDialog({ open: true, appointment: apt });
  };

  const handleSubmitCounter = () => {
    if (!counterData.newDate || !counterData.newTimeSlot) {
      toast.error('Please select a new date and time slot.'); return;
    }
    if (!counterData.reason.trim()) {
      toast.error('Please provide a reason.'); return;
    }
    const apt = counterDialog.appointment!;
    if (checkConflict(apt.counselorId, counterData.newDate, counterData.newTimeSlot, apt.id)) {
      toast.error('That time slot is already booked. Please choose a different one.'); return;
    }
    applyChange(apt.id, {
      status: 'reschedule_proposed',
      rescheduleProposal: {
        newDate:     counterData.newDate,
        newTimeSlot: counterData.newTimeSlot,
        reason:      counterData.reason.trim(),
        proposedAt:  new Date().toISOString(),
        proposedBy:  'counselor',
      },
    });
    setCounterDialog({ open: false, appointment: null });
    toast.success('Alternative schedule sent to student!');
  };

  // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
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

  const handleLogout = () => { logout(); toast.success('Logged out successfully.'); navigate('/'); };

  // ── derived ───────────────────────────────────────────────────────────────

  const pendingGroup  = appointments.filter((a) =>
    ['pending', 'reschedule_requested', 'reschedule_proposed'].includes(a.status)
  );
  const upcomingGroup = appointments.filter((a) =>
    ['confirmed', 'rescheduled'].includes(a.status)
  );
  const completedGroup = appointments.filter((a) => a.status === 'completed');

  const tabAppointments =
    activeTab === 'pending'   ? pendingGroup   :
    activeTab === 'upcoming'  ? upcomingGroup  :
    completedGroup;

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
              <p className="text-xs text-gray-400">Counselor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-300 hidden sm:block">{isAvailable ? 'Available' : 'Unavailable'}</span>
            </div>
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
          <div className="relative bg-white w-80 h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="bg-gray-900 text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-bold">Counselor Profile</p>
                <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
                  <UserIcon className="w-7 h-7 text-black" />
                </div>
                <div>
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400">{user.id}</p>
                  <p className={`text-xs ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                    {isAvailable ? '● Available' : '● Unavailable'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-3">
              {[{ label:'Email', value:user.email, icon:Mail }, { label:'Contact', value:user.contactNumber, icon:Phone }].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-100">
                  <Icon className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                    <p className="text-sm text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Handled Programs</p>
                    <div className="flex flex-wrap gap-1">
                      {user.assignedPrograms?.map((p) => (
                        <span key={p} className="inline-block bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Availability Status</p>
                    <p className="text-sm text-gray-700">{isAvailable ? 'Accepting appointments' : 'Not accepting'}</p>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(v) => { setIsAvailable(v); toast.success(v ? 'Now available' : 'Marked as unavailable'); }}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
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

      {/* ── SESSION REPORT DIALOG — narrative summary REQUIRED ── */}
      <Dialog open={reportDialog.open} onOpenChange={(open) => setReportDialog({ open, appointmentId: null, appointment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" /> Session Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reportDialog.appointment && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs font-bold uppercase text-gray-700 mb-2">Session Information</p>
                <p className="text-xs text-gray-600"><span className="font-semibold">Student:</span> {reportDialog.appointment.studentName}</p>
                <p className="text-xs text-gray-600"><span className="font-semibold">Program:</span> {reportDialog.appointment.program}</p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(reportDialog.appointment.date).toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}{' '}
                  at {reportDialog.appointment.timeSlot}
                </p>
                {reportDialog.appointment.purpose && (
                  <p className="text-xs text-gray-600"><span className="font-semibold">Purpose:</span> {reportDialog.appointment.purpose}</p>
                )}
              </div>
            )}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Session Type *</Label>
              <Select
                value={reportData.sessionType}
                onValueChange={(v) => {
                  setReportData({ ...reportData, sessionType: v as any });
                  setReportErrors({ ...reportErrors, sessionType: '' });
                }}
              >
                <SelectTrigger className={`mt-1 border-2 ${reportErrors.sessionType ? 'border-red-400' : 'border-gray-300'}`}>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {['Personal','Academic','Career','Others'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reportErrors.sessionType && (
                <p className="text-xs text-red-500 mt-1">{reportErrors.sessionType}</p>
              )}
            </div>
            <div>
              {/* ── CHANGED: removed "(Optional)" — now REQUIRED ── */}
              <Label className="text-xs uppercase font-bold text-gray-700">
                Narrative Summary <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Write a summary of the session, key concerns discussed, and any recommendations..."
                value={reportData.narrativeSummary}
                onChange={(e) => {
                  setReportData({ ...reportData, narrativeSummary: e.target.value });
                  setReportErrors({ ...reportErrors, narrativeSummary: '' });
                }}
                className={`mt-1 border-2 ${reportErrors.narrativeSummary ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-yellow-500'} min-h-[140px]`}
              />
              {reportErrors.narrativeSummary
                ? <p className="text-xs text-red-500 mt-1">{reportErrors.narrativeSummary}</p>
                : <p className="text-xs text-gray-400 mt-1">Required. Describe what was discussed and any follow-up needed.</p>
              }
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmitReport} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">Mark as Completed</button>
              <button onClick={() => setReportDialog({ open:false, appointmentId:null, appointment:null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── NEW: FACULTY REPORT DIALOG ── */}
      <Dialog open={facultyReportDialog.open} onOpenChange={(open) => setFacultyReportDialog({ open, appointment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" /> Send Report to Faculty
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {facultyReportDialog.appointment && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Regarding</p>
                <p className="text-xs text-gray-700"><span className="font-semibold">Student:</span> {facultyReportDialog.appointment.studentName}</p>
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Session:</span>{' '}
                  {new Date(facultyReportDialog.appointment.date).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })} · {facultyReportDialog.appointment.purpose}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Send to Faculty Member *</Label>
              <Select value={facultyReportData.facultyId} onValueChange={(v) => setFacultyReportData({ ...facultyReportData, facultyId: v })}>
                <SelectTrigger className="mt-1 border-2 border-gray-300">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {facultyMembers.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} — {f.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">
                Short Report for Faculty *{' '}
                <span className="normal-case font-normal text-gray-500">(keep brief — no sensitive details)</span>
              </Label>
              <Textarea
                placeholder="e.g. Student attended the session. Key academic concerns were discussed. Recommended follow-up in 2 weeks. No urgent concerns at this time."
                value={facultyReportData.summary}
                onChange={(e) => setFacultyReportData({ ...facultyReportData, summary: e.target.value })}
                className="mt-1 border-2 border-gray-300 focus:border-blue-500 min-h-[110px]"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <p className="font-semibold uppercase mb-0.5">Privacy reminder</p>
              <p>Only share general outcomes. Do not include sensitive personal disclosures in the faculty report.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSendFacultyReport} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded uppercase text-sm tracking-wide transition">Send Report</button>
              <button onClick={() => setFacultyReportDialog({ open:false, appointment:null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── COUNSELOR-INITIATED RESCHEDULE DIALOG ── */}
      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog({ open, appointment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-yellow-500" /> Propose Reschedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {rescheduleDialog.appointment && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Current Schedule</p>
                <p className="text-xs text-gray-700"><span className="font-semibold">Student:</span> {rescheduleDialog.appointment.studentName}</p>
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">Date:</span>{' '}
                  {new Date(rescheduleDialog.appointment.date).toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}{' '}
                  at {rescheduleDialog.appointment.timeSlot}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">New Date *</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input type="date" value={rescheduleData.newDate} onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="pl-8 border-2 border-gray-300 focus:border-yellow-500" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">New Time Slot *</Label>
              <Select value={rescheduleData.newTimeSlot} onValueChange={(v) => setRescheduleData({ ...rescheduleData, newTimeSlot: v })}>
                <SelectTrigger className="mt-1 border-2 border-gray-300"><SelectValue placeholder="Select a time slot" /></SelectTrigger>
                <SelectContent>{timeSlots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">
                Reason * <span className="normal-case font-normal text-gray-500">(shown to student)</span>
              </Label>
              <Textarea placeholder="e.g. I have an emergency meeting at the original time..." value={rescheduleData.reason} onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })} className="mt-1 border-2 border-gray-300 focus:border-yellow-500 min-h-[90px]" />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              The student will be notified and can <strong>accept</strong> or <strong>decline</strong> your proposed schedule.
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmitReschedule} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">Send Proposal to Student</button>
              <button onClick={() => setRescheduleDialog({ open:false, appointment:null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── COUNTER-PROPOSE DIALOG ── */}
      <Dialog open={counterDialog.open} onOpenChange={(open) => setCounterDialog({ open, appointment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-pink-500" /> Propose a Different Time
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {counterDialog.appointment?.rescheduleProposal && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded">
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Student's Requested Time</p>
                <p className="text-xs text-gray-700">
                  {new Date(counterDialog.appointment.rescheduleProposal.newDate).toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}{' '}
                  at {counterDialog.appointment.rescheduleProposal.newTimeSlot}
                </p>
                <p className="text-xs text-gray-500 italic mt-1">"{counterDialog.appointment.rescheduleProposal.reason}"</p>
              </div>
            )}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Your Proposed Date *</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input type="date" value={counterData.newDate} onChange={(e) => setCounterData({ ...counterData, newDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="pl-8 border-2 border-gray-300 focus:border-pink-500" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Your Proposed Time Slot *</Label>
              <Select value={counterData.newTimeSlot} onValueChange={(v) => setCounterData({ ...counterData, newTimeSlot: v })}>
                <SelectTrigger className="mt-1 border-2 border-gray-300"><SelectValue placeholder="Select a time slot" /></SelectTrigger>
                <SelectContent>{timeSlots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">
                Reason * <span className="normal-case font-normal text-gray-500">(why you can't do the student's time)</span>
              </Label>
              <Textarea placeholder="e.g. I have a department meeting at that time. I'm proposing an alternative..." value={counterData.reason} onChange={(e) => setCounterData({ ...counterData, reason: e.target.value })} className="mt-1 border-2 border-gray-300 focus:border-pink-500 min-h-[90px]" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmitCounter} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">Send Alternative to Student</button>
              <button onClick={() => setCounterDialog({ open:false, appointment:null })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition">Cancel</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              {[
                { label:'Current Password', key:'current', placeholder:'Enter current password' },
                { label:'New Password',     key:'newPass', placeholder:'Min. 8 characters' },
                { label:'Confirm Password', key:'confirm', placeholder:'Re-enter new password' },
              ].map(({ label, key, placeholder }) => (
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

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label:'Pending',   value: pendingGroup.length,   color:'border-yellow-400 bg-yellow-50', textColor:'text-yellow-800' },
            { label:'Upcoming',  value: upcomingGroup.length,  color:'border-green-400 bg-green-50',   textColor:'text-green-800' },
            { label:'Completed', value: completedGroup.length, color:'border-blue-400 bg-blue-50',     textColor:'text-blue-800' },
          ].map(({ label, value, color, textColor }) => (
            <div key={label} className={`${color} border-2 rounded-lg shadow p-4 text-center`}>
              <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
              <p className="text-xs uppercase text-gray-600 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-lg shadow border-2 border-gray-200">
          <div className="flex items-center gap-1 p-4 border-b-2 border-gray-200">
            <Calendar className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm mr-4">Appointments</h3>
            {(['pending', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${activeTab === tab ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tab === 'upcoming' ? 'Confirmed' : tab}
                {tab === 'pending' && pendingGroup.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{pendingGroup.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-100">
            {tabAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3" />
                <p className="font-semibold uppercase text-sm">No {activeTab} appointments</p>
              </div>
            ) : tabAppointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">Counseling Session with {apt.studentName}</h4>
                    <p className="text-xs text-gray-500">{apt.program}</p>
                    {/* ── NEW: show referral badge if applicable ── */}
                    {apt.referredByFacultyName && (
                      <p className="text-xs text-blue-600 mt-0.5">Referred by: {apt.referredByFacultyName}</p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(apt.status)} border text-xs uppercase font-bold ml-2`}>
                    {getStatusLabel(apt.status)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-yellow-500" />
                    {new Date(apt.date).toLocaleDateString('en-PH', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    {apt.timeSlot}
                  </span>
                </div>

                {apt.purpose && <p className="text-xs text-gray-600"><span className="font-semibold">Purpose:</span> {apt.purpose}</p>}
                {apt.narrativeSummary && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <p className="font-semibold uppercase mb-1">Session Summary:</p>
                    <p>{apt.narrativeSummary}</p>
                  </div>
                )}
                {/* ── NEW: show faculty report sent badge ── */}
                {apt.facultyReport && (
                  <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    <p className="font-semibold uppercase mb-0.5">Faculty Report Sent</p>
                    <p>To: {apt.facultyReport.facultyName} · {new Date(apt.facultyReport.sentAt).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}</p>
                  </div>
                )}

                {/* ── STUDENT REQUESTED RESCHEDULE — counselor actions ── */}
                {apt.status === 'reschedule_requested' && apt.rescheduleProposal && (
                  <div className="mt-2 p-3 bg-pink-50 border border-pink-200 rounded">
                    <p className="text-xs font-bold uppercase text-pink-800 mb-1">Student requested a reschedule</p>
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Requested:</span>{' '}
                      {new Date(apt.rescheduleProposal.newDate).toLocaleDateString('en-PH', { weekday:'short', month:'long', day:'numeric', year:'numeric' })}{' '}
                      at {apt.rescheduleProposal.newTimeSlot}
                    </p>
                    <p className="text-xs text-gray-600 italic mt-0.5">"{apt.rescheduleProposal.reason}"</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApproveStudentRequest(apt)}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve student's time
                      </button>
                      <button
                        onClick={() => handleOpenCounter(apt)}
                        className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 hover:bg-yellow-100 border border-yellow-400 text-yellow-800 font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                      >
                        <CalendarClock className="w-3 h-3" /> Propose different time
                      </button>
                    </div>
                  </div>
                )}

                {/* ── COUNSELOR PROPOSED — awaiting student ── */}
                {apt.status === 'reschedule_proposed' && apt.rescheduleProposal && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
                    <p className="font-semibold uppercase mb-1">Reschedule Proposal Sent — Awaiting Student</p>
                    <p>
                      Proposed:{' '}
                      {new Date(apt.rescheduleProposal.newDate).toLocaleDateString('en-PH', { weekday:'short', month:'long', day:'numeric', year:'numeric' })}{' '}
                      at {apt.rescheduleProposal.newTimeSlot}
                    </p>
                  </div>
                )}

                {/* ── PENDING — accept or propose reschedule ── */}
                {apt.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleConfirm(apt.id)} className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition">
                      <CheckCircle className="w-3 h-3" /> Accept
                    </button>
                    <button onClick={() => handleOpenReschedule(apt)} className="flex-1 flex items-center justify-center gap-1 bg-yellow-50 hover:bg-yellow-100 border border-yellow-400 text-yellow-800 font-bold py-1.5 rounded text-xs uppercase tracking-wide transition">
                      <CalendarClock className="w-3 h-3" /> Propose Reschedule
                    </button>
                  </div>
                )}

                {/* ── CONFIRMED / RESCHEDULED — mark done or add report ── */}
                {(apt.status === 'confirmed' || apt.status === 'rescheduled') && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleMarkDone(apt.id)} className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition">
                      <CheckCircle className="w-3 h-3" /> Mark as Done
                    </button>
                    <button onClick={() => handleOpenReport(apt)} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition">
                      <FileText className="w-3 h-3" /> Add Report
                    </button>
                    <button onClick={() => handleOpenReschedule(apt)} className="flex items-center justify-center gap-1 bg-yellow-50 hover:bg-yellow-100 border border-yellow-400 text-yellow-800 font-bold py-1.5 px-2 rounded text-xs uppercase tracking-wide transition">
                      <CalendarClock className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* ── COMPLETED — edit report + send to faculty ── */}
                {apt.status === 'completed' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleOpenReport(apt)} className="flex-1 flex items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1.5 rounded text-xs uppercase tracking-wide transition">
                      <FileText className="w-3 h-3" /> {apt.narrativeSummary ? 'Edit Report' : 'Add Report'}
                    </button>
                    {/* ── NEW: Send to Faculty button ── */}
                    <button onClick={() => handleOpenFacultyReport(apt)} className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold py-1.5 px-3 rounded text-xs uppercase tracking-wide transition">
                      <Send className="w-3 h-3" /> Faculty
                    </button>
                  </div>
                )}

                {/* ── RESCHEDULE_PROPOSED — waiting note ── */}
                {apt.status === 'reschedule_proposed' && (
                  <p className="mt-2 text-center text-xs text-purple-600 font-semibold uppercase">
                    Waiting for student's response…
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
