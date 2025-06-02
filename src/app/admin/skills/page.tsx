
"use client";

import { Star, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { SkillsDataTable } from "@/components/admin/SkillsDataTable";
import { getSkills } from "@/app/admin/actions";
import { useEffect, useState, Suspense } from "react";
import type { Skill } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

function SkillsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const searchParams = useSearchParams();
  const refreshKey = searchParams.get('refresh');

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);
      getSkills(user.uid)
        .then(data => {
          setSkills(data);
        })
        .catch(error => {
          console.error("Failed to fetch skills:", error);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
      setSkills([]);
    }
  }, [user, authLoading, refreshKey]);

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
        title="Gérer les Compétences"
        description="Ajoutez, modifiez ou supprimez vos compétences professionnelles."
        icon={Star}
      />
      <SkillsDataTable skills={skills} userId={user?.uid || ""} />
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 flex justify-center items-center min-h-[300px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <SkillsPageContent />
    </Suspense>
  );
}
