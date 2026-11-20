'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { GitBranch, Maximize2, Minimize2 } from 'lucide-react';

interface MermaidProps {
  chart: string;
  caption?: string;
}

function useHtmlDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

let renderCounter = 0;

export function Mermaid({ chart, caption }: MermaidProps) {
  const rawId = useId();
  const isDark = useHtmlDarkMode();
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [actualSize, setActualSize] = useState(false);
  const instanceId = useRef<string | null>(null);

  if (!instanceId.current) {
    renderCounter += 1;
    instanceId.current = `sabca-mmd-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}-${renderCounter}`;
  }

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          fontFamily: 'inherit',
          themeVariables: isDark
            ? {
                darkMode: true,
                background: '#141417',
                primaryColor: '#1e1e24',
                primaryBorderColor: '#52525b',
                primaryTextColor: '#f4f4f5',
                secondaryColor: '#27272a',
                secondaryBorderColor: '#52525b',
                secondaryTextColor: '#f4f4f5',
                tertiaryColor: '#111114',
                lineColor: '#a1a1aa',
                textColor: '#f4f4f5',
                mainBkg: '#18181b',
                nodeBorder: '#52525b',
                clusterBkg: '#111114',
                clusterBorder: '#3f3f46',
                actorBkg: '#18181b',
                actorBorder: '#71717a',
                actorTextColor: '#f4f4f5',
                signalColor: '#e4e4e7',
                signalTextColor: '#f4f4f5',
                noteBkgColor: '#27272a',
                noteTextColor: '#f4f4f5',
              }
            : {
                darkMode: false,
                background: '#ffffff',
                primaryColor: '#f4f4f5',
                primaryBorderColor: '#a1a1aa',
                primaryTextColor: '#18181b',
                secondaryColor: '#ffffff',
                secondaryBorderColor: '#d4d4d8',
                secondaryTextColor: '#18181b',
                tertiaryColor: '#fafafa',
                lineColor: '#52525b',
                textColor: '#18181b',
                mainBkg: '#ffffff',
                nodeBorder: '#a1a1aa',
                clusterBkg: '#f4f4f5',
                clusterBorder: '#d4d4d8',
                actorBkg: '#ffffff',
                actorBorder: '#71717a',
                actorTextColor: '#18181b',
                signalColor: '#27272a',
                signalTextColor: '#18181b',
                noteBkgColor: '#f4f4f5',
                noteTextColor: '#18181b',
              },
        });

        const uniqueId = `${instanceId.current}-${isDark ? 'dark' : 'light'}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render Mermaid diagram');
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, isDark]);

  if (error) {
    return (
      <figure className="my-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="mb-2 text-xs font-medium text-red-500">
          Mermaid render error: {error}
        </p>
        <pre className="overflow-x-auto text-xs text-fd-muted-foreground">{chart}</pre>
      </figure>
    );
  }

  return (
    <figure className="my-6 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-fd-border bg-fd-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-fd-foreground">
          <GitBranch className="size-3.5 text-fd-muted-foreground" />
          <span>System Diagram</span>
        </div>
        <button
          type="button"
          onClick={() => setActualSize((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-2.5 py-1 text-[11px] font-medium text-fd-foreground transition hover:bg-fd-accent"
        >
          {actualSize ? (
            <>
              <Minimize2 className="size-3" />
              Fit Width
            </>
          ) : (
            <>
              <Maximize2 className="size-3" />
              100% Scale
            </>
          )}
        </button>
      </div>

      <div className="sabca-dot-grid sabca-scroller sabca-mermaid-container flex min-h-[190px] items-center justify-center overflow-x-auto p-4 sm:p-6">
        {svg ? (
          <div
            className={
              actualSize
                ? 'w-max [&_svg]:mx-auto [&_svg]:!max-w-none'
                : 'w-full [&_svg]:mx-auto [&_svg]:max-w-full'
            }
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-fd-muted-foreground">
            Rendering diagram...
          </div>
        )}
      </div>

      {caption ? (
        <figcaption className="border-t border-fd-border bg-fd-muted/30 px-4 py-2 text-center text-xs text-fd-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
