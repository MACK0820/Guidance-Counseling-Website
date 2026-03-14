import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import './utils/deleteStudent'; // Load delete utility for browser console
import './utils/clearAllData'; // Load clear all data utility for browser console

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}