
import { MessageSquare, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { TestimonialForm } from "@/components/admin/forms/TestimonialForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewTestimonialPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Ajouter un Nouveau Témoignage"
        description="Partagez un nouveau témoignage client."
        icon={MessageSquare}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Détails du Témoignage</CardTitle>
        </CardHeader>
        <CardContent>
          <TestimonialForm />
        </CardContent>
      </Card>
    </div>
  );
}
