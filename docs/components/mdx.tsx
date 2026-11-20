import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Files, Folder, File } from 'fumadocs-ui/components/files';
import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from 'fumadocs-ui/components/callout';
import { Cards, Card } from 'fumadocs-ui/components/card';
import type { MDXComponents } from 'mdx/types';
import { Mermaid } from './mermaid';
import { SabcaArchitecture3D } from './three/SabcaArchitecture3D';
import { MemberIdCard3D } from './three/MemberIdCard3D';
import { MigrationExplorer } from './MigrationExplorer';
import { VersionSyncMatrix } from './VersionSyncMatrix';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Files,
    Folder,
    File,
    Steps,
    Step,
    Tabs,
    Tab,
    Accordion,
    Accordions,
    Callout,
    Cards,
    Card,
    Mermaid,
    SabcaArchitecture3D,
    MemberIdCard3D,
    MigrationExplorer,
    VersionSyncMatrix,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
