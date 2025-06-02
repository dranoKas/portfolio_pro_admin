
"use client";

import { User, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { PersonalInfoForm } from "@/components/admin/forms/PersonalInfoForm";
import { getPersonalData } from "@/app/admin/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import type { PersonalData } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";

export default function PersonalInfoPage() {
  const { user, loading: authLoading } = useAuth();
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);
      getPersonalData(user.uid)
        .then(data => {
          setPersonalData(data);
        })
        .catch(error => {
          console.error("Failed to fetch personal data:", error);
          // Optionally, set an error state and display it
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (!authLoading && !user) {
      // If auth is done loading and there's no user, stop loading data state.
      // This can happen if user logs out or session expires.
      // The AdminLayout should handle redirection to login.
      setIsLoadingData(false);
      setPersonalData(null); 
    }
  }, [user, authLoading]);

  if (authLoading || isLoadingData) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Informations Personnelles"
        description="Gérez les détails de votre profil public et vos liens de réseaux sociaux."
        icon={User}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Modifier le Profil</CardTitle>
          <CardDescription>
            Ces informations seront affichées sur votre portfolio public.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* PersonalInfoForm is a client component, it will get user.uid for submission via useAuth itself */}
          <PersonalInfoForm data={personalData} />
        </CardContent>
      </Card>
    </div>
  );
}
