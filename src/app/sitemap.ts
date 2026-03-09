import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app';
  const lastModified = new Date();

  const staticPages = [
    '',
    '/features',
    '/search',
    '/track',
    '/leaderboard',
    '/prediction',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticPages];
}
