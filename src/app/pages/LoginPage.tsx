import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { findUserByCredentials } from '../lib/mockData';
import { setCurrentUser, findRegisteredStudent } from '../lib/auth';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import tipLogo from '../../assets/tip-logo.png';
import tipBuilding from '../../assets/tip-building.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Validate email: only letters before @, must end in @tip.edu.ph
  const validateEmail = (val: string): string => {
    if (!val) return '';
    const atIndex = val.indexOf('@');
    if (atIndex === -1) return 'Email must end with @tip.edu.ph';
    const localPart = val.substring(0, atIndex);
    const domain = val.substring(atIndex + 1);
    if (!/^[a-zA-Z]+$/.test(localPart)) return 'Email username must contain letters only (no numbers or special characters)';
    if (domain !== 'tip.edu.ph') return 'Email must end with @tip.edu.ph';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val) setEmailError(validateEmail(val));
    else setEmailError('');
  };

  const detectRole = (emailVal: string): string | null => {
    const localPart = emailVal.split('@')[0].toLowerCase();
    if (localPart.startsWith('s')) return 'student';
    if (localPart.startsWith('a')) return 'admin';
    if (localPart.startsWith('c')) return 'counselor';
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    const role = detectRole(email);
    if (!role) {
      toast.error('Invalid email. First letter must be "s" (student), "a" (admin/super admin), or "c" (counselor).');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let user = null;

      if (role === 'student') {
        // Check registered students first
        user = findRegisteredStudent(email, password);
        // Then check mock data
        if (!user) {
          const mockStudent = findUserByCredentials(email, password, 'student');
          if (mockStudent) user = mockStudent;
        }
      } else if (role === 'admin') {
        // Try superadmin first, then admin
        user = findUserByCredentials(email, password, 'superadmin') ||
               findUserByCredentials(email, password, 'admin');
      } else if (role === 'counselor') {
        user = findUserByCredentials(email, password, 'counselor');
      }

      if (user) {
        setCurrentUser(user);
        setFailedAttempts(0);
        toast.success(`Welcome, ${user.firstName} ${user.lastName}!`);
        if (user.role === 'student') navigate('/student/dashboard');
        else if (user.role === 'admin') navigate('/admin/dashboard');
        else if (user.role === 'superadmin') navigate('/superadmin/dashboard');
        else if (user.role === 'counselor') navigate('/counselor/dashboard');
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 3) {
          setShowForgotPassword(true);
          toast.error('Invalid credentials. Please use "Forgot Password?" to recover your account.');
        } else {
          toast.error(`Invalid credentials. ${3 - newAttempts} attempt(s) remaining.`);
        }
      }
      setLoading(false);
    }, 900);
  };

  if (loading) {
    return <LoadingSpinner message="Signing you in... (Nagsi-sign in...)" />;
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Left: Background Image */}
      <div
        className="hidden lg:flex lg:flex-1 relative"
        style={{
          backgroundImage: `url(${tipBuilding})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-8 left-8 text-white">
          <p className="text-sm uppercase tracking-widest opacity-80">Technological Institute of the Philippines</p>
          <p className="text-xs opacity-60 mt-1">Guidance and Counseling Center</p>
        </div>
      </div>

      {/* Right: Login Form Panel */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col justify-between shadow-2xl">
        {/* Top bar */}
        <div className="h-2 bg-yellow-400 w-full" />

        <div className="flex-1 flex flex-col justify-center px-10 py-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={tipLogo} alt="TIP Logo" className="h-24 w-auto object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1 uppercase tracking-wide">Sign In</h1>
          <p className="text-xs text-gray-500 mb-6">Mag-sign in sa iyong account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <input
                type="text"
                placeholder="Please enter your Login ID (Email)"
                value={email}
                onChange={handleEmailChange}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition"
                required
                autoComplete="username"
              />
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Please enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 transition"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast.info('Please contact the Guidance Office to reset your password. / Makipag-ugnayan sa Guidance Office para i-reset ang iyong password.')}
                className={`text-xs transition ${showForgotPassword ? 'text-red-600 font-bold animate-pulse' : 'text-gray-500 hover:text-yellow-600'}`}
              >
                {showForgotPassword ? '⚠ Forgot your password? Contact the Guidance Office' : 'Forgot your password?'}
              </button>
            </div>

            {/* Attempt warning */}
            {failedAttempts > 0 && failedAttempts < 3 && (
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                ⚠ {failedAttempts} failed attempt(s). After 3 failed tries, you'll be prompted to reset your password.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 rounded uppercase tracking-wide text-sm transition"
            >
              Continue
            </button>
          </form>

          {/* First Time Student */}
          <div className="mt-4 text-center border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 mb-2">First time student? (Bagong estudyante?)</p>
            <button
              onClick={() => navigate('/student/setup')}
              className="w-full border-2 border-gray-300 hover:border-yellow-400 text-gray-700 hover:text-yellow-700 font-semibold py-2 rounded uppercase tracking-wide text-xs transition"
            >
              Register as New Student (Mag-rehistro)
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-gray-900 text-white text-center py-3 px-4">
          <p className="text-xs uppercase tracking-widest">TIP Guidance &amp; Counseling System</p>
          <p className="text-xs text-gray-400 mt-0.5">Technological Institute of the Philippines — Manila</p>
        </div>
      </div>
    </div>
  );
}