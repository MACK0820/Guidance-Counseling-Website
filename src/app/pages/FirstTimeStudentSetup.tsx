import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { registerStudent, setCurrentUser } from '../lib/auth';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';

// College programs mapped by college
const collegePrograms: Record<string, string[]> = {
  'College of Engineering and Architecture': [
    'Bachelor of Science in Architecture',
    'Bachelor of Science in Chemical Engineering',
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Computer Engineering',
    'Bachelor of Science in Electrical Engineering',
    'Bachelor of Science in Electronics Engineering',
    'Bachelor of Science in Industrial Engineering',
    'Bachelor of Science in Mechanical Engineering',
  ],
  'College of Computer Studies': [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Data Science and Analytics',
    'Bachelor of Science in Entertainment and Multimedia Computing',
    'Bachelor of Science in Information Systems',
    'Bachelor of Science in Information Technology',
  ],
  'College of Business Education': [
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Accounting Information System',
    'Bachelor of Science in Business Administration - Financial Management',
    'Bachelor of Science in Business Administration - Human Resource Management',
    'Bachelor of Science in Business Administration - Logistics and Supply Chain Management',
    'Bachelor of Science in Business Administration - Marketing Management',
  ],
  'College of Arts': [
    'Bachelor of Arts in English Language',
    'Bachelor of Arts in Political Science',
    'Bachelor of Arts in Psychology',
  ],
};

const colleges = Object.keys(collegePrograms);

export function FirstTimeStudentSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    address: '',
    guardianName: '',
    guardianContact: '',
    yearLevel: '',
    college: '',
    program: '',
    studentStatus: '' as 'Regular' | 'Irregular' | 'Returnee' | '',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Validation helpers
  const validateStudentId = (id: string): string => {
    if (!/^[0-9]+$/.test(id)) return 'Student ID must contain numbers only';
    if (id.length < 7 || id.length > 10) return 'Student ID must be 7 to 10 digits';
    return '';
  };

  const validateName = (name: string): string => {
    if (!name) return '';
    if (!/^[A-Za-z\s\-'\.]+$/.test(name)) return 'Name must contain letters only (no numbers)';
    return '';
  };

  const validateContactNumber = (number: string): string => {
    if (!number) return '';
    if (!/^[0-9]+$/.test(number)) return 'Contact number must contain numbers only';
    if (number.length !== 11) return 'Contact number must be exactly 11 digits';
    return '';
  };

  const handleStudentIdChange = (val: string) => {
    // Only allow digits
    const filtered = val.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData({ ...formData, studentId: filtered });
  };

  const handleNameChange = (field: string, val: string) => {
    // Only allow letters, spaces, hyphens, apostrophes, periods
    const filtered = val.replace(/[^A-Za-z\s\-'\.]/g, '');
    setFormData({ ...formData, [field]: filtered });
  };

  const handleContactChange = (field: string, val: string) => {
    // Only allow digits, max 11
    const filtered = val.replace(/[^0-9]/g, '').slice(0, 11);
    setFormData({ ...formData, [field]: filtered });
  };

  const handleSubmitPersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();

    const idError = validateStudentId(formData.studentId);
    if (idError) { toast.error(idError); return; }

    const firstNameError = validateName(formData.firstName);
    if (firstNameError) { toast.error(`First Name: ${firstNameError}`); return; }

    const lastNameError = validateName(formData.lastName);
    if (lastNameError) { toast.error(`Last Name: ${lastNameError}`); return; }

    if (formData.middleName) {
      const middleNameError = validateName(formData.middleName);
      if (middleNameError) { toast.error(`Middle Name: ${middleNameError}`); return; }
    }

    const contactError = validateContactNumber(formData.contactNumber);
    if (contactError) { toast.error(contactError); return; }

    const guardianContactError = validateContactNumber(formData.guardianContact);
    if (guardianContactError) { toast.error(`Guardian Contact: ${guardianContactError}`); return; }

    const guardianNameError = validateName(formData.guardianName);
    if (guardianNameError) { toast.error(`Guardian Name: ${guardianNameError}`); return; }

    if (!formData.gender || !formData.yearLevel || !formData.college || !formData.program || !formData.studentStatus) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 15 || age > 100) {
      toast.error('Invalid date of birth. Student must be at least 15 years old.');
      return;
    }

    setStep(2);
  };

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const newStudent = registerStudent({
          studentId: formData.studentId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          contactNumber: formData.contactNumber,
          address: formData.address,
          guardianName: formData.guardianName,
          guardianContact: formData.guardianContact,
          yearLevel: formData.yearLevel,
          college: formData.college,
          program: formData.program,
          studentStatus: formData.studentStatus,
          password: passwordData.password,
        });

        setCurrentUser(newStudent);
        toast.success('Registration successful! Welcome to the Guidance Counseling System.');
        navigate('/student/dashboard');
      } catch (error) {
        toast.error('Failed to create account. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  if (loading) {
    return <LoadingSpinner message="Creating your account... (Nililikha ang iyong account...)" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => step === 1 ? navigate('/') : setStep(1)}
            className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 text-sm font-semibold uppercase tracking-wide transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <img src={tipLogo} alt="TIP Logo" className="h-10 w-auto" />
            <div>
              <h1 className="font-bold text-gray-900 uppercase tracking-wide text-sm">TIP Guidance &amp; Counseling System</h1>
              <p className="text-xs text-gray-500">First-Time Student Registration</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 1 ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-600'}`}>1</div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step >= 2 ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-600'}`}>2</div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4 -mt-2">
          <span className="uppercase font-semibold">Personal Information</span>
          <span className="uppercase font-semibold">Create Password</span>
        </div>

        <Card className="border-2 border-gray-300 shadow-lg">
          <CardHeader className="border-b-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-white">
            <CardTitle className="flex items-center gap-2 text-gray-900 uppercase tracking-wide">
              <UserPlus className="w-5 h-5" />
              {step === 1 ? 'Personal Information (Personal na Impormasyon)' : 'Create Your Password (Lumikha ng Password)'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 1
                ? 'Fill in all required fields accurately. / Punan ang lahat ng kinakailangang field nang tama.'
                : 'Create a secure password for your account. / Lumikha ng secure na password para sa iyong account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {step === 1 ? (
              <form onSubmit={handleSubmitPersonalInfo} className="space-y-5">
                {/* Student ID */}
                <div>
                  <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">
                    Student ID * <span className="normal-case font-normal text-gray-500">(7–10 digits, numbers only)</span>
                  </Label>
                  <Input
                    placeholder="e.g. 2410001"
                    value={formData.studentId}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                    required
                    maxLength={10}
                    inputMode="numeric"
                  />
                  {formData.studentId && validateStudentId(formData.studentId) && (
                    <p className="text-xs text-red-500 mt-1">{validateStudentId(formData.studentId)}</p>
                  )}
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">First Name *</Label>
                    <Input
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={(e) => handleNameChange('firstName', e.target.value)}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Middle Name</Label>
                    <Input
                      placeholder="(Optional)"
                      value={formData.middleName}
                      onChange={(e) => handleNameChange('middleName', e.target.value)}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Last Name *</Label>
                    <Input
                      placeholder="Dela Cruz"
                      value={formData.lastName}
                      onChange={(e) => handleNameChange('lastName', e.target.value)}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth + Gender + Year Level + Student Status */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger className="mt-1 border-2 border-gray-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Year Level *</Label>
                    <Select value={formData.yearLevel} onValueChange={(v) => setFormData({ ...formData, yearLevel: v })}>
                      <SelectTrigger className="mt-1 border-2 border-gray-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">5th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Student Status *</Label>
                    <Select value={formData.studentStatus} onValueChange={(v) => setFormData({ ...formData, studentStatus: v as any })}>
                      <SelectTrigger className="mt-1 border-2 border-gray-300">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Irregular">Irregular</SelectItem>
                        <SelectItem value="Returnee">Returnee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* College + Program */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">College *</Label>
                    <Select
                      value={formData.college}
                      onValueChange={(v) => setFormData({ ...formData, college: v, program: '' })}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300">
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Program *</Label>
                    <Select
                      value={formData.program}
                      onValueChange={(v) => setFormData({ ...formData, program: v })}
                      disabled={!formData.college}
                    >
                      <SelectTrigger className="mt-1 border-2 border-gray-300">
                        <SelectValue placeholder={formData.college ? 'Select program' : 'Select college first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(collegePrograms[formData.college] || []).map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact + Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">
                      Contact Number * <span className="normal-case font-normal text-gray-500">(11 digits)</span>
                    </Label>
                    <Input
                      placeholder="09171234567"
                      value={formData.contactNumber}
                      onChange={(e) => handleContactChange('contactNumber', e.target.value)}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                      inputMode="numeric"
                      maxLength={11}
                    />
                    {formData.contactNumber && validateContactNumber(formData.contactNumber) && (
                      <p className="text-xs text-red-500 mt-1">{validateContactNumber(formData.contactNumber)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Address *</Label>
                    <Input
                      placeholder="123 Main St, Manila"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                    />
                  </div>
                </div>

                {/* Guardian Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <div className="col-span-2">
                    <p className="text-xs font-bold uppercase text-gray-600 tracking-wide mb-2">Guardian Information (Impormasyon ng Tagapag-alaga)</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Guardian Name *</Label>
                    <Input
                      placeholder="Pedro Dela Cruz"
                      value={formData.guardianName}
                      onChange={(e) => handleNameChange('guardianName', e.target.value)}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">
                      Guardian Contact * <span className="normal-case font-normal text-gray-500">(11 digits)</span>
                    </Label>
                    <Input
                      placeholder="09181234567"
                      value={formData.guardianContact}
                      onChange={(e) => handleContactChange('guardianContact', e.target.value)}
                      className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                      required
                      inputMode="numeric"
                      maxLength={11}
                    />
                    {formData.guardianContact && validateContactNumber(formData.guardianContact) && (
                      <p className="text-xs text-red-500 mt-1">{validateContactNumber(formData.guardianContact)}</p>
                    )}
                  </div>
                </div>

                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 rounded uppercase tracking-wide text-sm transition">
                  Continue to Password Setup →
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-sm mx-auto">
                <p className="text-sm text-gray-600 text-center">
                  Creating account for <span className="font-bold text-gray-900">{formData.firstName} {formData.lastName}</span>
                </p>
                <div>
                  <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Create Password *</Label>
                  <Input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label className="font-semibold text-gray-800 uppercase text-xs tracking-wide">Confirm Password *</Label>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1 border-2 border-gray-300 focus:border-yellow-500"
                    required
                  />
                  {passwordData.confirmPassword && passwordData.password !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 rounded uppercase tracking-wide text-sm transition">
                  Complete Registration (Kumpletuhin ang Rehistrasyon)
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}