
"use client";

import { MessageSquare, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { TestimonialForm } from "@/components/admin/forms/TestimonialForm";
import { getTestimonialById } from "@/app/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Testimonial } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";

export default function EditTestimonialPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    if (user?.uid && params?.id) {
      setIsLoadingData(true);
      setErrorOccurred(false);
      getTestimonialById(user.uid, params.id)
        .then(data => {
          if (!data) {
            setErrorOccurred(true); 
          } else {
            setTestimonial(data);
          }
        })
        .catch(error => {
          console.error("Failed to fetch testimonial:", error);
          setErrorOccurred(true);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
    } else if (params && !params.id) {
        setIsLoadingData(false);
        setErrorOccurred(true);
    }
  }, [user, authLoading, params]);

  if (authLoading || isLoadingData) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (errorOccurred || !testimonial) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Modifier le Témoignage"
        description={`Mettez à jour le témoignage de "${testimonial.name}".`}
        icon={MessageSquare}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Détails du Témoignage</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TestimonialForm uses useAuth internally for add/update actions */}
          <TestimonialForm testimonial={testimonial} />
        </CardContent>
      </Card>
    </div>
  );
}
