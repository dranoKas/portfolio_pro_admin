
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TestimonialSchema, type Testimonial } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addTestimonial, updateTestimonial } from "@/app/admin/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import NextImage from "next/image"; 
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { AVATAR_OPTIONS, getAvatarDetails, getDefaultAvatarKey, type AvatarKey } from "@/lib/avatarOptions";
import { useAuth } from "@/context/AuthContext";


interface TestimonialFormProps {
  testimonial?: Testimonial | null;
}

export function TestimonialForm({ testimonial }: TestimonialFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const defaultAvatarKey = testimonial?.avatar ? testimonial.avatar as AvatarKey : getDefaultAvatarKey();
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<AvatarKey>(defaultAvatarKey);

  const form = useForm<Testimonial>({
    resolver: zodResolver(TestimonialSchema),
    defaultValues: testimonial 
      ? { ...testimonial, userId: testimonial.userId || user?.uid || "" } 
      : {
          userId: user?.uid || "",
          name: "",
          position: "",
          company: "",
          avatar: defaultAvatarKey,
          text: "",
        },
  });

  useEffect(() => {
    const currentFormAvatar = form.watch("avatar") as AvatarKey;
    if (currentFormAvatar) {
        setSelectedAvatarKey(currentFormAvatar);
    }
  }, [form, form.watch("avatar")]);

  useEffect(() => {
    form.reset(testimonial 
      ? { ...testimonial, userId: testimonial.userId || user?.uid || "" } 
      : {
          userId: user?.uid || "",
          name: "", position: "", company: "",
          avatar: defaultAvatarKey, text: "",
        });
  }, [testimonial, user, form, defaultAvatarKey]);
  
  const currentAvatarDetails = getAvatarDetails(selectedAvatarKey);

  async function onSubmit(values: Testimonial) {
    if (!user?.uid) {
        toast({ variant: "destructive", title: "Erreur", description: "Utilisateur non authentifié." });
        return;
    }
    const formData = new FormData();
    const dataToSubmit = { ...values, userId: user.uid }; // Ensure userId is from authenticated user

    Object.entries(dataToSubmit).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    const result = testimonial?.id
      ? await updateTestimonial(user.uid, testimonial.id, formData)
      : await addTestimonial(user.uid, formData);

    if (result.success) {
      toast({ title: "Succès", description: result.message });
      router.push(`/admin/testimonials?refresh=${Date.now()}`);
      // router.refresh(); // router.push with query param should be enough
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
      if (result.errors) {
         Object.entries(result.errors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
                 form.setError(field as keyof Testimonial, { message: errors[0] });
            }
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField control={form.control} name="userId" render={({ field }) => <Input type="hidden" {...field} />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du Client</FormLabel>
                <FormControl>
                  <Input placeholder="Sophie Martin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poste</FormLabel>
                <FormControl>
                  <Input placeholder="Directrice" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entreprise</FormLabel>
              <FormControl>
                <Input placeholder="Promoteur Immobilier XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedAvatarKey(value as AvatarKey);
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un avatar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AVATAR_OPTIONS.map(option => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Choisissez un avatar prédéfini.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {currentAvatarDetails && (
            <div className="mt-2 md:mt-0">
              <Label>Aperçu de l'Avatar :</Label>
              <div className="mt-2 relative w-24 h-24 rounded-full overflow-hidden border shadow-md">
                <NextImage 
                  src={currentAvatarDetails.url} 
                  alt={currentAvatarDetails.name || "Aperçu de l'avatar"} 
                  layout="fill" 
                  objectFit="cover" 
                  data-ai-hint={currentAvatarDetails.hint}
                />
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texte du Témoignage</FormLabel>
              <FormControl>
                <Textarea placeholder="Marie a su parfaitement traduire notre vision..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <SubmitButton>{testimonial?.id ? "Mettre à Jour le Témoignage" : "Ajouter le Témoignage"}</SubmitButton>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
