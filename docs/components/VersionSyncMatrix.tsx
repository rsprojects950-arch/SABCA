'use client';

import { useState } from 'react';
import { Smartphone, Layers } from 'lucide-react';

interface VersionRow {
  file: string;
  keyOrField: string;
  platform: 'Cross-Platform' | 'iOS' | 'Android';
  currentVal: string;
  nextVal: string;
  notes: string;
}

const VERSION_ROWS: VersionRow[] = [
  {
    file: 'sabca-app/app.json',
    keyOrField: 'expo.version',
    platform: 'Cross-Platform',
    currentVal: '"1.0.2"',
    nextVal: '"1.0.3"',
    notes: 'Expo Config logical app version string read by prebuild.',
  },
  {
    file: 'sabca-app/package.json',
    keyOrField: 'version',
    platform: 'Cross-Platform',
    currentVal: '"1.0.2"',
    nextVal: '"1.0.3"',
    notes: 'npm / pnpm package version parity.',
  },
  {
    file: 'sabca-app/app.json',
    keyOrField: 'expo.ios.buildNumber',
    platform: 'iOS',
    currentVal: '"8"',
    nextVal: '"9"',
    notes: 'iOS App Store Connect binary build string; must strictly increment per upload.',
  },
  {
    file: 'sabca-app/ios/SABCA/Info.plist',
    keyOrField: 'CFBundleShortVersionString / CFBundleVersion',
    platform: 'iOS',
    currentVal: '1.0.2 / 8',
    nextVal: '1.0.3 / 9',
    notes: 'Hardcoded Info.plist strings (must stay synchronized with app.json & Xcode).',
  },
  {
    file: 'sabca-app/ios/SABCA.xcodeproj/project.pbxproj',
    keyOrField: 'MARKETING_VERSION / CURRENT_PROJECT_VERSION (Debug + Release)',
    platform: 'iOS',
    currentVal: '1.0.2 / 8',
    nextVal: '1.0.3 / 9',
    notes: 'Present in both Debug and Release build configuration blocks.',
  },
  {
    file: 'sabca-app/app.json',
    keyOrField: 'expo.android.versionCode',
    platform: 'Android',
    currentVal: '8',
    nextVal: '9',
    notes: 'Google Play monotonically increasing integer version code.',
  },
  {
    file: 'sabca-app/android/app/build.gradle',
    keyOrField: 'versionName / versionCode',
    platform: 'Android',
    currentVal: '"1.0.2" / 8',
    nextVal: '"1.0.3" / 9',
    notes: 'Native Gradle defaultConfig version values.',
  },
  {
    file: 'sabca-app/eas.json',
    keyOrField: 'build.production.autoIncrement',
    platform: 'Cross-Platform',
    currentVal: 'true',
    nextVal: 'true',
    notes: 'EAS Build CLI >= 16.32.0 remote auto-increment behavior for cloud builds.',
  },
];

export function VersionSyncMatrix() {
  const [targetState, setTargetState] = useState<'current' | 'next'>('current');

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border bg-fd-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-fd-foreground" />
          <span className="text-sm font-semibold">
            Mobile Release Version &amp; Build Parity Matrix
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-fd-border bg-fd-background p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTargetState('current')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              targetState === 'current'
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            Current Repo (1.0.2 / Build 8)
          </button>
          <button
            type="button"
            onClick={() => setTargetState('next')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              targetState === 'next'
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            Next Patch Template (1.0.3 / Build 9)
          </button>
        </div>
      </div>

      <div className="sabca-scroller overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="border-b border-fd-border bg-fd-muted text-[11px] uppercase tracking-wider text-fd-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">File</th>
              <th className="px-4 py-2.5 font-semibold">Platform</th>
              <th className="px-4 py-2.5 font-semibold">Setting</th>
              <th className="px-4 py-2.5 font-semibold">
                {targetState === 'current' ? 'Current Value' : 'Next Bump Target'}
              </th>
              <th className="px-4 py-2.5 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fd-border">
            {VERSION_ROWS.map((row) => (
              <tr
                key={`${row.file}-${row.keyOrField}`}
                className="transition-colors hover:bg-fd-muted/35"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-fd-foreground">
                  {row.file}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-muted/70 px-2 py-0.5 text-[11px] font-medium text-fd-foreground">
                    <Layers className="size-3 text-fd-muted-foreground" />
                    {row.platform}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-fd-muted-foreground">
                  {row.keyOrField}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold text-fd-foreground">
                  {targetState === 'current' ? row.currentVal : row.nextVal}
                </td>
                <td className="px-4 py-2.5 text-fd-muted-foreground">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
