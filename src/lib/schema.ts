
import { z } from 'zod';
import { AVATAR_OPTIONS, AvatarKey } from './avatarOptions';

// La constante PERSONAL_DATA_DOC_ID n'est plus nécessaire,
// car l'ID du document des données personnelles sera l'userId.

export const SocialSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("URL invalide"),
  icon: z.enum(['linkedin', 'instagram', 'twitter', 'facebook', 'globe'], {
    errorMap: () => ({ message: "Veuillez sélectionner une icône valide." })
  }),
});
export type Social = z.infer<typeof SocialSchema>;

export const PersonalDataSchema = z.object({
  id: z.string().optional(), // Firestore document ID, qui sera l'userId
  userId: z.string(), // UID du propriétaire des données, stocké dans le document
  name: z.string().min(1, "Le nom est requis"),
  title: z.string().min(1, "Le titre est requis"),
  bio: z.string().min(1, "La biographie est requise"),
  location: z.string().min(1, "La localisation est requise"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  socials: z.array(SocialSchema).optional().default([]),
  profileImageUrl: z.string().url("URL de l'image de profil invalide").optional().or(z.literal('')),
  coverImageUrl: z.string().url("URL de l'image de couverture invalide").optional().or(z.literal('')),
  aboutMe: z.string().optional().or(z.literal('')),
  whoAmI: z.string().optional().or(z.literal('')),
});
export type PersonalData = z.infer<typeof PersonalDataSchema>;

export const SkillSchema = z.object({
  id: z.string().optional(), // Firestore ID
  userId: z.string(), // UID du propriétaire
  name: z.string().min(1, "Le nom de la compétence est requis"),
  level: z.coerce.number().min(0, "Le niveau doit être au moins 0").max(100, "Le niveau doit être au plus 100"),
  category: z.enum(['conception', 'technique', 'logiciels', 'gestion'], {
    errorMap: () => ({ message: "Veuillez sélectionner une catégorie valide." })
  }),
});
export type Skill = z.infer<typeof SkillSchema>;

const projectImageUrlsSchema = z.string()
  .transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0 && s !== 'https://placehold.co/100x100.png'))
  .pipe(z.array(z.string().url("Chaque URL d'image doit être une URL valide (ex: https://example.com/image.jpg)."))
    .max(10, "Vous pouvez télécharger un maximum de 10 images.")
    .optional()
  ).default('');


export const ProjectSchema = z.object({
  id: z.string().optional(), // Firestore ID
  userId: z.string(), // UID du propriétaire
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  imageUrls: projectImageUrlsSchema,
  category: z.string().transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0)),
  technologies: z.string().transform(val => val.split(',').map(s => s.trim()).filter(s => s.length > 0)),
  demoUrl: z.string().url("URL de démo invalide").optional().or(z.literal('')),
  repoUrl: z.string().url("URL du dépôt invalide").optional().or(z.literal('')),
});
export type Project = z.infer<typeof ProjectSchema>;

export type ProjectDocument = Omit<Project, 'category' | 'technologies' | 'imageUrls' | 'userId'> & {
  id: string;
  userId: string;
  category: string[];
  technologies: string[];
  imageUrls: string[];
};

const avatarKeys = AVATAR_OPTIONS.map(opt => opt.key) as [AvatarKey, ...AvatarKey[]];

export const TestimonialSchema = z.object({
  id: z.string().optional(), // Firestore ID
  userId: z.string(), // UID du propriétaire
  name: z.string().min(1, "Le nom est requis"),
  position: z.string().min(1, "Le poste est requis"),
  company: z.string().min(1, "L'entreprise est requise"),
  avatar: avatarKeys.length > 0
    ? z.enum(avatarKeys, { errorMap: () => ({ message: "Veuillez sélectionner un avatar valide." }) })
    : z.string().min(1, "La sélection d'un avatar est requise (aucune option disponible)."),
  text: z.string().min(1, "Le texte du témoignage est requis"),
});
export type Testimonial = z.infer<typeof TestimonialSchema>;
