import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { PAYLOAD_URL, PAYLOAD_TENENT } from "astro:env/client";

// Helper schema for the transformed tag format (array of strings)
const tagSchema = z.string();

const sectionSchema = z.object({
  title: z.string(),
  subtitle: z.string().nullable(),
  content: z.string(), // Mapped from content_html
  primarybutton_label: z.string().nullable(),
  primarybutton_url: z.string().nullable(),
  secondarybutton_label: z.string().nullable(),
  secondarybutton_url: z.string().nullable(),
  primaryImage_url: z.string().nullable(),
  secondaryImage_url: z.string().nullable(),
});

const addressSchema = z.object({
  label: z.string().nullable(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

const emailSchema = z.object({
  email: z.string().email().nullable(),
  label: z.string().nullable(),
});

const contactNumberSchema = z.object({
  number: z.string(),
  label: z.string().nullable(),
});

const contactsCollection = defineCollection({
  loader: async () => {
    // Replace with your actual Payload CMS API endpoint for contacts
    const response = await fetch(
      `${PAYLOAD_URL}/api/contacts?depth=2&draft=false&locale=undefined&trash=false&where[tenant][equals]=${PAYLOAD_TENENT}`,
    );
    const data = await response.json();

    return data.docs.map((doc: any) => {
      const socials = doc.socials || {};

      return {
        id: doc.tenant.slug, // Maps tenant slug as the unique object key for getEntry lookups
        name: doc.name,
        emails: (doc.emails || []).map((e: any) => ({
          email: e.email,
          label: e.label,
        })),
        contactNumbers: (doc.contactNumbers || []).map((c: any) => ({
          number: c.number,
          label: c.label,
        })),
        addresses: (doc.addresses || []).map((a: any) => ({
          label: a.label,
          street: a.street,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          country: a.country,
        })),
        whatsapp: socials.whatsapp || null,
        linkedin: socials.linkedin || null,
        twitter: socials.twitter || null,
        instagram: socials.instagram || null,
        facebook: socials.facebok || null, // Resolves payload backend typo 'facebok' to standard 'facebook'
        youtube: socials.youtube || null,
        reddit: socials.reddit || null,
        discord: socials.discord || null,
        snapchat: socials.snapchat || null,
      };
    });
  },
  schema: z.object({
    name: z.string(),
    emails: z.array(emailSchema),
    contactNumbers: z.array(contactNumberSchema),
    addresses: z.array(addressSchema),
    whatsapp: z.string().nullable(),
    linkedin: z.string().nullable(),
    twitter: z.string().nullable(),
    instagram: z.string().nullable(),
    facebook: z.string().nullable(),
    youtube: z.string().nullable(),
    reddit: z.string().nullable(),
    discord: z.string().nullable(),
    snapchat: z.string().nullable(),
  }),
});

const pagesCollection = defineCollection({
  loader: async () => {
    // Replace with your actual Payload CMS API endpoint
    const response = await fetch(
      `${PAYLOAD_URL}/api/pages?depth=2&draft=false&locale=undefined&trash=false&where[tenant][equals]=${PAYLOAD_TENENT}`,
    );
    const data = await response.json();

    // Transform Payload's payload structure into your desired Astro schema
    return data.docs.map((doc: any) => {
      const transformedSections = doc.sections.map((section: any) => {
        const primaryBtn = section.primarybutton?.[0] || null;
        const secondaryBtn = section.secondarybutton?.[0] || null;
        const sectionImg = section["section-images"]?.[0] || null;

        return {
          title: section.title,
          subtitle: section.subtitle,
          content: section.content_html || "",
          primarybutton_label: primaryBtn ? primaryBtn.label : null,
          primarybutton_url: primaryBtn ? primaryBtn.url : null,
          secondarybutton_label: secondaryBtn ? secondaryBtn.label : null,
          secondarybutton_url: secondaryBtn ? secondaryBtn.url : null,
          primaryImage_url: sectionImg?.primaryImage?.url || null,
          secondaryImage_url: sectionImg?.secondaryImage?.url || null,
        };
      });

      return {
        id: doc.slug, // Astro 6 requires an 'id' at the root level; mapping slug here makes it your lookup key
        title: doc.title,
        seoDescription: doc.seoDescription,
        sections: transformedSections,
      };
    });
  },
  schema: z.object({
    title: z.string(),
    seoDescription: z.string(),
    sections: z.array(sectionSchema),
  }),
});

const postsCollection = defineCollection({
  // Use the loader API for remote data fetching
  loader: async () => {
    const response = await fetch(
      `${PAYLOAD_URL}/api/posts?depth=2&draft=false&trash=false&where[tenant][equals]=${PAYLOAD_TENENT}`,
    );
    const data = await response.json();

    // Map over Payload's 'docs' array to isolate and transform fields
    return data.docs.map((doc: any) => ({
      id: doc.id.toString(), // Astro requires collection item IDs to be strings
      title: doc.title,
      slug: doc.slug,
      status: doc.status,
      excerpt: doc.excerpt,
      // Flattening the featured image object into just its URL
      featuredImageUrl: doc.featuredImage?.url || null,
      // Mapping 'content_html' to the requested 'content' property
      content: doc.content_html,
      // Renaming to match requested 'seo-meta' naming convention
      seoMeta: doc.seoDescription,
      author: doc.author,
      // Transforming array of objects to an array of string names
      tags: doc.tags?.map((tag: any) => tag.name) || [],
    }));
  },
  // Type-safety for your transformed data structure
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    status: z.enum(["published", "draft"]), // Adjust based on your Payload setup
    excerpt: z.string().nullable(),
    featuredImageUrl: z.string().nullable(),
    content: z.string().nullable(),
    seoMeta: z.string().nullable(),
    author: z.number().nullable(),
    tags: z.array(tagSchema),
  }),
});

export const collections = {
  articles: postsCollection,
  pages: pagesCollection,
  contacts: contactsCollection,
};
