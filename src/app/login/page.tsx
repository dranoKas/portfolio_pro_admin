import React, { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Chargement de la page...</div>}>
      <LoginClient />
    </Suspense>
  );
}
