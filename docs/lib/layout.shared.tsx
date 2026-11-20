import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow-xs ring-1 ring-black/10 dark:ring-white/15">
            <img
              src="/images/sabca-logo.png"
              alt="SABCA Logo"
              width={30}
              height={29}
              className="size-full object-contain"
            />
          </span>
          <span className="flex items-center gap-2">
            <span>{appName}</span>
            <span className="hidden rounded-full border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-[10px] font-medium text-fd-muted-foreground sm:inline-block">
              v1.0.2
            </span>
          </span>
        </span>
      ),
    },
    links: [
      {
        text: 'Overview',
        url: '/docs',
        active: 'url',
      },
      {
        text: 'Mobile App',
        url: '/docs/mobile-app/architecture',
        active: 'nested-url',
      },
      {
        text: 'Backend',
        url: '/docs/backend/database-and-migrations',
        active: 'nested-url',
      },
      {
        text: 'Website',
        url: '/docs/website/overview',
        active: 'nested-url',
      },
      {
        text: 'Releases',
        url: '/docs/releases/versioning',
        active: 'nested-url',
      },
      {
        text: 'Guidelines',
        url: '/docs/guidelines/apple-app-review-guidelines',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
