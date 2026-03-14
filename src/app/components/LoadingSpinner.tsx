import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
      <p className="mt-4 text-green-700">{message}</p>
    </div>
  );
}
