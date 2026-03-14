// Utility to clear all localStorage data

export const clearAllData = () => {
  localStorage.removeItem('registeredStudents');
  localStorage.removeItem('appointments');
  localStorage.removeItem('currentUser');
  console.log('✅ All data cleared successfully!');
  console.log('- Registered students: cleared');
  console.log('- Appointments: cleared');
  console.log('- Current user: cleared');
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearAllData = clearAllData;
  console.log('🧹 Clear all data utility loaded. Use window.clearAllData() to reset everything.');
}
