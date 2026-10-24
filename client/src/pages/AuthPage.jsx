import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from '../components/LoginPage';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 flex items-center justify-center p-4">
      <LoginPage onLoginSuccess={() => navigate('/')} />
    </div>
  );
}
