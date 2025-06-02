import React, { Suspense } from 'react';
import ForgotPasswordPage from './PasswordClient';

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
