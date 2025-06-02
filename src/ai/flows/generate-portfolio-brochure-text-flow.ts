
'use server';
/**
 * @fileOverview Génère des textes complémentaires pour une brochure de portfolio d'architecte.
 *
 * - generatePortfolioBrochureText - Une fonction qui crée une introduction, des points forts des projets et une conclusion.
 * - GeneratePortfolioBrochureTextInput - Le type d'entrée pour la fonction.
 * - GeneratePortfolioBrochureTextOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { PersonalData as MainPersonalData, ProjectDocument as MainProjectDocument, Skill as MainSkill, Testimonial as MainTestimonial } from '@/lib/schema';

// Schéma Zod pour PersonalData (aligné avec le type PersonalData de schema.ts)
// L'ID ici est l'ID du document, qui correspond à l'userId.
const PersonalDataSchemaForAI = z.object({
  id: z.string().optional(), // Correspond à l'userId (ID du document)
  name: z.string(),
  title: z.string(),
  bio: z.string(),
  location: z.string(),
  email: z.string().email(),
  phone: z.string(),
  socials: z.array(z.object({ id: z.string().optional(), url: z.string().url(), icon: z.string() })).optional().default([]),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  aboutMe: z.string().optional().or(z.literal('')),
  whoAmI: z.string().optional().or(z.literal('')),
}).describe("Données personnelles de l'architecte.");
export type PersonalDataForAI = z.infer<typeof PersonalDataSchemaForAI>;


// Schéma Zod pour ProjectDocument (aligné avec le type ProjectDocument de schema.ts)
const ProjectDocumentSchemaForAI = z.object({
  id: z.string(),
  userId: z.string(), // Ajout de userId
  title: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string().url()).optional().default([]),
  category: z.array(z.string()),
  technologies: z.array(z.string()),
  demoUrl: z.string().url().optional().or(z.literal('')),
  repoUrl: z.string().url().optional().or(z.literal('')),
}).describe("Liste des projets de l'architecte.");
export type ProjectDocumentForAI = z.infer<typeof ProjectDocumentSchemaForAI>;

// Schéma Zod pour Skill (aligné avec le type Skill de schema.ts)
const SkillSchemaForAI = z.object({
  id: z.string().optional(),
  userId: z.string(), // Ajout de userId
  name: z.string(),
  level: z.number().min(0).max(100),
  category: z.string(),
}).describe("Liste des compétences de l'architecte.");
export type SkillForAI = z.infer<typeof SkillSchemaForAI>;

// Schéma Zod pour Testimonial (aligné avec le type Testimonial de schema.ts)
const TestimonialSchemaForAI = z.object({
  id: z.string().optional(),
  userId: z.string(), // Ajout de userId
  name: z.string(),
  position: z.string(),
  company: z.string(),
  avatar: z.string(),
  text: z.string(),
}).describe("Liste des témoignages clients.");
export type TestimonialForAI = z.infer<typeof TestimonialSchemaForAI>;


const GeneratePortfolioBrochureTextInputSchema = z.object({
  personalData: PersonalDataSchemaForAI,
  projects: z.array(ProjectDocumentSchemaForAI),
  skills: z.array(SkillSchemaForAI),
  testimonials: z.array(TestimonialSchemaForAI),
});
export type GeneratePortfolioBrochureTextInput = {
  personalData: MainPersonalData; // Utilise le type principal, l'ID est l'userId
  projects: MainProjectDocument[]; // Contient userId
  skills: MainSkill[]; // Contient userId
  testimonials: MainTestimonial[]; // Contient userId
};


const GeneratePortfolioBrochureTextOutputSchema = z.object({
  introduction: z.string().describe("Une introduction percutante et engageante pour la brochure du portfolio, rédigée en français."),
  projectHighlights: z.string().describe("Un résumé concis et valorisant des aspects clés des projets, mettant en lumière la diversité et l'expertise, rédigé en français."),
  conclusion: z.string().describe("Une conclusion forte et prospective pour la brochure, incitant à la prise de contact, rédigée en français."),
});
export type GeneratePortfolioBrochureTextOutput = z.infer<typeof GeneratePortfolioBrochureTextOutputSchema>;

export async function generatePortfolioBrochureText(input: GeneratePortfolioBrochureTextInput): Promise<GeneratePortfolioBrochureTextOutput> {
  // Map input data to AI schemas if necessary, especially for personalData to include `id` as `userId` if AI schema expects `userId`
  const aiInput = {
    personalData: { // personalData.id est l'userId
      ...input.personalData,
      id: input.personalData.id // Assure que l'ID (qui est l'userId) est bien passé
    },
    projects: input.projects.map(p => ({
      ...p,
      imageUrls: p.imageUrls || [] // S'assurer que imageUrls est un tableau
    })),
    skills: input.skills,
    testimonials: input.testimonials,
  };
  return generateBrochureTextFlow(aiInput);
}

const prompt = ai.definePrompt({
  name: 'generateBrochureTextPrompt',
  input: { schema: GeneratePortfolioBrochureTextInputSchema }, // Schema interne du prompt
  output: { schema: GeneratePortfolioBrochureTextOutputSchema },
  prompt: `
    Vous êtes un expert en rédaction publicitaire spécialisé dans la création de contenu convaincant pour les portfolios professionnels, spécifiquement pour les architectes.
    Votre tâche est de générer une introduction captivante, un résumé des points forts des projets, et une conclusion percutante pour une brochure de portfolio.
    Le ton doit être professionnel, confiant, et inspirant. **L'intégralité du texte généré doit être en français.**

    Tenez compte du fait que certaines des données fournies (par exemple, les catégories de compétences ou les technologies) peuvent déjà être en français. Intégrez-les naturellement.

    Données Personnelles de l'Architecte:
    Nom: {{personalData.name}}
    Titre: {{personalData.title}}
    Bio: {{{personalData.bio}}}
    Qui suis-je: {{{personalData.whoAmI}}}
    À propos de moi: {{{personalData.aboutMe}}}

    Aperçu des Projets:
    {{#if projects.length}}
      L'architecte a réalisé {{projects.length}} projet(s).
      Voici quelques titres et descriptions pour contextualiser:
      {{#each projects}}
      - Titre: {{this.title}}
        {{#if this.description}}Description: {{{this.description}}}{{/if}}
        {{#if this.category.length}}Catégories: {{#each this.category}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
        {{#if this.technologies.length}}Technologies: {{#each this.technologies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
      {{/each}}
    {{else}}
      Aucun projet spécifique n'est listé pour le moment.
    {{/if}}

    Aperçu des Compétences:
    {{#if skills.length}}
      Les compétences clés incluent:
      {{#each skills}}
      - Nom: {{this.name}} (Catégorie: {{this.category}}, Niveau: {{this.level}}%)
      {{/each}}
    {{else}}
      Aucune compétence spécifique n'est listée pour le moment.
    {{/if}}

    Aperçu des Témoignages:
    {{#if testimonials.length}}
      Les retours clients incluent:
      {{#each testimonials}}
      - "{{{this.text}}}" - {{this.name}}, {{this.company}}
      {{/each}}
    {{else}}
      Aucun témoignage disponible pour le moment.
    {{/if}}

    En vous basant sur toutes les informations fournies, veuillez générer en **FRANÇAIS**:
    1.  **Introduction**: Un paragraphe bref et captivant pour présenter l'architecte et son travail. Mettez en avant sa passion, son expertise et son approche unique. Le style doit être celui d'une brochure élégante.
    2.  **Points Forts des Projets**: Un court paragraphe qui résume l'essence et la diversité des projets. Mentionnez les thèmes communs ou les points forts apparents (innovation, durabilité, esthétique, etc.). Ne listez pas tous les projets, mais donnez une vision globale et attrayante de son œuvre.
    3.  **Conclusion**: Une déclaration tournée vers l'avenir qui encourage les clients potentiels ou les collaborateurs à prendre contact. Elle doit être professionnelle et inspirante.

    Assurez-vous que la sortie est structurée conformément au 'GeneratePortfolioBrochureTextOutputSchema' et que tout le contenu est en français.
  `,
});

const generateBrochureTextFlow = ai.defineFlow(
  {
    name: 'generateBrochureTextFlow',
    inputSchema: GeneratePortfolioBrochureTextInputSchema, // Schema interne du flow
    outputSchema: GeneratePortfolioBrochureTextOutputSchema,
  },
  async (input) => { // input ici sera de type z.infer<typeof GeneratePortfolioBrochureTextInputSchema>
    if (!input.personalData || (!input.projects && !input.skills && !input.testimonials)) {
      return {
        introduction: "Une introduction personnalisée sera bientôt disponible. Veuillez compléter les informations du portfolio.",
        projectHighlights: "Les points forts des projets seront bientôt mis en évidence. Veuillez ajouter des projets.",
        conclusion: "Une conclusion engageante sera bientôt disponible. Veuillez compléter les informations du portfolio."
      };
    }

    const { output } = await prompt(input);
    if (!output) {
      return {
        introduction: "L'introduction n'a pas pu être générée. Veuillez vérifier la configuration de l'IA ou réessayer plus tard.",
        projectHighlights: "Les points forts des projets n'ont pas pu être générés.",
        conclusion: "La conclusion n'a pas pu être générée."
      };
    }
    return output;
  }
);
