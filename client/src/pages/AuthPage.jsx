import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from '../components/LoginPage';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex items-center justify-center p-2 sm:p-4 bg-linear-to-br from-amber-50/40 via-neutral-50 to-neutral-100 overflow-hidden">
      <LoginPage onLoginSuccess={() => navigate('/')} />
    </div>
  );
}
