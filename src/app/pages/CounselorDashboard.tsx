import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getCurrentUser, logout } from '../lib/auth';
import { getAppointmentsByCounselor, Appointment } from '../lib/mockData';
import { toast } from 'sonner';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Menu, X,
  User, LogOut, Phone, Mail, BookOpen, ChevronRight, FileText, Key
} from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

export function CounselorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed'>('pending');
  const [reportDialog, setReportDialog] = useState<{ open: boolean; appointmentId: string | null; appointment?: Appointment | null }>({ open: false, appointmentId: null, appointment: null });
  const [reportData, setReportData] = useState({ narrativeSummary: '', sessionType: '' as Appointment['sessionType'] });
  const [declineDialog, setDeclineDialog] = useState<{ open: boolean; appointmentId: string | null }>({ open: false, appointmentId: null });
  const [cancellationReason, setCancellationReason] = useState('');
  const [showProfileImageUpload, setShowProfileImageUpload] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });

  const refreshAppointments = () => {
    if (user) {
      setAppointments(getAppointmentsByCounselor(user.id));
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'counselor') {
      navigate('/');
      return;
    }
    setIsAvailable(user.isAvailable || false);
    refreshAppointments();
    const id = setInterval(refreshAppointments, 3000);
    return () => clearInterval(id);
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleAppointmentAction = (appointmentId: string, action: 'confirm' | 'cancel' | 'complete' | 'markDone') => {
    if (action === 'complete') {
      const apt = appointments.find(a => a.id === appointmentId);
      setReportDialog({ open: true, appointmentId, appointment: apt || null });
      return;
    }

    if (action === 'cancel') {
      setDeclineDialog({ open: true, appointmentId });
      return;
    }

    const stored: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
    let newStatus: string;
    if (action === 'confirm') newStatus = 'confirmed';
    else if (action === 'markDone') newStatus = 'completed';
    else newStatus = 'cancelled';

    const updated = stored.map((apt) =>
      apt.id === appointmentId ? { ...apt, status: newStatus } : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updated));
    setAppointments(appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: newStatus as Appointment['status'] } : apt
    ));
    if (action === 'confirm') toast.success('Appointment confirmed!');
    else if (action === 'markDone') toast.success('Session marked as done!');
    else toast.success('Appointment declined.');
  };

  const handleCompleteWithReport = () => {
    if (!reportData.sessionType) {
      toast.error('Please select a session type.');
      return;
    }
    const stored: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = stored.map((apt) =>
      apt.id === reportDialog.appointmentId
        ? { ...apt, status: 'completed', sessionType: reportData.sessionType, narrativeSummary: reportData.narrativeSummary }
        : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updated));
    setAppointments(appointments.map(apt =>
      apt.id === reportDialog.appointmentId
        ? { ...apt, status: 'completed', sessionType: reportData.sessionType, narrativeSummary: reportData.narrativeSummary }
        : apt
    ));
    setReportDialog({ open: false, appointmentId: null, appointment: null });
    setReportData({ narrativeSummary: '', sessionType: '' as any });
    toast.success('Report submitted successfully!');
  };

  const openReportForCompleted = (apt: Appointment) => {
    setReportData({ narrativeSummary: apt.narrativeSummary || '', sessionType: apt.sessionType || '' as any });
    setReportDialog({ open: true, appointmentId: apt.id, appointment: apt });
  };

  const handleCancelWithReason = () => {
    if (!cancellationReason) {
      toast.error('Please provide a cancellation reason.');
      return;
    }
    const stored: Appointment[] = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = stored.map((apt) =>
      apt.id === declineDialog.appointmentId
        ? { ...apt, status: 'cancelled', cancellationReason }
        : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updated));
    setAppointments(appointments.map(apt =>
      apt.id === declineDialog.appointmentId
        ? { ...apt, status: 'cancelled', cancellationReason }
        : apt
    ));
    setDeclineDialog({ open: false, appointmentId: null });
    setCancellationReason('');
    toast.success('Appointment cancelled with reason.');
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

  const pending = appointments.filter(a => a.status === 'pending');
  const upcoming = appointments.filter(a => a.status === 'confirmed');
  const completed = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const tabAppointments = activeTab === 'pending' ? pending : activeTab === 'upcoming' ? upcoming : completed;

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

      {/* Profile Drawer */}
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
                  <User className="w-7 h-7 text-black" />
                </div>
                <div>
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400">{user.id}</p>
                  <p className="text-xs text-green-400">{isAvailable ? '● Available' : '● Unavailable'}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-3">
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
              {/* Handled Programs */}
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Handled Programs</p>
                    <div className="flex flex-wrap gap-1">
                      {user.assignedPrograms?.map((p) => (
                        <span key={p} className="inline-block bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Availability Toggle */}
              <div className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Availability Status</p>
                    <p className="text-sm text-gray-700">{isAvailable ? 'Accepting appointments' : 'Not accepting'}</p>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(v) => {
                      setIsAvailable(v);
                      toast.success(v ? 'Now available for appointments' : 'Marked as unavailable');
                    }}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
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

      {/* Complete Session Report Dialog */}
      <Dialog open={reportDialog.open} onOpenChange={(open) => setReportDialog({ open, appointmentId: null, appointment: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" />
              Session Report / Ulat ng Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Counseling Session Info */}
            {reportDialog.appointment && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs font-bold uppercase text-gray-700 mb-2">Counseling Session Information</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600"><span className="font-semibold">Student:</span> {reportDialog.appointment.studentName}</p>
                  <p className="text-xs text-gray-600"><span className="font-semibold">Program:</span> {reportDialog.appointment.program}</p>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Date and Time of the Session:</span>{' '}
                    {new Date(reportDialog.appointment.date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}{' '}
                    at {reportDialog.appointment.timeSlot}
                  </p>
                  {reportDialog.appointment.purpose && (
                    <p className="text-xs text-gray-600"><span className="font-semibold">Purpose:</span> {reportDialog.appointment.purpose}</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Session Type *</Label>
              <Select value={reportData.sessionType} onValueChange={(v) => setReportData({ ...reportData, sessionType: v as any })}>
                <SelectTrigger className="mt-1 border-2 border-gray-300">
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Career">Career</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Narrative Summary / Maikling Buod (Optional)</Label>
              <Textarea
                placeholder="Write a brief summary of the session... (Isulat ang maikling buod ng session...)"
                value={reportData.narrativeSummary}
                onChange={(e) => setReportData({ ...reportData, narrativeSummary: e.target.value })}
                className="mt-1 border-2 border-gray-300 focus:border-yellow-500 min-h-[120px]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCompleteWithReport}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => setReportDialog({ open: false, appointmentId: null, appointment: null })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Appointment Dialog */}
      <Dialog open={declineDialog.open} onOpenChange={(open) => setDeclineDialog({ open, appointmentId: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Decline Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase font-bold text-gray-700">Reason for Declining *</Label>
              <Textarea
                placeholder="Provide a reason for declining the appointment..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-1 border-2 border-gray-300 focus:border-red-500 min-h-[120px]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancelWithReason}
                className="flex-1 bg-red-400 hover:bg-red-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Decline Appointment
              </button>
              <button
                onClick={() => setDeclineDialog({ open: false, appointmentId: null })}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded uppercase text-sm tracking-wide transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', value: pending.length, color: 'border-yellow-400 bg-yellow-50', textColor: 'text-yellow-800' },
            { label: 'Upcoming', value: upcoming.length, color: 'border-green-400 bg-green-50', textColor: 'text-green-800' },
            { label: 'Completed', value: completed.filter(a => a.status === 'completed').length, color: 'border-blue-400 bg-blue-50', textColor: 'text-blue-800' },
          ].map(({ label, value, color, textColor }) => (
            <div key={label} className={`${color} border-2 rounded-lg shadow p-4 text-center`}>
              <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
              <p className="text-xs uppercase text-gray-600 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
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
                {tab === 'pending' && pending.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{pending.length}</span>
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
            ) : (
              tabAppointments.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">
                        Counseling Session with {apt.studentName}
                      </h4>
                      <p className="text-xs text-gray-500">{apt.program}</p>
                    </div>
                    <Badge className={`${getStatusColor(apt.status)} border text-xs uppercase font-bold ml-2`}>
                      {apt.status}
                    </Badge>
                  </div>

                  {/* Date, Time, Purpose */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-yellow-500" />
                      {new Date(apt.date).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
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
                  {apt.notes && <p className="text-xs text-gray-500 mt-1"><span className="font-semibold">Notes:</span> {apt.notes}</p>}

                  {/* Action Buttons */}
                  {apt.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAppointmentAction(apt.id, 'confirm')}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                      >
                        <CheckCircle className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => handleAppointmentAction(apt.id, 'cancel')}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                      >
                        <XCircle className="w-3 h-3" /> Decline
                      </button>
                    </div>
                  )}
                  {apt.status === 'confirmed' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAppointmentAction(apt.id, 'markDone')}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark as Done
                      </button>
                      <button
                        onClick={() => handleAppointmentAction(apt.id, 'complete')}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                      >
                        <FileText className="w-3 h-3" /> Add Report
                      </button>
                    </div>
                  )}
                  {apt.status === 'completed' && (
                    <button
                      onClick={() => openReportForCompleted(apt)}
                      className="mt-3 w-full flex items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1.5 rounded text-xs uppercase tracking-wide transition"
                    >
                      <FileText className="w-3 h-3" /> {apt.narrativeSummary ? 'Edit Report' : 'Add Report'}
                    </button>
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