import { z } from "astro/zod";
import { PAYLOAD_URL } from "astro:env/client";

// Define strict types for the navigation and global settings
const navItemSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const siteDataSchema = z.object({
  name: z.string(),
  slug: z.string(),
  favicon_url: z.string().nullable(),
  favicon32_url: z.string().nullable(),
  faviconApple_url: z.string().nullable(),
  faviconSVG_url: z.string().nullable(),
  logo_url: z.string().nullable(),
  logoDark_url: z.string().nullable(),
  logoAlt_url: z.string().nullable(),
  logoAltDark_url: z.string().nullable(),
  defaultTitle: z.string(),
  defaultDescription: z.string(),
  gaId: z.string().nullable(),
  navigation: z.array(navItemSchema),
});

export type SiteData = z.infer<typeof siteDataSchema>;

let cachedSiteData: SiteData | null = null;

export async function getSiteData(): Promise<SiteData> {
  // Return cached version if already fetched during this build context
  if (cachedSiteData) return cachedSiteData;

  // Replace with your actual Payload CMS globals/globals endpoint
  const response = await fetch(
    `${PAYLOAD_URL}/api/tenants/2?depth=1&draft=false&locale=undefined&trash=false`,
  );
  const rawData = await response.json();

  const transformedData: SiteData = {
    name: rawData.name,
    slug: rawData.slug,
    favicon_url: rawData.favicon?.url || null,
    favicon32_url: rawData["favicon-32x"]?.url || null,
    faviconApple_url: rawData["favicon-apple"]?.url || null,
    faviconSVG_url: rawData["favicon-svg"]?.url || null,
    logo_url: rawData.logo?.url || null,
    logoDark_url: rawData["logo-dark"]?.url || null,
    logoAlt_url: rawData["logo-alt"]?.url || null,
    logoAltDark_url: rawData["logo-alt-dark"]?.url || null,
    defaultTitle: rawData.defaultTitle,
    defaultDescription: rawData.defaultDescription,
    gaId: rawData.gaId || null,
    navigation: (rawData.navigation || []).map((item: any) => ({
      label: item.label,
      url: item.url,
    })),
  };

  // Validate structure against the Zod schema
  cachedSiteData = siteDataSchema.parse(transformedData);
  return cachedSiteData;
}
