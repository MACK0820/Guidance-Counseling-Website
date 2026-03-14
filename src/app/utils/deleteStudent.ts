// Utility to delete a student account
// Run this in the browser console: window.deleteStudentAccount('2410000')

import { deleteRegisteredStudent } from '../lib/auth';

export const deleteStudentAccountUtil = (studentId: string) => {
  const success = deleteRegisteredStudent(studentId);
  if (success) {
    console.log(`✅ Successfully deleted student account: ${studentId}`);
    return true;
  } else {
    console.log(`❌ Student account not found: ${studentId}`);
    return false;
  }
};

// Make it available globally for browser console use
if (typeof window !== 'undefined') {
  (window as any).deleteStudentAccount = deleteStudentAccountUtil;
}
