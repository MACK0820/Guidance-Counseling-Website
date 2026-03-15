// Mock database for the application
export interface User {
  id: string;
  role: 'superadmin' | 'admin' | 'counselor' | 'student';
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  username?: string;
  studentId?: string;
  profileImage?: string;
  // Student-specific fields
  guardianName?: string;
  guardianContact?: string;
  dateOfBirth?: string;
  yearLevel?: string;
  program?: string;
  college?: string;
  sectionId?: string;
  gender?: string;
  address?: string;
  studentStatus?: 'Regular' | 'Irregular' | 'Returnee';
  hasSetPassword?: boolean;
  // Counselor-specific fields
  isAvailable?: boolean;
  assignedPrograms?: string[];
  isPendingApproval?: boolean;
}

export interface RescheduleProposal {
  newDate: string;
  newTimeSlot: string;
  reason: string;
  proposedAt: string;
  proposedBy: 'counselor' | 'student'; // who initiated this reschedule
}

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  counselorId: string;
  counselorName: string;
  counselorEmail?: string;
  date: string;
  timeSlot: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'reschedule_proposed'   // counselor proposed a new time → waiting on student
    | 'reschedule_requested'  // student requested a new time → waiting on counselor
    | 'rescheduled';          // both agreed on a new time
  program: string;
  purpose?: string;
  sessionType?: 'Personal' | 'Academic' | 'Career' | 'Others';
  reason?: string;
  notes?: string;
  narrativeSummary?: string;
  rescheduleProposal?: RescheduleProposal | null;
  createdAt?: string;
}

export interface CounselorAvailability {
  counselorId: string;
  date: string;
  timeSlot: string;
  isAvailable: boolean;
}

export interface SystemReport {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'counselor' | 'admin';
  userEmail: string;
  issueType: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

// Mock users
export const mockUsers: User[] = [
  {
    id: 'SA001',
    role: 'superadmin',
    email: 'amsantos@tip.edu.ph',
    password: 'super123',
    firstName: 'Maria',
    lastName: 'Santos',
    contactNumber: '09171234567',
    username: 'amsantos',
  },
  {
    id: 'A001',
    role: 'admin',
    email: 'aranya@tip.edu.ph',
    password: 'admin123',
    firstName: 'Ms. Ranya',
    lastName: 'Tongol',
    contactNumber: '09181234567',
    username: 'aranya',
  },
  {
    id: 'CHE001',
    role: 'counselor',
    email: 'cche@tip.edu.ph',
    password: 'che123',
    firstName: 'Ms. Cherry Anne',
    lastName: 'Ditablan',
    contactNumber: '09191234567',
    username: 'cche',
    isAvailable: true,
    assignedPrograms: [
      'Bachelor of Science in Architecture',
      'Bachelor of Science in Chemical Engineering',
    ],
  },
  {
    id: 'MON001',
    role: 'counselor',
    email: 'cmonique@tip.edu.ph',
    password: 'monique123',
    firstName: 'Ms. Ma. Eloisa Monique',
    lastName: 'Perez',
    contactNumber: '09201234567',
    username: 'cmonique',
    isAvailable: true,
    assignedPrograms: ['Bachelor of Science in Civil Engineering'],
  },
  {
    id: 'JHE001',
    role: 'counselor',
    email: 'cjhen@tip.edu.ph',
    password: 'jhen123',
    firstName: 'Ms. Jennifer',
    lastName: 'Nollora',
    contactNumber: '09211234567',
    username: 'cjhen',
    isAvailable: true,
    assignedPrograms: [
      'Bachelor of Science in Mechanical Engineering',
      'Bachelor of Science in Computer Science',
      'Bachelor of Science in Data Science and Analytics',
      'Bachelor of Science in Entertainment and Multimedia Computing',
      'Bachelor of Science in Information Technology',
    ],
  },
  {
    id: 'KIM001',
    role: 'counselor',
    email: 'ckim@tip.edu.ph',
    password: 'kim123',
    firstName: 'Ms. Kim Nicole',
    lastName: 'Garfin',
    contactNumber: '09221234567',
    username: 'ckim',
    isAvailable: true,
    assignedPrograms: [
      'Bachelor of Science in Accountancy',
      'Bachelor of Science in Accounting Information System',
      'Bachelor of Science in Business Administration - Financial Management',
      'Bachelor of Science in Business Administration - Human Resource Management',
      'Bachelor of Science in Business Administration - Logistics and Supply Chain Management',
      'Bachelor of Science in Business Administration - Marketing Management',
      'Bachelor of Arts in English Language',
      'Bachelor of Arts in Political Science',
      'Bachelor of Science in Industrial Engineering',
      'Bachelor of Science in Electrical Engineering',
    ],
  },
  {
    id: 'ROS001',
    role: 'counselor',
    email: 'crosh@tip.edu.ph',
    password: 'rosh123',
    firstName: 'Ms. Rochelle Anne',
    lastName: 'Caraig',
    contactNumber: '09231234567',
    username: 'crosh',
    isAvailable: true,
    assignedPrograms: [
      'Bachelor of Science in Electronics Engineering',
      'Bachelor of Science in Computer Engineering',
    ],
  },
  {
    id: 'S2024001',
    role: 'student',
    studentId: 'S2024001',
    email: 'sjuan@tip.edu.ph',
    password: 'student123',
    firstName: 'Juan',
    lastName: 'Rodriguez',
    contactNumber: '09221234567',
    guardianName: 'Pedro Rodriguez',
    guardianContact: '09231234567',
    dateOfBirth: '2005-03-15',
    yearLevel: '2',
    program: 'BS Computer Science',
    college: 'College of Computer Studies',
    sectionId: 'CS-2A',
    gender: 'Male',
    address: '123 Main St, Manila',
    studentStatus: 'Regular',
    hasSetPassword: true,
  },
  {
    id: 'S2024002',
    role: 'student',
    studentId: 'S2024002',
    email: 'sanna@tip.edu.ph',
    password: 'student456',
    firstName: 'Anna',
    lastName: 'Garcia',
    contactNumber: '09241234567',
    guardianName: 'Rosa Garcia',
    guardianContact: '09251234567',
    dateOfBirth: '2004-07-22',
    yearLevel: '3',
    program: 'BS Accountancy',
    college: 'College of Business Education',
    sectionId: 'ACC-3B',
    gender: 'Female',
    address: '456 Oak Ave, Quezon City',
    studentStatus: 'Regular',
    hasSetPassword: true,
  },
];

export const mockAppointments: Appointment[] = [];

export const timeSlots = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
];

// ── Helper: save updated appointment to localStorage ──
export const updateAppointmentInStorage = (
  appointmentId: string,
  changes: Partial<Appointment>
): void => {
  const stored: Appointment[] = JSON.parse(
    localStorage.getItem('appointments') || '[]'
  );
  const updated = stored.map((a) =>
    a.id === appointmentId ? { ...a, ...changes } : a
  );
  localStorage.setItem('appointments', JSON.stringify(updated));
};

export const findUserByCredentials = (
  identifier: string,
  password: string,
  role?: string
): User | undefined => {
  return mockUsers.find(
    (user) =>
      (user.email === identifier ||
        user.username === identifier ||
        user.id === identifier) &&
      user.password === password &&
      (!role || user.role === role)
  );
};

export const findStudentByDetails = (
  studentId: string,
  firstName: string,
  lastName: string
): User | undefined => {
  return mockUsers.find(
    (user) =>
      user.role === 'student' &&
      user.id === studentId &&
      user.firstName.toLowerCase() === firstName.toLowerCase() &&
      user.lastName.toLowerCase() === lastName.toLowerCase()
  );
};

export const getCounselorsByProgram = (program: string): User[] => {
  return mockUsers.filter(
    (user) =>
      user.role === 'counselor' &&
      user.assignedPrograms?.includes(program) &&
      user.isAvailable
  );
};

export const getAvailableCounselors = (): User[] => {
  return mockUsers.filter((user) => user.role === 'counselor' && user.isAvailable);
};

export const getAppointmentsByStudent = (studentId: string): Appointment[] => {
  const stored: Appointment[] = JSON.parse(
    localStorage.getItem('appointments') || '[]'
  );
  const all = [
    ...stored.filter((a) => a.studentId === studentId),
    ...mockAppointments.filter((a) => a.studentId === studentId),
  ];
  return all.filter(
    (a, i, self) => i === self.findIndex((b) => b.id === a.id)
  );
};

export const getAppointmentsByCounselor = (counselorId: string): Appointment[] => {
  const stored: Appointment[] = JSON.parse(
    localStorage.getItem('appointments') || '[]'
  );
  const all = [
    ...stored.filter((a) => a.counselorId === counselorId),
    ...mockAppointments.filter((a) => a.counselorId === counselorId),
  ];
  return all.filter(
    (a, i, self) => i === self.findIndex((b) => b.id === a.id)
  );
};

export const getAllAppointments = (): Appointment[] => {
  const stored: Appointment[] = JSON.parse(
    localStorage.getItem('appointments') || '[]'
  );
  const all = [...stored, ...mockAppointments];
  return all.filter(
    (a, i, self) => i === self.findIndex((b) => b.id === a.id)
  );
};

export const getAllSystemReports = (): SystemReport[] => {
  return JSON.parse(localStorage.getItem('systemReports') || '[]');
};

export const addSystemReport = (report: SystemReport): void => {
  const reports = getAllSystemReports();
  reports.push(report);
  localStorage.setItem('systemReports', JSON.stringify(reports));
};

export const updateSystemReportStatus = (
  reportId: string,
  status: 'pending' | 'resolved'
): void => {
  const reports = getAllSystemReports();
  const updated = reports.map((r) =>
    r.id === reportId ? { ...r, status } : r
  );
  localStorage.setItem('systemReports', JSON.stringify(updated));
};
