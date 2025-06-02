
"use client";

import { Briefcase, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProjectForm } from "@/components/admin/forms/ProjectForm";
import { getProjectById } from "@/app/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProjectDocument } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<ProjectDocument | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    if (user?.uid && params?.id) {
      setIsLoadingData(true);
      setErrorOccurred(false);
      getProjectById(user.uid, params.id)
        .then(data => {
          if (!data) {
            setErrorOccurred(true); // Trigger notFound outside of then/catch/finally
          } else {
            setProject(data);
          }
        })
        .catch(error => {
          console.error("Failed to fetch project:", error);
          setErrorOccurred(true);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
      // User not authenticated, AdminLayout should handle redirection
    } else if (params && !params.id) {
        setIsLoadingData(false);
        setErrorOccurred(true); // No ID in params
    }
  }, [user, authLoading, params]);

  if (authLoading || isLoadingData) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (errorOccurred || !project) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Modifier le Projet"
        description={`Mettez à jour les détails pour "${project.title}".`}
        icon={Briefcase}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Détails du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ProjectForm uses useAuth internally for add/update actions */}
          <ProjectForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
