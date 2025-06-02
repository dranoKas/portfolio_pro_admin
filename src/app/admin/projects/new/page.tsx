
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProjectForm } from "@/components/admin/forms/ProjectForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Ajouter un Nouveau Projet"
        description="Remplissez les détails pour ajouter un nouveau projet à votre portfolio."
        icon={Briefcase}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Détails du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
