import Link from 'next/link';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <>
      <div className="sabca-scroll-progress" aria-hidden="true" />
      <DocsLayout
        tree={source.getPageTree()}
        {...baseOptions()}
        sidebar={{
          banner: (
            <Link
              href="/docs/releases/versioning"
              className="flex items-center gap-2.5 rounded-xl border border-fd-border bg-fd-card p-2.5 text-xs transition hover:border-fd-foreground/25 hover:bg-fd-accent/40"
            >
              <span className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-black/10 dark:ring-white/15">
                <img
                  src="/images/sabca-logo.png"
                  alt=""
                  width={24}
                  height={23}
                  className="size-full object-contain"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-fd-foreground">
                  SABCA Platform
                </span>
                <span className="block truncate font-mono text-[11px] text-fd-muted-foreground">
                  App v1.0.2 · Build 8
                </span>
              </span>
            </Link>
          ),
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
