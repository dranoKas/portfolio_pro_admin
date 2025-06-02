
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Renamed loading to authOperationInProgress for clarity in this component
  const { signIn, user, loading: authOperationInProgress, error: authError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State to track if the initial authentication check by AuthContext is complete
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  useEffect(() => {
    // When authOperationInProgress becomes false, it means the initial onAuthStateChanged has resolved
    if (!authOperationInProgress) {
      setInitialAuthCheckComplete(true);
    }
  }, [authOperationInProgress]);

  useEffect(() => {
    // Redirect if user is authenticated AND the initial check is complete
    if (initialAuthCheckComplete && user) {
      router.push('/admin');
    }
  }, [user, initialAuthCheckComplete, router]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized_access' || errorParam === 'session_expired') {
      toast({
        variant: "destructive",
        title: "Accès non autorisé",
        description: "Veuillez vous connecter avec un compte autorisé.",
      });
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // signIn will set authOperationInProgress to true via AuthContext
    await signIn(email, password);
  };

  // Show full-page loader ONLY during the initial auth state check
  if (!initialAuthCheckComplete && authOperationInProgress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Vérification de la session...</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl relative">
        {/* In-card loader for submit operation (signIn) */}
        {/* Shows when authOperationInProgress is true AND initial check is complete */}
        {authOperationInProgress && initialAuthCheckComplete && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Connexion en cours...</p>
          </div>
        )}
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building2 size={32} />
          </div>
          <CardTitle className="text-2xl">Admin Portfolio</CardTitle>
          <CardDescription>Connectez-vous pour gérer votre contenu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={authOperationInProgress} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de Passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={authOperationInProgress} 
              />
            </div>
            {authError && (
              <div className="flex items-center space-x-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <p>{authError}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={authOperationInProgress}>
              {authOperationInProgress && initialAuthCheckComplete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Patientez...
                </>
              ) : (
                'Se Connecter'
              )}
            </Button>
          </form>
          <Button variant="outline" className="w-full mt-2" asChild>
            <Link href="#">
              <ArrowLeft className="mr-2 h-4 w-4" /> Revenir au site
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


    