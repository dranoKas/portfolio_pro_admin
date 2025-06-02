
"use client";

import type { Skill } from "@/lib/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { addSkill, updateSkill, deleteSkill } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // DialogClose and DialogFooter removed as they are not used directly here.
import { SkillForm } from "./forms/SkillForm";
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription as AlertDescription,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle as AlertTitle,
  AlertDialogTrigger as AlertTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";


interface SkillsDataTableProps {
  skills: Skill[];
  userId: string; // Added userId prop
}

export function SkillsDataTable({ skills, userId }: SkillsDataTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingSkill, setEditingSkill] = React.useState<Skill | null>(null);

  const handleDelete = async (id: string) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiant utilisateur manquant." });
      return;
    }
    const result = await deleteSkill(userId, id);
    if (result.success) {
      toast({ title: "Succès", description: result.message });
      router.refresh(); // Or use the refreshKey strategy if needed
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    if (!userId) {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiant utilisateur manquant pour ajouter une compétence." });
      return;
    }
    setEditingSkill(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew} disabled={!userId}>
           Ajouter une Nouvelle Compétence
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  Aucune compétence trouvée.
                </TableCell>
              </TableRow>
            )}
            {skills.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell className="font-medium">{skill.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {skill.category === "conception" ? "Conception" :
                     skill.category === "technique" ? "Technique" :
                     skill.category === "logiciels" ? "Logiciels" :
                     skill.category === "gestion" ? "Gestion" : 
                     skill.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={skill.level} className="w-[100px] h-2" />
                    <span>{skill.level}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(skill)} title="Modifier la compétence" disabled={!userId}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertTrigger asChild>
                      <Button variant="destructive" size="icon" title="Supprimer la compétence" disabled={!userId}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertTrigger>
                    <AlertContent>
                      <AlertHeader>
                        <AlertTitle>Êtes-vous sûr(e) ?</AlertTitle>
                        <AlertDescription>
                          Cette action est irréversible. Cela supprimera définitivement la compétence "{skill.name}".
                        </AlertDescription>
                      </AlertHeader>
                      <AlertFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(skill.id!)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertFooter>
                    </AlertContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSkill ? "Modifier la Compétence" : "Ajouter une Nouvelle Compétence"}</DialogTitle>
            <DialogDescription>
              {editingSkill ? `Mettez à jour les détails pour ${editingSkill.name}.` : "Remplissez les détails pour la nouvelle compétence."}
            </DialogDescription>
          </DialogHeader>
          <SkillForm
            skill={editingSkill}
            userId={userId} // Pass userId to SkillForm
            onSubmitAction={editingSkill?.id ? (formData) => updateSkill(userId, editingSkill.id!, formData) : (formData) => addSkill(userId, formData)}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingSkill(null);
              router.refresh(); // Or use the refreshKey strategy
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
