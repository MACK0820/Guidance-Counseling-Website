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

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  counselorId: string;
  counselorName: string;
  counselorEmail?: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  program: string;
  purpose?: string;
  sessionType?: 'Personal' | 'Academic' | 'Career' | 'Others';
  reason?: string;
  notes?: string;
  narrativeSummary?: string;
  cancellationReason?: string;
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
  // Super Admin - email starts with 'a'
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
  // Admin - email starts with 'a'
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
  // Counselors - emails start with 'c'
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
    assignedPrograms: ['Bachelor of Science in Architecture', 'Bachelor of Science in Chemical Engineering'],
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
      'Bachelor of Science in Information Technology'
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
      'Bachelor of Science in Electrical Engineering'
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
    assignedPrograms: ['Bachelor of Science in Electronics Engineering', 'Bachelor of Science in Computer Engineering'],
  },
  // Students - emails start with 's'
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

// Mock appointments
export const mockAppointments: Appointment[] = [];

// Available time slots
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

// Helper functions
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
  return mockUsers.filter(
    (user) => user.role === 'counselor' && user.isAvailable
  );
};

export const getAppointmentsByStudent = (studentId: string): Appointment[] => {
  const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const storedStudentAppointments = storedAppointments.filter((apt: Appointment) => apt.studentId === studentId);
  const mockStudentAppointments = mockAppointments.filter((apt) => apt.studentId === studentId);
  const allAppointments = [...storedStudentAppointments, ...mockStudentAppointments];
  const uniqueAppointments = allAppointments.filter((apt, index, self) =>
    index === self.findIndex((a) => a.id === apt.id)
  );
  return uniqueAppointments;
};

export const getAppointmentsByCounselor = (counselorId: string): Appointment[] => {
  const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const storedCounselorAppointments = storedAppointments.filter((apt: Appointment) => apt.counselorId === counselorId);
  const mockCounselorAppointments = mockAppointments.filter((apt) => apt.counselorId === counselorId);
  const allAppointments = [...storedCounselorAppointments, ...mockCounselorAppointments];
  const uniqueAppointments = allAppointments.filter((apt, index, self) =>
    index === self.findIndex((a) => a.id === apt.id)
  );
  return uniqueAppointments;
};

export const getAllAppointments = (): Appointment[] => {
  const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const allAppointments = [...storedAppointments, ...mockAppointments];
  const uniqueAppointments = allAppointments.filter((apt, index, self) =>
    index === self.findIndex((a) => a.id === apt.id)
  );
  return uniqueAppointments;
};

// System Report functions
export const getAllSystemReports = (): SystemReport[] => {
  const storedReports = JSON.parse(localStorage.getItem('systemReports') || '[]');
  return storedReports;
};

export const addSystemReport = (report: SystemReport): void => {
  const reports = getAllSystemReports();
  reports.push(report);
  localStorage.setItem('systemReports', JSON.stringify(reports));
};

export const updateSystemReportStatus = (reportId: string, status: 'pending' | 'resolved'): void => {
  const reports = getAllSystemReports();
  const updated = reports.map(r => r.id === reportId ? { ...r, status } : r);
  localStorage.setItem('systemReports', JSON.stringify(updated));
};