import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { User, mockUsers } from '../lib/mockData';
import { CheckCircle, UserCheck, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

// Counselor assignment based on program with IDs
const counselorAssignments: Record<string, { id: string; name: string; email: string }> = {
  'BS Architecture': { id: 'CHE001', name: 'Ms. Cherry Anne Ditablan', email: 'che@tip.edu.ph' },
  'BS Chemical Engineering': { id: 'CHE001', name: 'Ms. Cherry Anne Ditablan', email: 'che@tip.edu.ph' },
  'BS Civil Engineering': { id: 'MON001', name: 'Ms. Ma. Eloisa Monique Perez', email: 'cmonique@tip.edu.ph' },
  'BS Mechanical Engineering': { id: 'JHE001', name: 'Ms. Jennifer Nollora', email: 'cjhen@tip.edu.ph' },
  'BS Computer Science': { id: 'JHE001', name: 'Ms. Jennifer Nollora', email: 'cjhen@tip.edu.ph' },
  'BS Data Science and Analytics': { id: 'JHE001', name: 'Ms. Jennifer Nollora', email: 'cjhen@tip.edu.ph' },
  'BS Entertainment and Multimedia Computing': { id: 'JHE001', name: 'Ms. Jennifer Nollora', email: 'cjhen@tip.edu.ph' },
  'BS Information Technology': { id: 'JHE001', name: 'Ms. Jennifer Nollora', email: 'cjhen@tip.edu.ph' },
  'BS Accountancy': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Accounting Information System': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Business Administration - Financial Management': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Business Administration - Human Resource Management': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Business Administration - Logistics and Supply Chain Management': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Business Administration - Marketing Management': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'Bachelor of Arts in English Language': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'Bachelor of Arts in Political Science': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Industrial Engineering': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Electrical Engineering': { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  'BS Electronics Engineering': { id: 'ROS001', name: 'Ms. Rochelle Anne Caraig', email: 'crosh@tip.edu.ph' },
  'BS Computer Engineering': { id: 'ROS001', name: 'Ms. Rochelle Anne Caraig', email: 'crosh@tip.edu.ph' },
};

const allCounselors = [
  { id: 'CHE001', name: 'Ms. Cherry Anne Ditablan', email: 'che@tip.edu.ph' },
  { id: 'MON001', name: 'Ms. Ma. Eloisa Monique Perez', email: 'cmonique@tip.edu.ph' },
  { id: 'JHE001', name: 'Ms. Jennifer Nollora', email: 'cjhen@tip.edu.ph' },
  { id: 'KIM001', name: 'Ms. Kim Nicole Garfin', email: 'ckim@tip.edu.ph' },
  { id: 'ROS001', name: 'Ms. Rochelle Anne Caraig', email: 'crosh@tip.edu.ph' },
];

const timeSlots = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
];

const purposeOptions = [
  { value: 'Personal', label: 'Personal' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Career', label: 'Career' },
  { value: 'Others', label: 'Others' },
];

interface BookAppointmentProps {
  user: User;
  onSuccess: () => void;
}

export function BookAppointment({ user, onSuccess }: BookAppointmentProps) {
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    purpose: '',
    customPurpose: '',
    notes: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [reassignedCounselor, setReassignedCounselor] = useState<{ name: string; email: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignedCounselor = user.program ? counselorAssignments[user.program] : null;

  // Get counselor's handled programs from mockUsers
  const getCounselorPrograms = (counselorId: string): string[] => {
    const counselor = mockUsers.find(u => u.id === counselorId && u.role === 'counselor');
    return counselor?.assignedPrograms || [];
  };

  const hasBookingConflict = (counselorId: string, date: string, timeSlot: string): boolean => {
    try {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      return appointments.some(
        (apt: any) =>
          apt.counselorId === counselorId &&
          apt.date === date &&
          apt.timeSlot === timeSlot &&
          apt.status !== 'cancelled'
      );
    } catch {
      return false;
    }
  };

  const findAvailableCounselor = (date: string, timeSlot: string, excludeCounselorId?: string) => {
    for (const counselor of allCounselors) {
      if (counselor.id === excludeCounselorId) continue;
      if (!hasBookingConflict(counselor.id, date, timeSlot)) {
        return counselor;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);
    setReassignedCounselor(null);

    try {
      if (!bookingData.date || !bookingData.timeSlot || !bookingData.purpose) {
        toast.error('Please fill in all required fields.');
        setIsSubmitting(false);
        return;
      }

      if (bookingData.purpose === 'Others' && !bookingData.customPurpose.trim()) {
        toast.error('Please specify the purpose of your counseling session.');
        setIsSubmitting(false);
        return;
      }

      const selectedDate = new Date(bookingData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        toast.error('Cannot book appointments in the past.');
        setIsSubmitting(false);
        return;
      }

      let finalCounselor = assignedCounselor;
      let wasReassigned = false;

      if (assignedCounselor) {
        const hasConflict = hasBookingConflict(assignedCounselor.id, bookingData.date, bookingData.timeSlot);
        if (hasConflict) {
          const available = findAvailableCounselor(bookingData.date, bookingData.timeSlot, assignedCounselor.id);
          if (available) {
            finalCounselor = available;
            wasReassigned = true;
            setReassignedCounselor(available);
          } else {
            toast.error('No counselors available at the selected time. Please choose a different time slot.');
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        const available = findAvailableCounselor(bookingData.date, bookingData.timeSlot);
        if (available) {
          finalCounselor = available;
        } else {
          toast.error('No counselors available at the selected time. Please choose a different time slot.');
          setIsSubmitting(false);
          return;
        }
      }

      const finalPurpose = bookingData.purpose === 'Others'
        ? bookingData.customPurpose
        : bookingData.purpose;

      // Determine session type from purpose
      let sessionType = 'Others';
      if (finalPurpose.startsWith('Personal')) sessionType = 'Personal';
      else if (finalPurpose.startsWith('Academic')) sessionType = 'Academic';
      else if (finalPurpose.startsWith('Career')) sessionType = 'Career';

      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const newAppointment = {
        id: `APT${Date.now()}`,
        studentId: user.id,
        studentName: `${user.firstName} ${user.lastName}`,
        program: user.program,
        counselorId: finalCounselor?.id || '',
        counselorName: finalCounselor?.name || 'TBD',
        counselorEmail: finalCounselor?.email || '',
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        purpose: finalPurpose,
        sessionType,
        notes: bookingData.notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      appointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(appointments));

      setShowSuccess(true);

      if (wasReassigned) {
        toast.success(`Appointment booked with ${finalCounselor?.name} (reassigned due to schedule conflict).`);
      } else {
        toast.success('Appointment booked successfully!');
      }

      setTimeout(() => {
        setBookingData({ date: '', timeSlot: '', purpose: '', customPurpose: '', notes: '' });
        setShowSuccess(false);
        setReassignedCounselor(null);
        setIsSubmitting(false);
        onSuccess();
      }, 2000);
    } catch (error) {
      toast.error('An error occurred while booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const finalCounselorName = reassignedCounselor?.name || assignedCounselor?.name || 'TBD';

  return (
    <div className="bg-white border-2 border-yellow-400 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="border-b-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-white p-5">
        <h2 className="font-bold text-gray-900 uppercase tracking-wide text-base">
          Counseling Session with {finalCounselorName}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Book a guidance counseling appointment / Mag-book ng appointment</p>
      </div>

      <div className="p-5">
        {showSuccess && (
          <Alert className="mb-4 bg-green-50 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="uppercase font-bold text-green-900">Appointment Booked! (Naka-book na ang Appointment!)</AlertTitle>
            <AlertDescription className="text-green-800 text-xs">
              Your counseling session has been successfully scheduled. Awaiting counselor confirmation.
              <span className="block mt-0.5 italic">(Ang iyong appointment ay matagumpay na naka-iskedyul. Naghihintay ng kumpirmasyon ng counselor.)</span>
            </AlertDescription>
          </Alert>
        )}

        {reassignedCounselor && (
          <Alert className="mb-4 bg-blue-50 border-blue-500">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <AlertTitle className="uppercase font-bold text-blue-900">Counselor Reassigned</AlertTitle>
            <AlertDescription className="text-blue-800 text-xs">
              Your assigned counselor was busy. You've been reassigned to <strong>{reassignedCounselor.name}</strong>.
              <span className="block mt-0.5 italic">(Ang iyong counselor ay abala. Ikaw ay na-assign kay {reassignedCounselor.name}.)</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Assigned Counselor Info */}
        {assignedCounselor && (
          <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <p className="text-xs font-bold uppercase text-gray-700 mb-1">Assigned Counselor (Nakatalagang Counselor)</p>
            <p className="font-bold text-gray-900">{assignedCounselor.name}</p>
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">Handled Programs:</p>
              <div className="flex flex-wrap gap-1">
                {getCounselorPrograms(assignedCounselor.id).map((prog) => (
                  <span key={prog} className="inline-block bg-yellow-200 border border-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded">
                    {prog}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">*If unavailable, you'll be automatically assigned to another counselor.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Purpose */}
          <div>
            <Label className="font-bold text-gray-800 uppercase text-xs tracking-wide">
              Purpose of Counseling (Layunin ng Counseling) *
            </Label>
            <Select
              value={bookingData.purpose}
              onValueChange={(v) => setBookingData({ ...bookingData, purpose: v })}
            >
              <SelectTrigger className="mt-1 border-2 border-gray-300 focus:border-yellow-500">
                <SelectValue placeholder="Select the purpose of your session" />
              </SelectTrigger>
              <SelectContent>
                {purposeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {bookingData.purpose === 'Others' && (
            <div>
              <Label className="font-bold text-gray-800 uppercase text-xs tracking-wide">Please Specify (Mangyaring tukuyin) *</Label>
              <Input
                placeholder="Describe your concern..."
                value={bookingData.customPurpose}
                onChange={(e) => setBookingData({ ...bookingData, customPurpose: e.target.value })}
                className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                required
              />
            </div>
          )}

          {/* Date and Time of Counseling */}
          <div>
            <p className="text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">
              Date and Time of Counseling (Petsa at Oras ng Counseling) *
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 font-semibold">Date (Petsa)</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    className="pl-8 border-2 border-gray-300 focus:border-yellow-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600 font-semibold">Time Slot (Oras)</Label>
                <Select
                  value={bookingData.timeSlot}
                  onValueChange={(v) => setBookingData({ ...bookingData, timeSlot: v })}
                >
                  <SelectTrigger className="mt-1 border-2 border-gray-300">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Session details preview */}
          {bookingData.date && bookingData.timeSlot && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
              <p className="font-bold uppercase text-gray-600 mb-1">Appointment Details Preview:</p>
              <p><span className="font-semibold">Session:</span> Counseling Session with {finalCounselorName}</p>
              <p><span className="font-semibold">Date:</span> {new Date(bookingData.date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><span className="font-semibold">Time:</span> {bookingData.timeSlot}</p>
              {bookingData.purpose && <p><span className="font-semibold">Purpose:</span> {bookingData.purpose === 'Others' ? bookingData.customPurpose || '(specify)' : bookingData.purpose}</p>}
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <Label className="font-bold text-gray-800 uppercase text-xs tracking-wide">
              Additional Notes (Karagdagang Tala) — Optional
            </Label>
            <Textarea
              placeholder="Any additional information you'd like to share... (Anumang karagdagang impormasyon...)"
              value={bookingData.notes}
              onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
              className="mt-1 border-2 border-gray-300 focus:border-yellow-500 min-h-[80px]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-bold py-2.5 rounded uppercase tracking-wide text-sm transition"
          >
            {isSubmitting ? 'Booking...' : 'Book Appointment (Mag-book ng Appointment)'}
          </button>
        </form>
      </div>
    </div>
  );
}