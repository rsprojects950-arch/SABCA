import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'SABCA Docs';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';

export const gitConfig = {
  user: 'rsprojects950-arch',
  repo: 'SABCA',
  branch: 'master',
};

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
