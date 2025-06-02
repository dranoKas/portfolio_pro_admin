
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { PersonalDataSchema, type PersonalData } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { updatePersonalData } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Trash2, PlusCircle, Linkedin, Instagram, Twitter, Globe, Facebook, Loader2, Sparkles } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reformulateText } from "@/ai/flows/reformulate-text-flow";
import { useAuth } from "@/context/AuthContext";


const socialIconMap: { [key: string]: React.ElementType } = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  globe: Globe,
  default: Globe,
};

interface PersonalInfoFormProps {
  data: PersonalData | null;
}

type AiLoadingState = {
  [key in keyof PersonalData]?: boolean;
};

export function PersonalInfoForm({ data }: PersonalInfoFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from context
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState<AiLoadingState>({});

  const form = useForm<PersonalData>({
    resolver: zodResolver(PersonalDataSchema),
    defaultValues: data || {
      userId: user?.uid || "", // Initialize with current user's UID if available
      name: "",
      title: "",
      bio: "",
      location: "",
      email: "",
      phone: "",
      socials: [],
      profileImageUrl: "",
      coverImageUrl: "",
      aboutMe: "",
      whoAmI: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socials",
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(data?.profileImageUrl || null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(data?.coverImageUrl || null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const revokeBlobUrl = useCallback((url: string | null) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    const defaultVals = data || {
      userId: user?.uid || "",
      name: "", title: "", bio: "", location: "", email: "", phone: "",
      socials: [], profileImageUrl: "", coverImageUrl: "", aboutMe: "", whoAmI: "",
    };
    if (data?.profileImageUrl) setProfileImagePreview(data.profileImageUrl); else setProfileImagePreview(null);
    if (data?.coverImageUrl) setCoverImagePreview(data.coverImageUrl); else setCoverImagePreview(null);
    
    form.reset(defaultVals);
    
    return () => {
      revokeBlobUrl(profileImagePreview);
      revokeBlobUrl(coverImagePreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, user, revokeBlobUrl, form.reset]); // Added user to dependency array

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImageFile: React.Dispatch<React.SetStateAction<File | null>>,
    setImagePreview: React.Dispatch<React.SetStateAction<string | null>>,
    currentPreview: string | null
  ) => {
    revokeBlobUrl(currentPreview);
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      if (currentPreview && !currentPreview.startsWith('blob:')) {
         setImagePreview(currentPreview);
      } else {
         setImagePreview(null);
      }
    }
  };
  
  const uploadImage = async (file: File, pathPrefix: string): Promise<string> => {
    const fileName = `${pathPrefix}/${crypto.randomUUID()}-${file.name}`;
    const imageRef = storageRef(storage, fileName);
    await uploadBytesResumable(imageRef, file);
    return getDownloadURL(imageRef);
  };

  const handleAiReformulate = async (fieldName: keyof PersonalData, fieldLabel: string) => {
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


  async function onSubmit(values: PersonalData) {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Erreur d'authentification", description: "Impossible de sauvegarder. Utilisateur non connecté." });
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    let finalProfileImageUrl = values.profileImageUrl || "";
    let finalCoverImageUrl = values.coverImageUrl || "";

    if (profileImageFile) {
      setIsUploadingProfile(true);
      try {
        finalProfileImageUrl = await uploadImage(profileImageFile, `personalData/${user.uid}/profileImages`);
        form.setValue("profileImageUrl", finalProfileImageUrl, { shouldDirty: true });
      } catch (error) {
        toast({ variant: "destructive", title: "Erreur d'Upload", description: "Échec du téléchargement de l'image de profil." });
        setIsUploadingProfile(false);
        setIsProcessing(false);
        return;
      }
      setIsUploadingProfile(false);
    }

    if (coverImageFile) {
      setIsUploadingCover(true);
      try {
        finalCoverImageUrl = await uploadImage(coverImageFile, `personalData/${user.uid}/coverImages`);
        form.setValue("coverImageUrl", finalCoverImageUrl, { shouldDirty: true });
      } catch (error) {
        toast({ variant: "destructive", title: "Erreur d'Upload", description: "Échec du téléchargement de l'image de couverture." });
        setIsUploadingCover(false);
        setIsProcessing(false);
        return;
      }
      setIsUploadingCover(false);
    }
    
    // Ensure userId from authenticated user is part of the values to be submitted
    const dataToSubmit = {
        ...values,
        userId: user.uid, // Crucial: Use the authenticated user's UID
        profileImageUrl: finalProfileImageUrl,
        coverImageUrl: finalCoverImageUrl,
    };

    // Populate formData from dataToSubmit
    Object.entries(dataToSubmit).forEach(([key, value]) => {
      if (key === 'socials' && Array.isArray(value)) {
        value.forEach((social, index) => {
          Object.entries(social).forEach(([socialKey, socialValue]) => {
            formData.append(`socials[${index}].${socialKey}`, String(socialValue));
          });
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    // The id of the document is user.uid, so it's not part of formData fields.

    const result = await updatePersonalData(user.uid, formData); // Pass user.uid as the document ID
    setIsProcessing(false);

    if (result.success) {
      toast({ title: "Succès", description: result.message });
      setProfileImageFile(null); 
      revokeBlobUrl(profileImagePreview);
      if (finalProfileImageUrl) setProfileImagePreview(finalProfileImageUrl); else setProfileImagePreview(null);

      setCoverImageFile(null);
      revokeBlobUrl(coverImagePreview);
      if (finalCoverImageUrl) setCoverImagePreview(finalCoverImageUrl); else setCoverImagePreview(null);
      
      // Reset the form with the latest saved data, including the correct userId
      form.reset(dataToSubmit); 
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message || "Une erreur s'est produite." });
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
                 form.setError(field as keyof PersonalData, { message: errors[0] });
            }
        });
      }
    }
  }
  
  const isFormSubmitting = form.formState.isSubmitting || isUploadingProfile || isUploadingCover || isProcessing;

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* userId field is implicitly handled and should not be displayed or manually edited */}
        {/* <FormField control={form.control} name="userId" render={({ field }) => <Input type="hidden" {...field} />} /> */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom Complet</FormLabel>
                <FormControl>
                  <Input placeholder="Marie Dubois" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre / Profession</FormLabel>
                <FormControl>
                  <Input placeholder="Architecte DPLG" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="whoAmI"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Qui suis-je (court)</FormLabel>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleAiReformulate("whoAmI", "Qui suis-je")} disabled={aiLoading.whoAmI || isFormSubmitting}>
                    {aiLoading.whoAmI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2 sr-only">Reformuler avec l'IA</span>
                  </Button>
                </div>
                <FormControl>
                  <Input placeholder="Architecte passionnée par le design durable..." {...field} />
                </FormControl>
                <FormDescription>Une brève description de vous.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Biographie</FormLabel>
                 <Button type="button" variant="ghost" size="sm" onClick={() => handleAiReformulate("bio", "Biographie")} disabled={aiLoading.bio || isFormSubmitting}>
                    {aiLoading.bio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2 sr-only">Reformuler avec l'IA</span>
                  </Button>
              </div>
              <FormControl>
                <Textarea placeholder="Détaillez votre parcours, votre philosophie..." {...field} rows={3} />
              </FormControl>
              <FormDescription>Cette biographie apparaîtra sur votre page principale.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="aboutMe"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>À propos de moi (détaillé)</FormLabel>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleAiReformulate("aboutMe", "À propos de moi")} disabled={aiLoading.aboutMe || isFormSubmitting}>
                    {aiLoading.aboutMe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2 sr-only">Reformuler avec l'IA</span>
                  </Button>
                </div>
                <FormControl>
                  <Textarea placeholder="Parlez plus en détail de vos expériences, inspirations..." {...field} rows={6}/>
                </FormControl>
                <FormDescription>Ce texte peut être utilisé sur une page "À propos" dédiée.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormItem>
            <FormLabel>Photo de Profil</FormLabel>
            <FormControl>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, setProfileImageFile, setProfileImagePreview, profileImagePreview)}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                disabled={isFormSubmitting}
              />
            </FormControl>
            {isUploadingProfile && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Téléchargement...</div>}
            {profileImagePreview && (
              <div className="mt-2 relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary shadow-md">
                <NextImage src={profileImagePreview} alt="Aperçu profil" layout="fill" objectFit="cover" data-ai-hint="person portrait"/>
              </div>
            )}
            <FormMessage>{form.formState.errors.profileImageUrl?.message}</FormMessage>
          </FormItem>

          <FormItem>
            <FormLabel>Photo de Couverture</FormLabel>
            <FormControl>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, setCoverImageFile, setCoverImagePreview, coverImagePreview)}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                disabled={isFormSubmitting}
              />
            </FormControl>
            {isUploadingCover && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Téléchargement...</div>}
            {coverImagePreview && (
              <div className="mt-2 relative w-full aspect-[16/9] rounded-md overflow-hidden border-2 border-primary shadow-md">
                <NextImage src={coverImagePreview} alt="Aperçu couverture" layout="fill" objectFit="cover" data-ai-hint="office workspace"/>
              </div>
            )}
            <FormMessage>{form.formState.errors.coverImageUrl?.message}</FormMessage>
          </FormItem>
        </div>
        

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localisation</FormLabel>
                <FormControl>
                  <Input placeholder="Paris, France" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="marie@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="+33 6 12 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="text-lg font-semibold mb-2 block">Liens Sociaux</FormLabel>
          {fields.map((item, index) => {
            const Icon = socialIconMap[form.watch(`socials.${index}.icon`).toLowerCase() as keyof typeof socialIconMap] || socialIconMap.default;
            return (
              <div key={item.id} className="flex items-end gap-4 p-4 border rounded-md mb-4 relative">
                <div className="flex-shrink-0 pt-6">
                  <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                  <FormField
                    control={form.control}
                    name={`socials.${index}.icon`}
                    render={({ field }) => (
                       <FormItem>
                        <FormLabel>Plateforme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une plateforme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="globe">Autre (Site Web)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name={`socials.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10" disabled={isFormSubmitting}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: crypto.randomUUID(), url: "", icon: "globe" })}
            className="mt-2"
            disabled={isFormSubmitting}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un Lien Social
          </Button>
        </div>

        <SubmitButton disabled={isFormSubmitting} pendingText="Enregistrement...">Enregistrer les Modifications</SubmitButton>
      </form>
    </Form>
    <Dialog open={isProcessing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Traitement en Cours</DialogTitle>
            <DialogDescription>
              Veuillez patienter pendant que nous enregistrons vos informations.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
