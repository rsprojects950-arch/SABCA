import Link from 'next/link';
import {
  Smartphone,
  Database,
  Globe,
  Rocket,
  Scale,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SabcaArchitecture3D } from '@/components/three/SabcaArchitecture3D';

const SECTION_CARDS = [
  {
    title: 'Mobile App Architecture',
    description:
      'Expo Router layouts, AuthContext recovery flow, Face ID / Touch ID SecureStore integration, and iOS SceneDelegate deep linking.',
    href: '/docs/mobile-app/architecture',
    icon: Smartphone,
  },
  {
    title: 'Supabase & 52 Migrations',
    description:
      'PostgreSQL schema, RLS recursion safeguards, security-definer RPCs, pg_cron automation, and 4 Deno Edge Functions.',
    href: '/docs/backend/database-and-migrations',
    icon: Database,
  },
  {
    title: 'Unified Web Portal',
    description:
      'Static HTML/CSS/JS portal in website/ hosting association information, Privacy Policy, Terms of Service, and Account Deletion.',
    href: '/docs/website/overview',
    icon: Globe,
  },
  {
    title: 'Versioning & Releases',
    description:
      'Synchronized version and build parity matrix (1.0.2 / Build 8), EAS production tracks, and store submission workflows.',
    href: '/docs/releases/versioning',
    icon: Rocket,
  },
  {
    title: 'Store Guidelines',
    description:
      'Full Apple App Review Guidelines reference and Google Play Store policy checklist placeholder for release compliance.',
    href: '/docs/guidelines/apple-app-review-guidelines',
    icon: Scale,
  },
];

const STATS = [
  { value: '52', label: 'SQL Migrations' },
  { value: '4', label: 'Deno Edge Functions' },
  { value: '22', label: 'Documentation Pages' },
  { value: '72 / 72', label: 'Passing Mobile Tests' },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 lg:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-fd-border bg-fd-card p-6 shadow-xs sm:p-10">
        <div
          aria-hidden="true"
          className="sabca-dot-grid pointer-events-none absolute inset-0 opacity-75"
        />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-background px-3 py-1 text-xs font-medium text-fd-muted-foreground">
              <ShieldCheck className="size-3.5 text-fd-foreground" />
              <span>SABCA Engineering Portal · App v1.0.2 (Build 8)</span>
            </div>

            <div className="flex items-start gap-4 sm:items-center sm:gap-5">
              <div className="inline-flex size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/10 dark:ring-white/15">
                <img
                  src="/images/sabca-logo.png"
                  alt="SABCA Official Emblem"
                  width={76}
                  height={73}
                  fetchPriority="high"
                  className="size-full object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-fd-foreground sm:text-5xl">
                SABCA Developer Documentation
              </h1>
            </div>

            <p className="text-base leading-relaxed text-fd-muted-foreground sm:text-lg">
              Architectural blueprints, 52 SQL migration references, interactive 3D
              system topology views, and release runbooks for the{' '}
              <code className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-sm text-fd-foreground">
                sabca-app/
              </code>{' '}
              mobile client and{' '}
              <code className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-sm text-fd-foreground">
                website/
              </code>{' '}
              public portal.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-4 py-2.5 text-sm font-semibold text-fd-primary-foreground shadow-xs transition hover:opacity-90"
              >
                <BookOpen className="size-4" />
                Browse Documentation
              </Link>
              <Link
                href="/docs/guidelines/apple-app-review-guidelines"
                className="inline-flex items-center gap-2 rounded-xl border border-fd-border bg-fd-background px-4 py-2.5 text-sm font-semibold text-fd-foreground transition hover:bg-fd-accent"
              >
                Store Guidelines
                <Scale className="size-4" />
              </Link>
              <Link
                href="/docs/releases/versioning"
                className="inline-flex items-center gap-2 rounded-xl border border-fd-border bg-fd-background px-4 py-2.5 text-sm font-semibold text-fd-foreground transition hover:bg-fd-accent"
              >
                Version Matrix
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-64">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-fd-border bg-fd-background/90 p-3.5"
              >
                <div className="font-mono text-xl font-bold tracking-tight text-fd-foreground">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-fd-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Interactive Architecture Visualization">
        <SabcaArchitecture3D />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col justify-between rounded-2xl border border-fd-border bg-fd-card p-5 transition duration-200 hover:border-fd-foreground/30 hover:shadow-sm motion-safe:hover:-translate-y-0.5"
            >
              <div>
                <div className="mb-3 inline-flex rounded-xl border border-fd-border bg-fd-muted/60 p-2.5 text-fd-foreground">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-base font-semibold tracking-tight text-fd-foreground">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-fd-muted-foreground">
                  {card.description}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-fd-foreground">
                Read guide
                <ArrowRight className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-fd-border pt-6 text-xs text-fd-muted-foreground">
        <div className="flex items-center gap-3">
          <img
            src="/images/infraxpert-logo.png"
            alt="InfraXpert"
            width={112}
            height={25}
            loading="lazy"
            className="h-6 w-auto rounded bg-white px-2 py-0.5 object-contain ring-1 ring-black/10 dark:ring-white/15"
          />
          <span>Powered by InfraXpert · Designed &amp; Developed by KodeSpark</span>
        </div>
        <div className="font-mono text-[11px]">
          SABCA Ecosystem · App v1.0.2 (Build 8)
        </div>
      </footer>
    </main>
  );
}
