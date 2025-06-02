
"use server";
import { revalidatePath } from "next/cache";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ProjectSchema,
  SkillSchema,
  TestimonialSchema,
  PersonalDataSchema,
  type PersonalData,
  type ProjectDocument,
  type Skill,
  type Testimonial,
} from "@/lib/schema";
import { z } from "zod";

// Helper for error handling
const handleError = (error: unknown) => {
  console.error("Firebase operation failed:", error);
  if (error instanceof z.ZodError) {
    return { success: false, message: "La validation a échoué.", errors: error.flatten().fieldErrors };
  }
  return { success: false, message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite." };
};

// Personal Data Actions
export async function getPersonalData(userId: string): Promise<PersonalData | null> {
  if (!userId) {
    console.error("getPersonalData: userId is required.");
    return null;
  }
  try {
    const docRef = doc(db, "personalData", String(userId)); 
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure the returned object matches the PersonalData type, including id and userId
      return { 
        id: docSnap.id, // This is the userId (document ID)
        userId: data.userId, // This is the userId stored within the document
        name: data.name,
        title: data.title,
        bio: data.bio,
        location: data.location,
        email: data.email,
        phone: data.phone,
        socials: data.socials || [],
        profileImageUrl: data.profileImageUrl || "",
        coverImageUrl: data.coverImageUrl || "",
        aboutMe: data.aboutMe || "",
        whoAmI: data.whoAmI || "",
      } as PersonalData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching personal data for userId:", String(userId), error);
    return null;
  }
}

export async function updatePersonalData(userId: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour la mise à jour." };
  }
  const rawData = Object.fromEntries(formData.entries());

  const socialsArray: any[] = [];
  let i = 0;
  while (rawData[`socials[${i}].icon`] || rawData[`socials[${i}].url`]) {
    if (rawData[`socials[${i}].icon`] && rawData[`socials[${i}].url`]) {
      socialsArray.push({
        id: rawData[`socials[${i}].id`] as string || crypto.randomUUID(),
        url: rawData[`socials[${i}].url`] as string,
        icon: rawData[`socials[${i}].icon`] as string,
      });
    }
    i++;
  }
  
  const dataToValidate: PersonalData = {
    // id: String(userId), // ID du document Firestore, will be userId
    userId: String(userId), // Champ userId dans le document
    name: rawData.name as string || "",
    title: rawData.title as string || "",
    bio: rawData.bio as string || "",
    location: rawData.location as string || "",
    email: rawData.email as string || "",
    phone: rawData.phone as string || "",
    socials: socialsArray,
    profileImageUrl: rawData.profileImageUrl as string || "",
    coverImageUrl: rawData.coverImageUrl as string || "",
    aboutMe: rawData.aboutMe as string || "",
    whoAmI: rawData.whoAmI as string || "",
  };
  
  // Add id to dataToValidate explicitly before validation if it's part of the schema and represents doc ID
  const completeDataToValidate = { ...dataToValidate, id: String(userId) };


  const validation = PersonalDataSchema.safeParse(completeDataToValidate);
  if (!validation.success) {
    console.error("PersonalData validation errors for userId:", String(userId), validation.error.flatten());
    return handleError(validation.error);
  }
  
  if (validation.data.id !== String(userId)) {
    console.error("Erreur critique: L'ID du document pour les données personnelles ne correspond pas au userId fourni. Validated ID:", validation.data.id, "userId:", String(userId));
    return { success: false, message: "Erreur critique d'association des données utilisateur (ID document)." };
  }
  if (validation.data.userId !== String(userId)) {
     console.error("Erreur critique: Le champ userId dans les données personnelles ne correspond pas au userId fourni. Validated userId:", validation.data.userId, "userId:", String(userId));
    return { success: false, message: "Erreur critique d'association des données utilisateur (champ userId)." };
  }

  try {
    const docRef = doc(db, "personalData", String(userId));
    // Exclure 'id' (qui est l'ID du document) des données à sauvegarder dans le document lui-même.
    // 'userId' (le champ) sera sauvegardé.
    const { id, ...dataToSave } = validation.data; 
    await setDoc(docRef, dataToSave, { merge: true });
    
    revalidatePath("/admin/personal-info");
    revalidatePath("/admin");
    return { success: true, message: "Données personnelles mises à jour avec succès." };
  } catch (error) {
    return handleError(error);
  }
}


// Project Actions
export async function getProjects(userId: string): Promise<ProjectDocument[]> {
   if (!userId) {
    console.error("getProjects: userId is required.");
    return [];
  }
  try {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId)
      // Temporarily removed for diagnosis: orderBy("title") 
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectDocument));
  } catch (error) {
    console.error("Error fetching projects for userId:", userId, error);
    if (error instanceof Error && error.message.includes("index")) {
        console.error("INDEX_REQUIRED: Firestore query for projects requires a composite index. Please create it in your Firebase console. The error message should contain a direct link to create it: ", error.message);
    }
    return [];
  }
}

export async function getProjectById(userId: string, id: string): Promise<ProjectDocument | null> {
  if (!userId) {
    console.error("getProjectById: userId is required.");
    return null;
  }
  try {
    const docRef = doc(db, "projects", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const project = { id: docSnap.id, ...docSnap.data() } as ProjectDocument;
      if (project.userId === userId) {
        return project;
      }
      console.warn(`Attempted to fetch project ${id} not belonging to user ${userId}. Project owner: ${project.userId}`);
      return null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching project by ID:", id, "for userId:", userId, error);
    return null;
  }
}

export async function addProject(userId: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour ajouter un projet." };
  }
  const rawData = Object.fromEntries(formData);
  const dataToValidate = { ...rawData, userId: userId }; 
  const validation = ProjectSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return handleError(validation.error);
  }
  try {
    await addDoc(collection(db, "projects"), validation.data);
    revalidatePath("/admin/projects");
    return { success: true, message: "Projet ajouté avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateProject(userId: string, id: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour mettre à jour un projet." };
  }
  const rawData = Object.fromEntries(formData);
  const dataToValidate = { ...rawData, userId: userId }; 
  const validation = ProjectSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return handleError(validation.error);
  }
  try {
    const existingProject = await getProjectById(userId, id); 
    if (!existingProject) { 
      return { success: false, message: "Opération non autorisée ou projet non trouvé." };
    }
    const docRef = doc(db, "projects", id);
    await updateDoc(docRef, validation.data);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/edit/${id}`);
    return { success: true, message: "Projet mis à jour avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteProject(userId: string, id: string) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour supprimer un projet." };
  }
  try {
    const existingProject = await getProjectById(userId, id); 
    if (!existingProject) {
      return { success: false, message: "Opération non autorisée ou projet non trouvé." };
    }
    await deleteDoc(doc(db, "projects", id));
    revalidatePath("/admin/projects");
    return { success: true, message: "Projet supprimé avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

// Skill Actions
export async function getSkills(userId: string): Promise<Skill[]> {
  if (!userId) {
    console.error("getSkills: userId is required.");
    return [];
  }
  try {
    const q = query(
        collection(db, "skills"),
        where("userId", "==", userId)
        // Temporarily removed for diagnosis: orderBy("name")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  } catch (error) {
    console.error("Error fetching skills for userId:", userId, error);
     if (error instanceof Error && error.message.includes("index")) {
        console.error("INDEX_REQUIRED: Firestore query for skills requires a composite index. Please create it in your Firebase console. The error message should contain a direct link to create it: ", error.message);
    }
    return [];
  }
}

export async function addSkill(userId: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour ajouter une compétence." };
  }
  const rawData = Object.fromEntries(formData);
  const dataToValidate = { ...rawData, userId: userId }; 
  const validation = SkillSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return handleError(validation.error);
  }
  try {
    await addDoc(collection(db, "skills"), validation.data);
    revalidatePath("/admin/skills");
    return { success: true, message: "Compétence ajoutée avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSkill(userId: string, id: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour mettre à jour une compétence." };
  }
  const rawData = Object.fromEntries(formData);
  const dataToValidate = { ...rawData, userId: userId }; 
  const validation = SkillSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return handleError(validation.error);
  }
  try {
     const skillDocRef = doc(db, "skills", id);
     const skillDoc = await getDoc(skillDocRef);
     if (!skillDoc.exists() || skillDoc.data()?.userId !== userId) { 
       return { success: false, message: "Opération non autorisée ou compétence non trouvée." };
     }
    await updateDoc(skillDocRef, validation.data);
    revalidatePath("/admin/skills");
    return { success: true, message: "Compétence mise à jour avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSkill(userId: string, id: string) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour supprimer une compétence." };
  }
  try {
    const skillDocRef = doc(db, "skills", id);
    const skillDoc = await getDoc(skillDocRef);
    if (!skillDoc.exists() || skillDoc.data()?.userId !== userId) { 
      return { success: false, message: "Opération non autorisée ou compétence non trouvée." };
    }
    await deleteDoc(skillDocRef);
    revalidatePath("/admin/skills");
    return { success: true, message: "Compétence supprimée avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

// Testimonial Actions
export async function getTestimonials(userId: string): Promise<Testimonial[]> {
  if (!userId) {
    console.error("getTestimonials: userId is required.");
    return [];
  }
  try {
    const q = query(
      collection(db, "testimonials"),
      where("userId", "==", userId)
      // Temporarily removed for diagnosis: orderBy("name")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
  } catch (error) {
    console.error("Error fetching testimonials for userId:", userId, error);
    if (error instanceof Error && error.message.includes("index")) {
      console.error("INDEX_REQUIRED: Firestore query for testimonials requires a composite index. Please create it in your Firebase console. The error message should contain a direct link to create it: ", error.message);
    }
    return [];
  }
}

export async function getTestimonialById(userId: string, id: string): Promise<Testimonial | null> {
   if (!userId) {
    console.error("getTestimonialById: userId is required.");
    return null;
  }
  try {
    const docRef = doc(db, "testimonials", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const testimonial = { id: docSnap.id, ...docSnap.data() } as Testimonial;
      if (testimonial.userId === userId) {
        return testimonial;
      }
      console.warn(`Attempted to fetch testimonial ${id} not belonging to user ${userId}. Testimonial owner: ${testimonial.userId}`);
      return null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching testimonial by ID:", id, "for userId:", userId, error);
    return null;
  }
}

export async function addTestimonial(userId: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour ajouter un témoignage." };
  }
  const rawData = Object.fromEntries(formData);
  const dataToValidate = { ...rawData, userId: userId };
  const validation = TestimonialSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return handleError(validation.error);
  }
  try {
    await addDoc(collection(db, "testimonials"), validation.data);
    revalidatePath("/admin/testimonials");
    return { success: true, message: "Témoignage ajouté avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTestimonial(userId: string, id: string, formData: FormData) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour mettre à jour un témoignage." };
  }
  const rawData = Object.fromEntries(formData);
  const dataToValidate = { ...rawData, userId: userId };
  const validation = TestimonialSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return handleError(validation.error);
  }
  try {
    const existingTestimonial = await getTestimonialById(userId, id);
    if (!existingTestimonial) {
      return { success: false, message: "Opération non autorisée ou témoignage non trouvé." };
    }
    const docRef = doc(db, "testimonials", id);
    await updateDoc(docRef, validation.data);
    revalidatePath("/admin/testimonials");
    revalidatePath(`/admin/testimonials/edit/${id}`);
    return { success: true, message: "Témoignage mis à jour avec succès." };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTestimonial(userId: string, id: string) {
  if (!userId) {
    return { success: false, message: "L'identifiant de l'utilisateur est requis pour supprimer un témoignage." };
  }
  try {
    const existingTestimonial = await getTestimonialById(userId, id);
    if (!existingTestimonial) {
      return { success: false, message: "Opération non autorisée ou témoignage non trouvé." };
    }
    await deleteDoc(doc(db, "testimonials", id));
    revalidatePath("/admin/testimonials");
    return { success: true, message: "Témoignage supprimé avec succès." };
  } catch (error) {
    return handleError(error);
  }
}
