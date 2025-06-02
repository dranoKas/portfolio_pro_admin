
'use server';
/**
 * @fileOverview Un flux Genkit pour reformuler ou suggérer du texte pour les champs d'un portfolio d'architecte.
 *
 * - reformulateText - Fonction principale pour la reformulation/suggestion.
 * - ReformulateTextInput - Type d'entrée pour la fonction.
 * - ReformulateTextOutput - Type de sortie pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReformulateTextInputSchema = z.object({
  originalText: z.string().optional().describe("Le texte original du champ, peut être vide pour une suggestion."),
  fieldName: z.string().describe("Le nom ou le contexte du champ (ex: 'Biographie de l'architecte', 'Titre du projet', 'Description du projet')."),
  // context: z.string().describe("Le contexte général, par exemple 'Portfolio d'architecte'."),
});
export type ReformulateTextInput = z.infer<typeof ReformulateTextInputSchema>;

const ReformulateTextOutputSchema = z.object({
  reformulatedText: z.string().describe("Le texte reformulé ou suggéré par l'IA, en français."),
});
export type ReformulateTextOutput = z.infer<typeof ReformulateTextOutputSchema>;

export async function reformulateText(input: ReformulateTextInput): Promise<ReformulateTextOutput> {
  return reformulateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reformulateTextPrompt',
  input: { schema: ReformulateTextInputSchema },
  output: { schema: ReformulateTextOutputSchema },
  prompt: `
    Vous êtes un assistant expert en rédaction spécialisé dans la création de contenu percutant et professionnel pour les portfolios d'architectes.
    Votre tâche est d'aider à rédiger ou à améliorer le texte pour un champ spécifique d'un portfolio.
    **L'intégralité du texte généré doit être en français.**

    Le champ concerné est : "{{fieldName}}".

    {{#if originalText}}
    Voici le texte original fourni par l'utilisateur :
    """
    {{{originalText}}}
    """
    Veuillez reformuler, améliorer ou enrichir ce texte pour le rendre plus professionnel, engageant et adapté à un portfolio d'architecte.
    Concentrez-vous sur la clarté, l'impact et la pertinence par rapport au rôle d'un architecte et au champ "{{fieldName}}".
    Si le texte original est très court ou semble être un mot-clé, développez-le en une phrase ou un court paragraphe pertinent.
    {{else}}
    L'utilisateur n'a pas fourni de texte original pour le champ "{{fieldName}}".
    Veuillez suggérer un texte pertinent, concis et professionnel pour ce champ, en tenant compte du fait qu'il s'agit d'un portfolio d'architecte.
    Proposez une formulation qui mette en valeur l'expertise et la vision d'un architecte.
    Par exemple, si le champ est 'Titre du projet', suggérez un titre accrocheur et descriptif. Si c'est 'Bio', proposez une introduction concise et professionnelle.
    {{/if}}

    Assurez-vous que la sortie est structurée conformément au 'ReformulateTextOutputSchema' et que tout le contenu est en français. Ne retournez que le texte reformulé/suggéré.
  `,
});

const reformulateTextFlow = ai.defineFlow(
  {
    name: 'reformulateTextFlow',
    inputSchema: ReformulateTextInputSchema,
    outputSchema: ReformulateTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        reformulatedText: "La reformulation/suggestion n'a pas pu être générée pour le moment.",
      };
    }
    return output;
  }
);
