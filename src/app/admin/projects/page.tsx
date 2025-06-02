
"use client";

import Link from "next/link";
import { Briefcase, PlusCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { ProjectsDataTable } from "@/components/admin/ProjectsDataTable";
import { getProjects } from "@/app/admin/actions";
import { useEffect, useState, Suspense } from "react"; // Import Suspense
import type { ProjectDocument } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation"; // Import useSearchParams

// Create a new component to handle Suspense for useSearchParams
function ProjectsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectDocument[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const searchParams = useSearchParams();
  const refreshKey = searchParams.get('refresh');

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);
      getProjects(user.uid)
        .then(data => {
          setProjects(data);
        })
        .catch(error => {
          console.error("Failed to fetch projects:", error);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
      setProjects([]);
    }
  }, [user, authLoading, refreshKey]); // Add refreshKey to dependency array

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
        title="Gérer les Projets"
        description="Ajoutez, modifiez ou supprimez vos projets architecturaux."
        icon={Briefcase}
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Nouveau Projet
            </Link>
          </Button>
        }
      />
      <ProjectsDataTable projects={projects} userId={user?.uid || ""} />
    </div>
  );
}

// Wrap ProjectsPageContent with Suspense
export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 flex justify-center items-center min-h-[300px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
