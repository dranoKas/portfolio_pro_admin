
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Star, MessageSquare, UserCircle, TextQuote, Info, Linkedin, Twitter, Instagram, Facebook, Globe, Printer, Building, Palette, Users, Loader2, ExternalLink } from "lucide-react";
import { getProjects, getSkills, getTestimonials, getPersonalData } from "./actions"; // ProjectDocument, Skill, Testimonial types are also exported from actions
import { PageHeader } from "@/components/admin/PageHeader";
import NextImage from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { PersonalData, ProjectDocument, Skill, Testimonial } from "@/lib/schema";
import { generatePortfolioBrochureText, type GeneratePortfolioBrochureTextOutput } from "@/ai/flows/generate-portfolio-brochure-text-flow";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";


const socialIconMapDisplay: { [key: string]: React.ElementType } = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  globe: Globe,
  default: Globe,
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};


export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = React.useState<ProjectDocument[]>([]);
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>([]);
  const [personalData, setPersonalData] = React.useState<PersonalData | null>(null);
  const [brochureText, setBrochureText] = React.useState<GeneratePortfolioBrochureTextOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isLoadingAIText, setIsLoadingAIText] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      if (!user?.uid || authLoading) {
        if (!authLoading) setIsLoadingData(false); // If auth is done and no user, stop loading
        return;
      }

      setIsLoadingData(true);
      setIsLoadingAIText(true);
      try {
        const [pd, projectsData, skillsData, testimonialsData] = await Promise.all([
          getPersonalData(user.uid),
          getProjects(user.uid),
          getSkills(user.uid),
          getTestimonials(user.uid)
        ]);
        setPersonalData(pd);
        setProjects(projectsData);
        setSkills(skillsData);
        setTestimonials(testimonialsData);
        
        if (pd) {
          try {
            // Ensure projectsData sent to AI has correct structure (imageUrls as array)
            const aiInputProjects = projectsData.map(p => ({
              ...p,
              imageUrls: p.imageUrls || [] // Ensure imageUrls is an array even if empty
            }));

            const aiText = await generatePortfolioBrochureText({
              personalData: pd,
              projects: aiInputProjects, 
              skills: skillsData,
              testimonials: testimonialsData,
            });
            setBrochureText(aiText);
          } catch (aiError: any) {
            console.error("Erreur lors de la génération du texte par IA:", aiError);
            let introMessage = "L'introduction n'a pas pu être générée. Veuillez vérifier la configuration de l'IA.";
            let highlightsMessage = "Les points forts des projets n'ont pas pu être générés.";
            let conclusionMessage = "La conclusion n'a pas pu être générée.";

            if (typeof aiError?.message === 'string' && (aiError.message.toLowerCase().includes('service unavailable') || aiError.message.toLowerCase().includes('overloaded') || aiError.message.toLowerCase().includes('503'))) {
                introMessage = "Le service de génération de texte est temporairement surchargé ou indisponible. Veuillez réessayer plus tard.";
                highlightsMessage = "Le service de génération de texte est temporairement surchargé ou indisponible. Veuillez réessayer plus tard.";
                conclusionMessage = "Le service de génération de texte est temporairement surchargé ou indisponible. Veuillez réessayer plus tard.";
            }
            setBrochureText({
              introduction: introMessage,
              projectHighlights: highlightsMessage,
              conclusion: conclusionMessage
            });
          }
        } else {
           setBrochureText({
              introduction: "Données personnelles non disponibles pour générer un résumé.",
              projectHighlights: "Projets non disponibles pour générer un résumé.",
              conclusion: "Données non disponibles pour générer une conclusion."
            });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données du portfolio:", error);
         setBrochureText({
              introduction: "Erreur lors du chargement des données pour l'introduction.",
              projectHighlights: "Erreur lors du chargement des données pour les projets.",
              conclusion: "Erreur lors du chargement des données pour la conclusion."
            });
      } finally {
        setIsLoadingData(false);
        setIsLoadingAIText(false);
      }
    }
    fetchData();
  }, [user, authLoading]);


  const stats = [
    {
      title: "Projets",
      count: projects.length,
      icon: Briefcase,
      color: "text-primary",
    },
    {
      title: "Compétences",
      count: skills.length,
      icon: Star,
      color: "text-primary",
    },
    {
      title: "Témoignages",
      count: testimonials.length,
      icon: MessageSquare,
      color: "text-primary", 
    },
  ];

  const MAX_IMAGES_PER_PROJECT_PRINT = 3;

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="admin-dashboard-page-header">
        <PageHeader 
          title={`Bienvenue, ${personalData?.name || 'Admin'}`}
          description="Voici un aperçu du contenu de votre portfolio. Vous pouvez l'imprimer ou l'ouvrir dans un nouvel onglet."
          actions={
            <div className="print-button-container flex gap-2">
              <Button 
                onClick={() => window.print()} 
                variant="outline" 
                className="bg-card hover:bg-accent"
                disabled={isLoadingData || isLoadingAIText}
              >
                {isLoadingData || isLoadingAIText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Imprimer le Portfolio
              </Button>
              <Button asChild variant="default">
                <Link href="#" target="_blank"> 
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir le Portfolio
                </Link>
              </Button>
            </div>
          }
        />
      </div>
      
      <div className="admin-dashboard-stats-grid grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${stat.color}`}>{!isLoadingData ? stat.count : <Loader2 className="h-8 w-8 animate-spin"/>}</div>
              <p className="text-xs text-muted-foreground pt-1">
                Total de {stat.title.toLowerCase()} gérés
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(isLoadingData || isLoadingAIText) && !authLoading && (
        <Card className="shadow-lg" id="personal-data-card-print-loading">
          <CardHeader>
            <CardTitle>Chargement des informations du portfolio...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3">Veuillez patienter pendant que nous chargeons l'ensemble des données et préparons les textes pour l'impression.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingData && personalData && (
        <Card className="shadow-lg mb-8 personal-data-card-screen">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={personalData.profileImageUrl || undefined} alt={personalData.name || "Avatar"} data-ai-hint="person portrait" />
                <AvatarFallback>
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{personalData.name}</CardTitle>
                <CardDescription className="text-lg text-primary">{personalData.title}</CardDescription>
              </div>
            </div>
             {personalData.coverImageUrl && (
                <div className="mt-4 -mx-6 aspect-[16/6] relative overflow-hidden rounded-t-lg">
                    <NextImage 
                        src={personalData.coverImageUrl} 
                        alt="Photo de couverture" 
                        fill={true}
                        style={{objectFit: "cover"}}
                        data-ai-hint="office workspace"
                    />
                </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {personalData.whoAmI && (
                 <div className="pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center"><Info className="w-4 h-4 mr-2 text-primary"/>Qui suis-je</h3>
                    <p className="text-foreground">{personalData.whoAmI}</p>
                 </div>
            )}
            {personalData.bio && (
                 <div className="pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center"><TextQuote className="w-4 h-4 mr-2 text-primary"/>Biographie</h3>
                    <p className="text-foreground whitespace-pre-line">{personalData.bio}</p>
                 </div>
            )}
             {personalData.aboutMe && (
                 <div className="pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center"><UserCircle className="w-4 h-4 mr-2 text-primary"/>À Propos de Moi</h3>
                    <p className="text-foreground whitespace-pre-line">{personalData.aboutMe}</p>
                 </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Email</h3>
                    <p className="text-foreground">{personalData.email}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Localisation</h3>
                    <p className="text-foreground">{personalData.location}</p>
                </div>
                {personalData.phone && (
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-1">Téléphone</h3>
                        <p className="text-foreground">{personalData.phone}</p>
                    </div>
                )}
            </div>
           
            {personalData.socials && personalData.socials.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Réseaux Sociaux</h3>
                <div className="flex flex-wrap gap-3">
                  {personalData.socials.map(social => {
                    const Icon = socialIconMapDisplay[social.icon.toLowerCase() as keyof typeof socialIconMapDisplay] || socialIconMapDisplay.default;
                    const displayName = social.icon === 'globe' ? 'Site Web' : capitalizeFirstLetter(social.icon);
                    return (
                      <a key={social.id || social.icon} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Icon className="w-5 h-5"/>
                        {displayName}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {!isLoadingData && !personalData && !authLoading && (
         <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Aucune donnée personnelle trouvée.</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Veuillez compléter vos informations personnelles dans la section dédiée pour une impression complète.</p>
          </CardContent>
        </Card>
      )}

      {/* Contenu du Portfolio pour Impression - Caché à l'écran, visible à l'impression */}
      <div className="print-only-content" style={{ display: 'none' }}>
        {/* Section Données Personnelles pour Impression */}
        {personalData && (
          <section className="personal-data-print-section" id="personal-data-card-print">
            <header className="print-portfolio-header">
                <div className="print-header-info">
                    {personalData.profileImageUrl && (
                         <img src={personalData.profileImageUrl} alt={personalData.name || "Avatar"} className="print-profile-avatar" data-ai-hint="person portrait"/>
                    )}
                    <div>
                        <h1 className="print-portfolio-name">{personalData.name}</h1>
                        <p className="print-portfolio-title">{personalData.title}</p>
                    </div>
                </div>
                {personalData.coverImageUrl && (
                    <div className="print-cover-image-container">
                        <img src={personalData.coverImageUrl} alt="Photo de couverture" className="print-cover-image" data-ai-hint="office workspace"/>
                    </div>
                )}
            </header>
            
            <div className="print-contact-info">
                {personalData.email && <p><strong>Email:</strong> {personalData.email}</p>}
                {personalData.phone && <p><strong>Téléphone:</strong> {personalData.phone}</p>}
                {personalData.location && <p><strong>Localisation:</strong> {personalData.location}</p>}
            </div>
            {personalData.socials && personalData.socials.length > 0 && (
              <div className="print-social-links">
                <strong>Réseaux :</strong>
                {personalData.socials.map(social => {
                  const displayName = social.icon === 'globe' ? 'Site Web' : capitalizeFirstLetter(social.icon);
                  return (
                    <span key={social.id || social.icon} className="print-social-link">
                      {displayName}: {social.url}
                    </span>
                  );
                })}
              </div>
            )}

            {brochureText?.introduction && (
              <div className="print-ai-text print-introduction">
                <h2 className="print-ai-title">Introduction</h2>
                <p>{brochureText.introduction}</p>
              </div>
            )}
            
            {personalData.whoAmI && <div className="print-bio-section"><h3>Qui suis-je ?</h3><p>{personalData.whoAmI}</p></div>}
            {personalData.bio && <div className="print-bio-section"><h3>Biographie</h3><p className="whitespace-pre-line">{personalData.bio}</p></div>}
            {personalData.aboutMe && <div className="print-bio-section"><h3>À Propos de Moi</h3><p className="whitespace-pre-line">{personalData.aboutMe}</p></div>}
          </section>
        )}

        {/* Points Forts des Projets (Généré par IA) */}
        {brochureText?.projectHighlights && (
          <section className="print-ai-text print-project-highlights">
            <h2 className="print-ai-title">Points Clés des Projets</h2>
            <p>{brochureText.projectHighlights}</p>
          </section>
        )}

        {/* Section Projets pour Impression */}
        {projects.length > 0 && (
          <section className="projects-print-section">
            <h2 className="print-section-title"><Building className="inline-block mr-2 h-6 w-6" />Projets Réalisés</h2>
            {projects.map(project => (
              <div key={project.id} className="project-print-item">
                <h3 className="print-item-title">{project.title}</h3>
                {project.imageUrls && project.imageUrls.length > 0 && (
                  <div className="project-print-images-gallery">
                    {project.imageUrls.slice(0, MAX_IMAGES_PER_PROJECT_PRINT).map((url, index) => (
                      <img 
                          key={index}
                          src={url} 
                          alt={`Image ${index + 1} de ${project.title}`} 
                          className="project-print-gallery-image"
                          data-ai-hint="architecture building"
                      />
                    ))}
                  </div>
                )}
                <p className="print-item-description">{project.description}</p>
                {project.category.length > 0 && <p className="print-item-meta"><strong>Catégories :</strong> {project.category.join(', ')}</p>}
                {project.technologies.length > 0 && <p className="print-item-meta"><strong>Technologies :</strong> {project.technologies.join(', ')}</p>}
                 {project.demoUrl && <p className="print-item-meta"><strong>Démo :</strong> {project.demoUrl}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Section Compétences pour Impression */}
        {skills.length > 0 && (
          <section className="skills-print-section">
            <h2 className="print-section-title"><Palette className="inline-block mr-2 h-6 w-6" />Compétences Clés</h2>
            <div className="skills-print-grid">
              {skills.map(skill => (
                <div key={skill.id} className="skill-print-item">
                  <h3 className="print-item-title-skill">{skill.name} <Badge variant="secondary" className="ml-2 capitalize">{skill.category === "conception" ? "Conception" : skill.category === "technique" ? "Technique" : skill.category === "logiciels" ? "Logiciels" : skill.category === "gestion" ? "Gestion" : skill.category}</Badge></h3>
                  <div className="flex items-center gap-2">
                    <Progress value={skill.level} className="w-[100px] h-2 print-progress-bar" />
                    <span className="text-sm">{skill.level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section Témoignages pour Impression */}
        {testimonials.length > 0 && (
          <section className="testimonials-print-section">
            <h2 className="print-section-title"><Users className="inline-block mr-2 h-6 w-6" />Témoignages Clients</h2>
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="testimonial-print-item">
                <p className="print-item-quote">"{testimonial.text}"</p>
                <p className="print-item-author">- {testimonial.name}, {testimonial.position} chez {testimonial.company}</p>
              </div>
            ))}
          </section>
        )}

        {/* Conclusion (Générée par IA) */}
        {brochureText?.conclusion && (
          <section className="print-ai-text print-conclusion">
            <h2 className="print-ai-title">Conclusion</h2>
            <p>{brochureText.conclusion}</p>
          </section>
        )}

         {(!isLoadingData && !isLoadingAIText && projects.length === 0 && skills.length === 0 && testimonials.length === 0 && !personalData && !authLoading) && (
            <p className="text-center text-muted-foreground py-10">Aucune donnée de portfolio à imprimer. Veuillez compléter les informations dans les sections dédiées.</p>
        )}
      </div>
    </div>
  );
}

    

    