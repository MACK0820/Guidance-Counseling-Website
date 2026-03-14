import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { AlertCircle, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-green-800 mb-2">404</h1>
        <p className="text-xl text-green-600 mb-6">Page Not Found</p>
        <Button
          onClick={() => navigate('/')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Home className="w-4 h-4 mr-2" />
          Go to Login
        </Button>
      </div>
    </div>
  );
}
