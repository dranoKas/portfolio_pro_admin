
"use client";

import type { ProjectDocument } from "@/lib/schema";
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
import { Edit, Trash2, Eye } from "lucide-react";
import { deleteProject } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

interface ProjectsDataTableProps {
  projects: ProjectDocument[];
  userId: string; // Added userId prop
}

export function ProjectsDataTable({ projects, userId }: ProjectsDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiant utilisateur manquant." });
      return;
    }
    const result = await deleteProject(userId, id);
    if (result.success) {
      toast({ title: "Succès", description: result.message });
      router.refresh(); 
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  if (!userId && projects.length > 0) {
     // This case should ideally not happen if ProjectsPage passes a valid userId or empty projects
     console.warn("ProjectsDataTable rendered with projects but no userId.");
  }


  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Catégories</TableHead>
            <TableHead>Technologies</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                Aucun projet trouvé.
              </TableCell>
            </TableRow>
          )}
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                  <Image
                    src={project.imageUrls && project.imageUrls.length > 0 ? project.imageUrls[0] : "https://placehold.co/100x100.png"}
                    alt={project.title}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="architecture building"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{project.title}</TableCell>
              <TableCell>{project.category.join(", ")}</TableCell>
              <TableCell>{project.technologies.join(", ")}</TableCell>
              <TableCell className="text-right space-x-2">
                {project.demoUrl && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" title="Voir la démo">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/admin/projects/edit/${project.id}`} title="Modifier le projet">
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" title="Supprimer le projet" disabled={!userId}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Cela supprimera définitivement le projet "{project.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(project.id!)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
