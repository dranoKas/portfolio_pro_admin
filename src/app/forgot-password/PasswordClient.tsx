
"use client";

import { useState } from 'react';
import { auth } from '@/lib/firebase'; // Import auth directly
import { sendPasswordResetEmail, AuthError } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MailQuestion, Loader2, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Si un compte existe pour cette adresse, un e-mail de réinitialisation de mot de passe a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams).");
    } catch (e) {
      const authError = e as AuthError;
      console.error("Password Reset Error:", authError);
      if (authError.code === 'auth/invalid-email') {
        setError("L'adresse e-mail fournie n'est pas valide.");
      } else if (authError.code === 'auth/user-not-found') {
        // We typically don't want to reveal if an email exists or not for security.
        // So, show a generic success message.
         setSuccessMessage("Si un compte existe pour cette adresse, un e-mail de réinitialisation de mot de passe a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams).");
      }
      else {
        setError("Une erreur s'est produite. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MailQuestion size={32} />
          </div>
          <CardTitle className="text-2xl">Mot de Passe Oublié</CardTitle>
          <CardDescription>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300">Succès</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          {error && !successMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votreadresse@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Réinitialiser le Mot de Passe'
                )}
              </Button>
            </form>
          )}
          <Button variant="outline" className="w-full mt-2" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Portfolio Architecte. Tous droits réservés.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
