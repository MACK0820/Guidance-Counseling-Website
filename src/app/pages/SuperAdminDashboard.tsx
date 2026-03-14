import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { getCurrentUser, logout, getRegisteredStudents } from '../lib/auth';
import { getAllAppointments, mockUsers, Appointment, User } from '../lib/mockData';
import { toast } from 'sonner';
import {
  Calendar, Clock, LogOut, User as UserIcon, Users, Search, GraduationCap,
  Menu, X, Mail, Phone, Settings, Shield, Globe, Puzzle, Palette,
  Trash2, Plus, RefreshCw, AlertTriangle, CheckCircle, FileText, BookOpen,
  Database, HardDrive, Bell, Key, UserPlus, UserCog, Archive, Eye, ChevronRight
} from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'users' | 'reports' | 'data'>('overview');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  
  // Dialog states
  const [addAdminDialog, setAddAdminDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [appointmentRulesDialog, setAppointmentRulesDialog] = useState(false);
  const [departmentsDialog, setDepartmentsDialog] = useState(false);
  const [roleManagementDialog, setRoleManagementDialog] = useState(false);
  const [systemSettingsDialog, setSystemSettingsDialog] = useState(false);
  const [dataGovernanceDialog, setDataGovernanceDialog] = useState(false);

  const [newAdminData, setNewAdminData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  
  // Mock data
  const allStudents = [...mockUsers.filter(u => u.role === 'student'), ...getRegisteredStudents()];
  const uniqueStudents = allStudents.filter((s, i, self) => i === self.findIndex(x => x.id === s.id));
  const counselors = mockUsers.filter(u => u.role === 'counselor');
  const admins = mockUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
  const pendingCounselors = counselors.filter(c => c.isPendingApproval);

  const refreshAppointments = () => setAppointments(getAllAppointments());

  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
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

  const handleAddAdmin = () => {
    if (!newAdminData.firstName || !newAdminData.email || !newAdminData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!newAdminData.email.endsWith('@tip.edu.ph')) {
      toast.error('Email must end with @tip.edu.ph');
      return;
    }
    if (!newAdminData.email.startsWith('a')) {
      toast.error('Admin email must start with "a"');
      return;
    }
    toast.success(`Admin ${newAdminData.firstName} added successfully! (Demo only)`);
    setAddAdminDialog(false);
    setNewAdminData({ firstName: '', lastName: '', email: '', password: '' });
  };

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
              <p className="text-xs text-gray-400">Super Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1 text-xs text-yellow-400 font-bold uppercase">
              <Shield className="w-4 h-4" /> Super Admin
            </span>
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
                <p className="text-xs uppercase tracking-widest text-yellow-400 font-bold">Super Admin Profile</p>
                <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Shield className="w-7 h-7 text-black" />
                </div>
                <div>
                  <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-yellow-400 uppercase font-bold">Super Administrator</p>
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
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Full System Permissions</p>
                {[
                  'System configuration & override access',
                  'User management (all roles)',
                  'Approve counselor registrations',
                  'Configure appointment rules',
                  'Manage departments & programs',
                  'System-wide settings control',
                  'Data governance & archiving',
                ].map((p) => (
                  <p key={p} className="text-xs text-green-700 py-0.5">✓ {p}</p>
                ))}
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

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialog} onOpenChange={setAddAdminDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-yellow-500" /> Add New Admin
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add a new administrator to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase font-bold">First Name *</Label>
                <Input value={newAdminData.firstName} onChange={e => setNewAdminData({ ...newAdminData, firstName: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase font-bold">Last Name *</Label>
                <Input value={newAdminData.lastName} onChange={e => setNewAdminData({ ...newAdminData, lastName: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold">Email * (must start with 'a' and end with @tip.edu.ph)</Label>
              <Input value={newAdminData.email} onChange={e => setNewAdminData({ ...newAdminData, email: e.target.value })} className="mt-1" placeholder="ajohncruz@tip.edu.ph" />
            </div>
            <div>
              <Label className="text-xs uppercase font-bold">Temporary Password *</Label>
              <Input type="password" value={newAdminData.password} onChange={e => setNewAdminData({ ...newAdminData, password: e.target.value })} className="mt-1" />
            </div>
            <button onClick={handleAddAdmin} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">
              Add Admin
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Counselor Dialog */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Approve Counselor Registrations
            </DialogTitle>
            <DialogDescription className="sr-only">
              Review and approve pending counselor registration requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {pendingCounselors.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No pending counselor registrations.</p>
            ) : (
              pendingCounselors.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toast.success(`Approved ${c.firstName} (Demo)`)} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Approve</button>
                    <button onClick={() => toast.error(`Rejected ${c.firstName} (Demo)`)} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Rules Dialog */}
      <Dialog open={appointmentRulesDialog} onOpenChange={setAppointmentRulesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-yellow-500" /> Configure Appointment Rules
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configure system-wide appointment rules and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase font-bold">Appointment Hours</Label>
              <Select defaultValue="8am-5pm">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8am-5pm">8:00 AM - 5:00 PM</SelectItem>
                  <SelectItem value="9am-6pm">9:00 AM - 6:00 PM</SelectItem>
                  <SelectItem value="7am-7pm">7:00 AM - 7:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold">Max Appointments per Student per Month</Label>
              <Input type="number" defaultValue="4" className="mt-1" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs uppercase font-bold text-gray-700">Auto-approve appointments</p>
                <p className="text-xs text-gray-500">Automatically confirm appointments without counselor approval</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs uppercase font-bold text-gray-700">Allow same-day bookings</p>
                <p className="text-xs text-gray-500">Students can book appointments for the same day</p>
              </div>
              <Switch defaultChecked />
            </div>
            <button onClick={() => { toast.success('Appointment rules updated! (Demo)'); setAppointmentRulesDialog(false); }} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition">
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Departments Dialog */}
      <Dialog open={departmentsDialog} onOpenChange={setDepartmentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-500" /> Manage Departments & Programs
            </DialogTitle>
            <DialogDescription className="sr-only">
              Manage academic departments and programs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {[
              { dept: 'College of Engineering', programs: ['Bachelor of Science in Architecture', 'Bachelor of Science in Chemical Engineering', 'Bachelor of Science in Civil Engineering', 'Bachelor of Science in Mechanical Engineering', 'Bachelor of Science in Electrical Engineering', 'Bachelor of Science in Electronics Engineering', 'Bachelor of Science in Computer Engineering', 'Bachelor of Science in Industrial Engineering'] },
              { dept: 'College of Computer Studies', programs: ['Bachelor of Science in Computer Science', 'Bachelor of Science in Data Science and Analytics', 'Bachelor of Science in Entertainment and Multimedia Computing', 'Bachelor of Science in Information Systems', 'Bachelor of Science in Information Technology'] },
              { dept: 'College of Business Education', programs: ['Bachelor of Science in Accountancy', 'Bachelor of Science in Accounting Information System', 'Bachelor of Science in Business Administration - Financial Management', 'Bachelor of Science in Business Administration - Human Resource Management', 'Bachelor of Science in Business Administration - Logistics and Supply Chain Management', 'Bachelor of Science in Business Administration - Marketing Management'] },
              { dept: 'College of Arts', programs: ['Bachelor of Arts in English Language', 'Bachelor of Arts in Political Science', 'Bachelor of Arts in Psychology'] },
            ].map((dept) => (
              <div key={dept.dept} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm text-gray-900">{dept.dept}</p>
                  <button onClick={() => toast.info(`Edit ${dept.dept} (Demo)`)} className="text-xs text-blue-500 hover:text-blue-700 font-bold">Edit</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dept.programs.map((p) => (
                    <span key={p} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded border border-gray-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => toast.info('Add new department (Demo)')} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 rounded uppercase text-sm tracking-wide transition mt-2">
            <Plus className="w-4 h-4 inline mr-1" /> Add New Department
          </button>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={roleManagementDialog} onOpenChange={setRoleManagementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-yellow-500" /> User Role Management
            </DialogTitle>
            <DialogDescription className="sr-only">
              Manage user roles and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase font-bold mb-2 block">Promote/Demote Admins</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {admins.filter(a => a.role === 'admin').map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{admin.firstName} {admin.lastName}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toast.success(`Promoted ${admin.firstName} to Super Admin (Demo)`)} className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">Promote</button>
                      <button onClick={() => toast.warning(`Demoted ${admin.firstName} (Demo)`)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">Demote</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold mb-2 block">Reset Account Password</Label>
              <div className="flex gap-2">
                <Input placeholder="Enter user email" className="flex-1" />
                <button onClick={() => toast.success('Password reset email sent! (Demo)')} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded text-xs uppercase">
                  Reset
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold">Assign Custom Permissions</Label>
              <p className="text-xs text-gray-500 mt-1">Fine-grained permission control for specific users.</p>
              <button onClick={() => toast.info('Permission management (Demo)')} className="mt-2 w-full border-2 border-dashed border-gray-300 hover:border-yellow-400 text-gray-600 hover:text-yellow-600 font-bold py-2 rounded text-xs uppercase transition">
                Configure Permissions
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Settings Dialog */}
      <Dialog open={systemSettingsDialog} onOpenChange={setSystemSettingsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-yellow-500" /> System-Wide Settings
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configure system-wide settings including backups, logs, and notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { label: 'Backup Database', icon: Database, desc: 'Create a full system backup', action: 'Backup Now' },
              { label: 'View System Logs', icon: FileText, desc: 'Access activity and error logs', action: 'View Logs' },
              { label: 'Email Notifications', icon: Bell, desc: 'Configure email notification settings', action: 'Configure' },
              { label: 'SMS Integrations', icon: Phone, desc: 'Set up SMS notification gateway', action: 'Setup' },
              { label: 'Security Settings', icon: Shield, desc: 'Password policies, 2FA, session timeout', action: 'Manage' },
              { label: 'Customize Platform', icon: Palette, desc: 'Branding, colors, and theme settings', action: 'Customize' },
            ].map(({ label, icon: Icon, desc, action }) => (
              <div key={label} className="flex items-start justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 transition">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <button onClick={() => toast.info(`${action}: ${label} (Demo)`)} className="text-xs font-bold text-blue-500 hover:text-blue-700 uppercase">
                  {action}
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Governance Dialog */}
      <Dialog open={dataGovernanceDialog} onOpenChange={setDataGovernanceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide text-gray-900 flex items-center gap-2">
              <Archive className="w-5 h-5 text-yellow-500" /> Data Governance
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configure data archiving and retention policies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase font-bold">Archive Old Records</Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">Archive appointments and records older than:</p>
              <Select defaultValue="1year">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 months</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="2years">2 years</SelectItem>
                  <SelectItem value="5years">5 years</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => toast.success('Records archived! (Demo)')} className="w-full mt-2 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 rounded text-xs uppercase">
                Archive Now
              </button>
            </div>
            <div>
              <Label className="text-xs uppercase font-bold">Data Retention Policies</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-700">Student records retention</span>
                  <span className="text-xs font-bold text-gray-900">5 years</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-700">Appointment records retention</span>
                  <span className="text-xs font-bold text-gray-900">3 years</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-700">Counselor reports retention</span>
                  <span className="text-xs font-bold text-gray-900">10 years</span>
                </div>
              </div>
              <button onClick={() => toast.info('Configure retention policies (Demo)')} className="w-full mt-2 border-2 border-gray-300 hover:border-yellow-400 text-gray-700 hover:text-yellow-700 font-bold py-2 rounded text-xs uppercase transition">
                Edit Policies
              </button>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
              <p className="text-xs font-bold text-yellow-800 uppercase mb-1">⚠️ Warning</p>
              <p className="text-xs text-yellow-700">Archived data can be recovered within 30 days. After that, it will be permanently deleted.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Appointments', value: appointments.length, icon: Calendar },
            { label: 'Total Users', value: uniqueStudents.length + counselors.length + admins.length, icon: Users },
            { label: 'Counselors', value: counselors.length, icon: UserIcon },
            { label: 'Completed Sessions', value: completedWithReports.length, icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border-2 border-gray-200 rounded-lg shadow p-4 flex items-center gap-3">
              <Icon className="w-8 h-8 text-yellow-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs uppercase text-gray-600 font-semibold">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border-2 border-gray-200">
          <div className="flex flex-wrap gap-1 p-4 border-b-2 border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'config', label: 'System Configuration', icon: Settings },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'reports', label: `Reports (${completedWithReports.length})`, icon: FileText },
              { id: 'data', label: 'Data Governance', icon: Database },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase transition ${activeTab === id ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search appointments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 border-2 border-gray-200" />
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
                        <h4 className="font-bold text-gray-900 text-sm">Counseling Session with {apt.counselorName}</h4>
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

          {/* System Configuration */}
          {activeTab === 'config' && (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-gray-600 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> System Configuration & Administration
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Add / Remove Admins', desc: 'Manage admin accounts', icon: UserPlus, action: () => setAddAdminDialog(true) },
                    { label: 'Approve Counselors', desc: 'Review pending counselor registrations', icon: CheckCircle, action: () => setApproveDialog(true), badge: pendingCounselors.length },
                    { label: 'Appointment Rules', desc: 'Configure hours, limits, auto-approval', icon: Calendar, action: () => setAppointmentRulesDialog(true) },
                    { label: 'Manage Departments', desc: 'Add/edit departments and programs', icon: BookOpen, action: () => setDepartmentsDialog(true) },
                  ].map(({ label, desc, icon: Icon, action, badge }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
                    >
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-2">
                          {label}
                          {badge !== undefined && badge > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{badge}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase text-gray-600 mb-3 flex items-center gap-2">
                  <UserCog className="w-4 h-4" /> User Role Management
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Promote / Demote Admins', desc: 'Change user roles and permissions', icon: UserCog, action: () => setRoleManagementDialog(true) },
                    { label: 'Reset Any Account', desc: 'Password reset and account recovery', icon: Key, action: () => setRoleManagementDialog(true) },
                  ].map(({ label, desc, icon: Icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase text-gray-600 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> System-Wide Settings
                </p>
                <button
                  onClick={() => setSystemSettingsDialog(true)}
                  className="w-full flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">Advanced System Settings</p>
                    <p className="text-xs text-gray-500">Backup, logs, notifications, security, customization</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <p className="text-xs font-bold uppercase text-gray-600">All System Users</p>
              </div>
              {/* Students */}
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Students ({uniqueStudents.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uniqueStudents.slice(0, 10).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-500">{s.program} · {s.id}</p>
                      </div>
                      <button onClick={() => toast.info(`View ${s.firstName}'s profile (Demo)`)} className="text-blue-400 hover:text-blue-600 text-xs font-bold">View</button>
                    </div>
                  ))}
                  {uniqueStudents.length > 10 && <p className="text-xs text-gray-400 text-center pt-2">... and {uniqueStudents.length - 10} more</p>}
                </div>
              </div>
              {/* Counselors */}
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Counselors ({counselors.length})</p>
                <div className="space-y-2">
                  {counselors.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                      <button onClick={() => toast.info(`Manage ${c.firstName} (Demo)`)} className="text-blue-400 hover:text-blue-600 text-xs font-bold">Manage</button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Admins */}
              <div className="p-4">
                <p className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Admins & Super Admins ({admins.length})</p>
                <div className="space-y-2">
                  {admins.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.firstName} {a.lastName} <span className="text-xs text-yellow-600 uppercase font-bold">({a.role})</span></p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </div>
                      {a.id !== user.id && (
                        <button onClick={() => toast.info(`Manage ${a.firstName} (Demo)`)} className="text-blue-400 hover:text-blue-600 text-xs font-bold uppercase">Manage</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {completedWithReports.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-semibold uppercase text-sm">No completed session reports</p>
                </div>
              ) : completedWithReports.map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Counseling Session with {apt.counselorName}</h4>
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
                      <p className="text-xs font-bold uppercase text-blue-700 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Counselor's Session Summary</p>
                      <p className="text-xs text-blue-900">{apt.narrativeSummary}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">No narrative summary provided.</p>
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

          {/* Data Governance */}
          {activeTab === 'data' && (
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-gray-600 mb-3 flex items-center gap-2">
                  <Archive className="w-4 h-4" /> Data Governance & Archiving
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Archive Old Records', desc: 'Move old appointments and records to archive', icon: Archive, action: () => setDataGovernanceDialog(true) },
                    { label: 'Data Retention Policies', desc: 'Configure how long data is kept', icon: HardDrive, action: () => setDataGovernanceDialog(true) },
                    { label: 'Export System Data', desc: 'Download all data for backup or migration', icon: Database, action: () => toast.info('Export data (Demo)') },
                  ].map(({ label, desc, icon: Icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-800 uppercase mb-2">ℹ️ About Super Admin Access</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Super Admin has <span className="font-bold">override access</span>, not daily operational access. 
                  This account is designed for system configuration, emergency interventions, and high-level administration. 
                  Regular management tasks should be delegated to Admin and Counselor accounts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}