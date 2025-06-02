
"use client";

import Link from "next/link";
import { MessageSquare, PlusCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { TestimonialsDataTable } from "@/components/admin/TestimonialsDataTable";
import { getTestimonials } from "@/app/admin/actions";
import { useEffect, useState, Suspense } from "react";
import type { Testimonial } from "@/lib/schema";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

function TestimonialsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const searchParams = useSearchParams();
  const refreshKey = searchParams.get('refresh');

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);
      getTestimonials(user.uid)
        .then(data => {
          setTestimonials(data);
        })
        .catch(error => {
          console.error("Failed to fetch testimonials:", error);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (!authLoading && !user) {
      setIsLoadingData(false);
      setTestimonials([]);
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
        title="Gérer les Témoignages"
        description="Ajoutez, modifiez ou supprimez les témoignages clients."
        icon={MessageSquare}
        actions={
          <Button asChild>
            <Link href="/admin/testimonials/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Nouveau Témoignage
            </Link>
          </Button>
        }
      />
      <TestimonialsDataTable testimonials={testimonials} userId={user?.uid || ""} />
    </div>
  );
}

export default function TestimonialsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 flex justify-center items-center min-h-[300px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <TestimonialsPageContent />
    </Suspense>
  );
}
