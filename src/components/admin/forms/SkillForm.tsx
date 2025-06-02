
"use client";

import React from "react"; // Added this line
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SkillSchema, type Skill } from "@/lib/schema";
import { Input } from "@/components/ui/input";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SubmitButton } from "@/components/admin/SubmitButton";

interface SkillFormProps {
  skill?: Skill | null;
  userId: string; // Added userId prop
  onSubmitAction: (formData: FormData) => Promise<any>; 
  onSuccess?: () => void; 
}

export function SkillForm({ skill, userId, onSubmitAction, onSuccess }: SkillFormProps) {
  const { toast } = useToast();
  const form = useForm<Skill>({
    resolver: zodResolver(SkillSchema),
    defaultValues: skill 
      ? { ...skill, userId: skill.userId || userId } // Ensure userId is correctly set for existing skills
      : {
          userId: userId, // Set userId for new skills
          name: "",
          level: 50,
          category: undefined, 
        },
  });

  // Effect to reset form if skill or userId changes, ensuring userId is always current
  React.useEffect(() => {
    form.reset(skill 
      ? { ...skill, userId: skill.userId || userId } 
      : {
          userId: userId,
          name: "",
          level: 50,
          category: undefined,
        }
    );
  }, [skill, userId, form.reset, form]);

  async function onSubmit(values: Skill) {
    const formData = new FormData();
    // Ensure userId is included in formData, taking it from the validated 'values'
    // which should have been initialized/reset correctly with the userId.
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
    });
    // If values.userId is somehow not set (should not happen with proper initialization),
    // explicitly append the prop userId as a fallback, although schema validation should catch this.
    if (!formData.has('userId') && userId) {
        formData.append('userId', userId);
    }


    const result = await onSubmitAction(formData);
    if (result.success) {
      toast({ title: "Succès", description: result.message });
      onSuccess?.();
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
                 form.setError(field as keyof Skill, { message: errors[0] });
            }
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden field for userId if needed, though it's part of the schema and values object */}
        <FormField control={form.control} name="userId" render={({ field }) => <Input type="hidden" {...field} />} />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la Compétence</FormLabel>
              <FormControl>
                <Input placeholder="AutoCAD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Niveau de Maîtrise (0-100)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="90" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="conception">Conception</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="logiciels">Logiciels</SelectItem>
                  <SelectItem value="gestion">Gestion</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton className="w-full">
          {skill?.id ? "Mettre à Jour la Compétence" : "Ajouter la Compétence"}
        </SubmitButton>
      </form>
    </Form>
  );
}
