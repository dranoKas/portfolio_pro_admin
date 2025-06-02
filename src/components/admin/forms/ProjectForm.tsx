
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ProjectSchema, type ProjectDocument } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addProject, updateProject } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import NextImage from "next/image"; 
import { useState, useEffect, useCallback } from "react";
import type { z } from "zod";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/firebase"; 
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, XCircle, Sparkles } from "lucide-react";
import { reformulateText } from "@/ai/flows/reformulate-text-flow";
import { useAuth } from "@/context/AuthContext";

interface ProjectFormProps {
  project?: ProjectDocument | null;
}

const MAX_IMAGES = 10;

type AiLoadingState = {
  [key in keyof z.infer<typeof ProjectSchema>]?: boolean;
};

export function ProjectForm({ project }: ProjectFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth(); 
  
  const [isUploading, setIsUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState<AiLoadingState>({});
  
  const [initialProjectImageUrls, setInitialProjectImageUrls] = useState<string[]>([]);
  const [currentImagePreviews, setCurrentImagePreviews] = useState<string[]>([]);
  const [filesForUploadQueue, setFilesForUploadQueue] = useState<File[]>([]);
  const [imageSelectionMode, setImageSelectionMode] = useState<'initial' | 'new_selection'>('initial');


  const form = useForm<z.infer<typeof ProjectSchema>>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: project
      ? {
          ...project,
          userId: project.userId, 
          imageUrls: project.imageUrls?.join(",") || "", 
          category: project.category?.join(", ") || "",
          technologies: project.technologies?.join(", ") || "",
        }
      : {
          userId: user?.uid || "", 
          title: "",
          description: "",
          imageUrls: "", 
          category: "",
          technologies: "",
          demoUrl: "",
          repoUrl: "",
        },
  });

  useEffect(() => {
    const defaultVals = project
      ? {
          ...project,
          userId: project.userId,
          imageUrls: project.imageUrls?.join(",") || "",
          category: project.category?.join(", ") || "",
          technologies: project.technologies?.join(", ") || "",
        }
      : {
          userId: user?.uid || "",
          title: "", description: "", imageUrls: "", category: "",
          technologies: "", demoUrl: "", repoUrl: "",
        };
    form.reset(defaultVals);

    if (project?.imageUrls) {
      setInitialProjectImageUrls(project.imageUrls);
      setCurrentImagePreviews(project.imageUrls);
    } else {
      setInitialProjectImageUrls([]);
      setCurrentImagePreviews([]);
    }
    setFilesForUploadQueue([]);
    setImageSelectionMode('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, user, form.reset]);


  const revokeBlobUrls = useCallback((urlsToRevoke: string[]) => {
    urlsToRevoke.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let selectedFiles = Array.from(event.target.files || []);
    
    if (selectedFiles.length > MAX_IMAGES) {
        toast({
            variant: "destructive",
            title: "Trop d'images",
            description: `Vous pouvez sélectionner un maximum de ${MAX_IMAGES} images. Les ${MAX_IMAGES} premiers fichiers ont été conservés.`,
        });
        selectedFiles = selectedFiles.slice(0, MAX_IMAGES);
    }
    
    if (selectedFiles.length > 0) {
      if (imageSelectionMode === 'new_selection') {
        revokeBlobUrls(currentImagePreviews.filter(url => url.startsWith('blob:')));
      }

      setFilesForUploadQueue(selectedFiles);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      const existingNonBlobPreviews = imageSelectionMode === 'initial' ? initialProjectImageUrls : currentImagePreviews.filter(url => !url.startsWith('blob:'));
      setCurrentImagePreviews([...existingNonBlobPreviews, ...newPreviews].slice(-MAX_IMAGES)); 
      setImageSelectionMode('new_selection');
    } else { 
      if (imageSelectionMode === 'new_selection') {
        revokeBlobUrls(currentImagePreviews.filter(url => url.startsWith('blob:'))); 
      }
      setCurrentImagePreviews(initialProjectImageUrls); 
      setFilesForUploadQueue([]);
      setImageSelectionMode('initial');
    }
  };

  const handleRemovePreview = (indexToRemove: number) => {
    const urlToRemove = currentImagePreviews[indexToRemove];

    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
      setFilesForUploadQueue(prev => prev.filter((_, i) => {
          const blobIndex = currentImagePreviews.slice(0, indexToRemove + 1).filter(u => u.startsWith('blob:')).length -1;
          return i !== blobIndex; 
      }));
    }
    
    const newPreviews = currentImagePreviews.filter((_, i) => i !== indexToRemove);
    setCurrentImagePreviews(newPreviews);

    if (newPreviews.every(url => !url.startsWith('blob:')) && !filesForUploadQueue.length) {
       if (JSON.stringify(newPreviews.sort()) === JSON.stringify(initialProjectImageUrls.sort())) {
           setImageSelectionMode('initial');
       }
    }
     if (newPreviews.length === 0) {
        setImageSelectionMode('initial'); 
        setFilesForUploadQueue([]);
     }
  };

  const handleAiReformulate = async (fieldName: keyof z.infer<typeof ProjectSchema>, fieldLabel: string) => {
    setAiLoading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const originalText = form.getValues(fieldName) as string || "";
      const result = await reformulateText({
        originalText,
        fieldName: fieldLabel,
      });
      if (result.reformulatedText) {
        form.setValue(fieldName, result.reformulatedText, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Texte mis à jour par l'IA", description: `Le champ "${fieldLabel}" a été mis à jour.` });
      } else {
        toast({ variant: "destructive", title: "Erreur IA", description: "L'IA n'a pas pu reformuler le texte." });
      }
    } catch (error: any) {
      console.error("Erreur de reformulation IA:", error);
      let description = "Une erreur est survenue lors de la reformulation.";
       if (typeof error?.message === 'string' && (error.message.toLowerCase().includes('service unavailable') || error.message.toLowerCase().includes('overloaded') || error.message.toLowerCase().includes('503'))) {
        description = "Le service de reformulation est temporairement surchargé ou indisponible. Veuillez réessayer plus tard.";
      }
      toast({ variant: "destructive", title: "Erreur IA", description });
    } finally {
      setAiLoading(prev => ({ ...prev, [fieldName]: false }));
    }
  };


  async function onSubmit(values: z.infer<typeof ProjectSchema>) {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Erreur d'authentification", description: "Impossible de sauvegarder. Utilisateur non connecté." });
      return;
    }

    let finalImageUrlsToSubmit: string[] = [];
    
    if (imageSelectionMode === 'new_selection') {
        finalImageUrlsToSubmit = currentImagePreviews.filter(url => !url.startsWith('blob:'));
    } else { 
        finalImageUrlsToSubmit = [...initialProjectImageUrls];
    }


    if (filesForUploadQueue.length > 0) {
      setIsUploading(true);
      try {
        const uploadedUrls = await Promise.all(
          filesForUploadQueue.map(async (file) => {
            const fileName = `projects/${user.uid}/${crypto.randomUUID()}-${file.name}`; 
            const imageRef = storageRef(storage, fileName);
            await uploadBytesResumable(imageRef, file);
            return getDownloadURL(imageRef);
          })
        );
        finalImageUrlsToSubmit = [...finalImageUrlsToSubmit, ...uploadedUrls];
      } catch (error) {
        console.error("Error uploading images:", error);
        toast({ variant: "destructive", title: "Erreur de Téléchargement", description: "Échec du téléchargement des images. Veuillez réessayer." });
        setIsUploading(false);
        return; 
      }
      setIsUploading(false);
    }
    
    finalImageUrlsToSubmit = [...new Set(finalImageUrlsToSubmit)].slice(0, MAX_IMAGES);


    if (finalImageUrlsToSubmit.length > MAX_IMAGES) { 
        toast({
            variant: "destructive",
            title: "Limite d'Images Dépassée",
            description: `Un projet peut avoir un maximum de ${MAX_IMAGES} images. Veuillez réduire le nombre d'images. Vous en avez ${finalImageUrlsToSubmit.length}.`,
        });
        return; 
    }

    const imageUrlsString = finalImageUrlsToSubmit.join(',');
    
    const formData = new FormData();
    const submissionUserId = project?.userId || user.uid;
    
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'imageUrls') return; 
      if (key === 'userId') { 
        formData.append(key, submissionUserId);
        return;
      }
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formData.append('imageUrls', imageUrlsString); 
    if (!values.userId && submissionUserId) { 
        formData.append('userId', submissionUserId);
    }
    
    const result = project?.id
      ? await updateProject(submissionUserId, project.id, formData)
      : await addProject(submissionUserId, formData);

    if (result.success) {
      toast({ title: "Succès", description: result.message });
      // Navigate with a refresh query parameter to trigger data refetch on ProjectsPage
      router.push(`/admin/projects?refresh=${Date.now()}`);
      // router.refresh(); // router.push with query param should be enough to trigger useEffect
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
      if (result.errors) {
         Object.entries(result.errors).forEach(([field, errors]) => {
            const fieldName = field as keyof z.infer<typeof ProjectSchema>;
            if (fieldName === 'imageUrls' && result.errors?.imageUrls) {
                 form.setError('imageUrls', { message: result.errors.imageUrls.join(', ') });
            } else if (errors && errors.length > 0) {
                 form.setError(fieldName, { message: errors[0] });
            }
        });
      }
    }
  }
  
  useEffect(() => {
    const urlsOnUnmount = [...currentImagePreviews];
    return () => {
      revokeBlobUrls(urlsOnUnmount.filter(url => url.startsWith('blob:')));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImagePreviews]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="userId" render={({ field }) => <Input type="hidden" {...field} />} />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Titre du Projet</FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleAiReformulate("title", "Titre du Projet")} disabled={aiLoading.title || isUploading || form.formState.isSubmitting}>
                  {aiLoading.title ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-2 sr-only">Reformuler avec l'IA</span>
                </Button>
              </div>
              <FormControl>
                <Input placeholder="Villa Contemporaine" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
               <div className="flex items-center justify-between">
                <FormLabel>Description</FormLabel>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleAiReformulate("description", "Description du Projet")} disabled={aiLoading.description || isUploading || form.formState.isSubmitting}>
                  {aiLoading.description ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-2 sr-only">Reformuler avec l'IA</span>
                </Button>
              </div>
              <FormControl>
                <Textarea placeholder="Description détaillée du projet..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Images du Projet (Max {MAX_IMAGES})</FormLabel>
          <FormControl>
            <Input 
              type="file" 
              multiple 
              onChange={handleFileChange}
              accept="image/*"
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              disabled={isUploading || form.formState.isSubmitting || aiLoading.title || aiLoading.description}
              key={imageSelectionMode === 'initial' ? 'file-input-initial' : `file-input-new-${filesForUploadQueue.length}`}
            />
          </FormControl>
          <FormDescription>
            {imageSelectionMode === 'new_selection' && filesForUploadQueue.length > 0
              ? `${filesForUploadQueue.length} nouvelle(s) image(s) prête(s) à être téléversée(s). ${currentImagePreviews.filter(url => !url.startsWith('blob:')).length} image(s) existante(s) sera(ont) conservée(s) si non supprimée(s) manuellement.`
              : project?.id && initialProjectImageUrls.length > 0 ? `Actuellement ${initialProjectImageUrls.length} image(s). Sélectionnez de nouveaux fichiers pour les ajouter ou les remplacer.` : `Téléchargez une ou plusieurs images (jusqu'à ${MAX_IMAGES}).`}
             Cliquez sur le 'X' d'une image pour la supprimer.
          </FormDescription>
           {form.formState.errors.imageUrls && <FormMessage>{form.formState.errors.imageUrls.message}</FormMessage>}
        </FormItem>

        {isUploading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Téléchargement des images...</p>
          </div>
        )}

        {currentImagePreviews.length > 0 && !isUploading && (
          <div className="mt-4">
            <Label>Aperçus des Images ({currentImagePreviews.length}/{MAX_IMAGES}):</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentImagePreviews.map((url, index) => (
                <div key={url || index} className="relative aspect-video rounded-md overflow-hidden border shadow-sm group">
                  <NextImage 
                    src={url} 
                    alt={`Aperçu ${index + 1}`} 
                    layout="fill" 
                    objectFit="cover" 
                    data-ai-hint="architecture building"
                    onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/300x200.png?text=Erreur';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-destructive z-10"
                    onClick={() => handleRemovePreview(index)}
                    title="Supprimer l'image"
                    disabled={isUploading || form.formState.isSubmitting || aiLoading.title || aiLoading.description}
                  >
                    <XCircle className="h-full w-full text-white" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {!currentImagePreviews.length && !isUploading && (
             <div className="mt-4 p-6 border border-dashed rounded-md text-center text-muted-foreground bg-card">
                Aucune image sélectionnée ou disponible pour l'aperçu.
             </div>
        )}
        
        <FormField
            control={form.control}
            name="imageUrls"
            render={({ field }) => <input type="hidden" {...field} value={currentImagePreviews.length > 0 ? currentImagePreviews.join(',') : ""} />}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégories (séparées par des virgules)</FormLabel>
              <FormControl>
                <Input placeholder="résidentiel, durable" {...field} />
              </FormControl>
              <FormDescription>Entrez les catégories séparées par des virgules.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="technologies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technologies (séparées par des virgules)</FormLabel>
              <FormControl>
                <Input placeholder="Revit, SketchUp, AutoCAD" {...field} />
              </FormControl>
              <FormDescription>Entrez les technologies séparées par des virgules.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="demoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Démo (Optionnel)</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/demo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="repoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL du Dépôt (Optionnel)</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/user/project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2 pt-4">
          <SubmitButton 
            disabled={isUploading || form.formState.isSubmitting || aiLoading.title || aiLoading.description} 
            pendingText={isUploading ? "Téléchargement..." : (project?.id ? "Mise à jour..." : "Ajout...")}
          >
            {project?.id ? "Mettre à Jour le Projet" : "Ajouter le Projet"}
          </SubmitButton>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isUploading || form.formState.isSubmitting || aiLoading.title || aiLoading.description}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
