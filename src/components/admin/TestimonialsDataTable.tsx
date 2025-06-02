
"use client";

import type { Testimonial } from "@/lib/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { deleteTestimonial } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import NextImage from "next/image"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { getAvatarDetails, type AvatarKey } from "@/lib/avatarOptions";

interface TestimonialsDataTableProps {
  testimonials: Testimonial[];
  userId: string; // Added userId prop
}

export function TestimonialsDataTable({ testimonials, userId }: TestimonialsDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiant utilisateur manquant pour la suppression." });
      return;
    }
    const result = await deleteTestimonial(userId, id);
    if (result.success) {
      toast({ title: "Succès", description: result.message });
      // Use query param to force refresh on the listing page
      router.push(`/admin/testimonials?refresh=${Date.now()}`);
      // router.refresh(); // router.push with query param should be enough
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  if (!userId && testimonials.length > 0) {
     console.warn("TestimonialsDataTable rendered with testimonials but no userId.");
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Entreprise</TableHead>
            <TableHead>Texte (Extrait)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testimonials.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Aucun témoignage trouvé.
              </TableCell>
            </TableRow>
          )}
          {testimonials.map((testimonial) => {
            const avatarDetails = getAvatarDetails(testimonial.avatar as AvatarKey);
            return (
              <TableRow key={testimonial.id}>
                <TableCell>
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border">
                    <NextImage
                      src={avatarDetails.url}
                      alt={testimonial.name}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={avatarDetails.hint}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{testimonial.name}</TableCell>
                <TableCell>{testimonial.position}</TableCell>
                <TableCell>{testimonial.company}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {testimonial.text}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/admin/testimonials/edit/${testimonial.id}`} title="Modifier le témoignage">
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" size="icon" title="Supprimer le témoignage" disabled={!userId}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Cela supprimera définitivement le témoignage de "{testimonial.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(testimonial.id!)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
