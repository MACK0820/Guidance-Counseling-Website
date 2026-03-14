import { User } from './mockData';

// Authentication helper functions
export const setCurrentUser = (user: User) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const updateUserPassword = (userId: string, newPassword: string) => {
  const user = getCurrentUser();
  if (user && user.id === userId) {
    user.password = newPassword;
    user.hasSetPassword = true;
    setCurrentUser(user);
  }
};

// Student registration storage
export const registerStudent = (studentData: any) => {
  const registeredStudents = getRegisteredStudents();
  const newStudent: User = {
    id: studentData.studentId,
    studentId: studentData.studentId,
    username: studentData.studentId,
    email: `s${studentData.firstName.toLowerCase()}@tip.edu.ph`,
    password: studentData.password,
    firstName: studentData.firstName,
    lastName: studentData.lastName,
    role: 'student',
    program: studentData.program,
    college: studentData.college,
    yearLevel: studentData.yearLevel,
    dateOfBirth: studentData.dateOfBirth,
    gender: studentData.gender,
    contactNumber: studentData.contactNumber,
    address: studentData.address,
    guardianName: studentData.guardianName,
    guardianContact: studentData.guardianContact,
    studentStatus: studentData.studentStatus,
  };
  registeredStudents.push(newStudent);
  localStorage.setItem('registeredStudents', JSON.stringify(registeredStudents));
  return newStudent;
};

export const getRegisteredStudents = (): User[] => {
  const studentsStr = localStorage.getItem('registeredStudents');
  return studentsStr ? JSON.parse(studentsStr) : [];
};

export const findRegisteredStudent = (email: string, password: string): User | null => {
  const students = getRegisteredStudents();
  const student = students.find(
    (s) =>
      s.email === email &&
      s.password === password
  );
  return student || null;
};

// Delete a registered student by student ID
export const deleteRegisteredStudent = (studentId: string): boolean => {
  const students = getRegisteredStudents();
  const filteredStudents = students.filter(s => s.studentId !== studentId);
  if (filteredStudents.length < students.length) {
    localStorage.setItem('registeredStudents', JSON.stringify(filteredStudents));
    return true;
  }
  return false;
};
