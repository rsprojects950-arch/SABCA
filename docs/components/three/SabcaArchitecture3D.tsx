'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Layers, ArrowRight, Pause, Play } from 'lucide-react';
import Link from 'next/link';

interface ArchNodeSpec {
  id: string;
  label: string;
  tier: 'Client Surfaces' | 'Auth & Logic' | 'Supabase Cloud';
  color: string;
  position: [number, number, number];
  summary: string;
  files: string[];
  docHref: string;
}

const ARCH_NODES: ArchNodeSpec[] = [
  {
    id: 'mobile-app',
    label: 'SABCA Mobile App',
    tier: 'Client Surfaces',
    color: '#e53935',
    position: [-3.4, 1.35, 1.1],
    summary:
      'Expo SDK 54 / React Native 0.81.5 app with 4 main tabs (Home/ID, SABCA Hub, Events, Services), English/Telugu i18n, and React Query caching.',
    files: [
      'sabca-app/app/_layout.tsx',
      'sabca-app/app/(tabs)/index.tsx',
      'sabca-app/app/(tabs)/_layout.tsx',
    ],
    docHref: '/docs/mobile-app/architecture',
  },
  {
    id: 'deep-links',
    label: 'iOS SceneDelegate & Biometrics',
    tier: 'Client Surfaces',
    color: '#f59e0b',
    position: [-3.4, -1.1, 1.4],
    summary:
      'Native iOS SceneDelegate forwards sabcaapp:// URLs to RCTLinkingManager; Expo Router cold-start URLs are guarded by authDeepLink.ts alongside Face ID / Touch ID SecureStore login.',
    files: [
      'sabca-app/ios/SceneDelegate.swift',
      'sabca-app/utils/authDeepLink.ts',
      'sabca-app/hooks/useBiometrics.ts',
    ],
    docHref: '/docs/mobile-app/deep-linking-and-password-reset',
  },
  {
    id: 'website',
    label: 'Public Web Portal',
    tier: 'Client Surfaces',
    color: '#3b82f6',
    position: [-3.1, 0.15, -1.5],
    summary:
      'Pure HTML5/CSS3/Vanilla JS static portal (css/style.css, js/script.js) hosting Contact Us feedback, Account Deletion visual guides, Privacy Policy, and Terms of Service.',
    files: ['website/index.html', 'website/delete.html', 'website/js/script.js'],
    docHref: '/docs/website/overview',
  },
  {
    id: 'auth',
    label: 'Supabase Auth & Recovery',
    tier: 'Auth & Logic',
    color: '#8b5cf6',
    position: [0, 1.25, 0.25],
    summary:
      'Session persistence via ExpoStorage (AsyncStorage), explicit deep-link recovery token parsing via parseAuthDeepLink(), and verify_login_by_phone RPC authentication.',
    files: [
      'sabca-app/lib/supabase.ts',
      'sabca-app/ctx/AuthContext.tsx',
      'sabca-app/app/(auth)/reset-password.tsx',
    ],
    docHref: '/docs/mobile-app/auth-and-biometrics',
  },
  {
    id: 'moderation',
    label: 'UGC Safety & Admin',
    tier: 'Auth & Logic',
    color: '#ec4899',
    position: [0, -1.25, 0.25],
    summary:
      'EULA & association usage terms, press-and-hold reporting (user_reports), instant member blocking (blocked_users + AsyncStorage cache via ModerationContext.tsx), and role-gated committee management.',
    files: [
      'sabca-app/ctx/ModerationContext.tsx',
      'sabca-app/supabase/migrations/046_ugc_user_reports_and_blocks.sql',
      'sabca-app/app/admin/users.tsx',
    ],
    docHref: '/docs/mobile-app/admin-and-moderation',
  },
  {
    id: 'postgres',
    label: 'PostgreSQL + RLS (52 Migrations)',
    tier: 'Supabase Cloud',
    color: '#10b981',
    position: [3.2, 1.2, -0.35],
    summary:
      'Row-Level Security protected schema spanning profiles, events, grievances, polls, transactions, hub posts, directory contacts, and security-definer RPCs.',
    files: [
      'sabca-app/supabase/migrations/001_create_government_orders.sql',
      'sabca-app/supabase/migrations/049_server_automation.sql',
      'sabca-app/supabase/migrations/050_performance_indices.sql',
    ],
    docHref: '/docs/backend/database-and-migrations',
  },
  {
    id: 'edge-functions',
    label: 'Deno Edge Functions',
    tier: 'Supabase Cloud',
    color: '#14b8a6',
    position: [3.3, -0.05, 1.3],
    summary:
      'Four Deno serverless endpoints handling admin-verified user cascades (delete-user) and automated Nodemailer SMTP email dispatches for grievance workflows.',
    files: [
      'sabca-app/supabase/functions/delete-user/index.ts',
      'sabca-app/supabase/functions/send-grievance-email/index.ts',
      'sabca-app/supabase/functions/send-status-email/index.ts',
    ],
    docHref: '/docs/backend/edge-functions',
  },
  {
    id: 'storage',
    label: 'Storage & Receipts',
    tier: 'Supabase Cloud',
    color: '#06b6d4',
    position: [3.1, -1.25, -1.3],
    summary:
      'Supabase Storage buckets (avatars, documents, events, news, government_orders, grievance-attachments) paired with offline HTML-to-PDF membership receipts.',
    files: [
      'sabca-app/lib/receiptGenerator.ts',
      'sabca-app/app/services/go-list.tsx',
      'sabca-app/app/member/edit-profile.tsx',
    ],
    docHref: '/docs/mobile-app/features-and-modules',
  },
];

const CONNECTIONS: [string, string][] = [
  ['mobile-app', 'deep-links'],
  ['mobile-app', 'auth'],
  ['mobile-app', 'moderation'],
  ['mobile-app', 'storage'],
  ['deep-links', 'auth'],
  ['website', 'mobile-app'],
  ['auth', 'postgres'],
  ['moderation', 'postgres'],
  ['postgres', 'edge-functions'],
  ['postgres', 'storage'],
];

export function SabcaArchitecture3D({ compact = false }: { compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resetCamRef = useRef<(() => void) | null>(null);
  const focusNodeRef = useRef<((nodeId: string) => void) | null>(null);
  const pausedRef = useRef<boolean>(false);

  const [selectedId, setSelectedId] = useState<string>('mobile-app');
  const [motionPaused, setMotionPaused] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const selectedNode =
    ARCH_NODES.find((node) => node.id === selectedId) ?? ARCH_NODES[0];

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      pausedRef.current = true;
      setMotionPaused(true);
    }
  }, []);

  const toggleMotion = () => {
    setMotionPaused((prev) => {
      const next = !prev;
      pausedRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let themeObserver: MutationObserver | null = null;
    let cleanupThree: (() => void) | null = null;

    async function initScene() {
      if (!container) return;
      try {
        const [THREE, { OrbitControls }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/controls/OrbitControls.js'),
        ]);

        if (cancelled) return;

        const width = container.clientWidth || 680;
        const height = container.clientHeight || (compact ? 340 : 420);

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        const defaultPos = new THREE.Vector3(0, 1.3, 8.6);
        camera.position.copy(defaultPos);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.minDistance = 4.5;
        controls.maxDistance = 14;
        controls.autoRotate = !pausedRef.current;
        controls.autoRotateSpeed = 0.5;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
        keyLight.position.set(5, 8, 6);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xe2e8f0, 0.65);
        rimLight.position.set(-6, -4, -5);
        scene.add(rimLight);

        const ringGeo = new THREE.TorusGeometry(4.4, 0.012, 8, 96);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x71717a,
          transparent: true,
          opacity: 0.2,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.25;
        scene.add(ringMesh);

        const gridHelper = new THREE.GridHelper(11, 18, 0x52525b, 0x3f3f46);
        gridHelper.position.y = -2.35;
        (gridHelper.material as any).transparent = true;
        (gridHelper.material as any).opacity = 0.16;
        scene.add(gridHelper);

        const updateTheme = () => {
          const isDark = document.documentElement.classList.contains('dark');
          ringMat.opacity = isDark ? 0.24 : 0.16;
          (gridHelper.material as any).opacity = isDark ? 0.2 : 0.12;
        };
        updateTheme();
        themeObserver = new MutationObserver(updateTheme);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });

        const nodeMeshes = new Map<string, any>();
        const nodeHalos = new Map<string, any>();
        const nodeGeo = new THREE.OctahedronGeometry(0.36, 1);
        const haloGeo = new THREE.TorusGeometry(0.5, 0.025, 12, 48);

        for (const spec of ARCH_NODES) {
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(spec.color),
            roughness: 0.28,
            metalness: 0.3,
            emissive: new THREE.Color(spec.color),
            emissiveIntensity: 0.2,
          });
          const mesh = new THREE.Mesh(nodeGeo, mat);
          mesh.position.set(...spec.position);
          mesh.userData = { nodeId: spec.id };
          scene.add(mesh);
          nodeMeshes.set(spec.id, mesh);

          const haloMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(spec.color),
            transparent: true,
            opacity: spec.id === 'mobile-app' ? 0.85 : 0.2,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.copy(mesh.position);
          scene.add(halo);
          nodeHalos.set(spec.id, halo);
        }

        const packetGeo = new THREE.SphereGeometry(0.065, 12, 12);
        const packets: {
          mesh: any;
          curve: any;
          speed: number;
          offset: number;
        }[] = [];
        const tubeDisposables: { geo: any; mat: any }[] = [];

        CONNECTIONS.forEach(([fromId, toId], idx) => {
          const from = ARCH_NODES.find((n) => n.id === fromId);
          const to = ARCH_NODES.find((n) => n.id === toId);
          if (!from || !to) return;

          const p1 = new THREE.Vector3(...from.position);
          const p2 = new THREE.Vector3(...to.position);
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          mid.y += idx % 2 === 0 ? 0.38 : -0.25;
          mid.z += idx % 3 === 0 ? 0.3 : -0.25;

          const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
          const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.018, 8, false);
          const tubeMat = new THREE.MeshBasicMaterial({
            color: 0xa1a1aa,
            transparent: true,
            opacity: 0.35,
          });
          const tube = new THREE.Mesh(tubeGeo, tubeMat);
          scene.add(tube);
          tubeDisposables.push({ geo: tubeGeo, mat: tubeMat });

          const packetMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(from.color),
          });
          const packet = new THREE.Mesh(packetGeo, packetMat);
          scene.add(packet);
          tubeDisposables.push({ geo: null, mat: packetMat });
          packets.push({
            mesh: packet,
            curve,
            speed: 0.16 + (idx % 4) * 0.03,
            offset: (idx * 0.17) % 1,
          });
        });

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let activeNodeId = 'mobile-app';

        const highlightNode = (targetId: string) => {
          activeNodeId = targetId;
          setSelectedId(targetId);
          nodeHalos.forEach((halo, id) => {
            const mat = halo.material;
            mat.opacity = id === targetId ? 0.95 : 0.18;
            halo.scale.setScalar(id === targetId ? 1.25 : 1.0);
          });
        };

        focusNodeRef.current = (id: string) => {
          controls.autoRotate = false;
          highlightNode(id);
          const targetMesh = nodeMeshes.get(id);
          if (targetMesh) {
            controls.target.copy(targetMesh.position);
          }
        };

        resetCamRef.current = () => {
          camera.position.copy(defaultPos);
          controls.target.set(0, 0, 0);
          controls.autoRotate = !pausedRef.current;
        };

        const onPointerDown = (event: PointerEvent) => {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);

          const hits = raycaster.intersectObjects(Array.from(nodeMeshes.values()));
          if (hits.length > 0) {
            const hitId = hits[0].object.userData?.nodeId;
            if (typeof hitId === 'string') {
              controls.autoRotate = false;
              highlightNode(hitId);
            }
          }
        };

        renderer.domElement.addEventListener('pointerdown', onPointerDown);

        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = Math.max(entry.contentRect.width, 280);
            const h = Math.max(entry.contentRect.height, 240);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        });
        resizeObserver.observe(container);

        let simTime = 0;
        let lastTs = performance.now();
        const animate = (now: number) => {
          if (cancelled) return;
          animationId = requestAnimationFrame(animate);
          const delta = Math.min((now - lastTs) / 1000, 0.1);
          lastTs = now;

          if (!pausedRef.current) {
            simTime += delta;
            controls.autoRotate = true;
          } else {
            controls.autoRotate = false;
          }

          nodeMeshes.forEach((mesh, id) => {
            mesh.rotation.y = simTime * 0.65;
            mesh.rotation.x = Math.sin(simTime * 0.5) * 0.2;
            const scale =
              id === activeNodeId
                ? 1.22 + (pausedRef.current ? 0 : Math.sin(simTime * 3) * 0.05)
                : 1.0;
            mesh.scale.setScalar(scale);
          });

          nodeHalos.forEach((halo) => {
            halo.lookAt(camera.position);
          });

          for (const p of packets) {
            const t = (simTime * p.speed + p.offset) % 1;
            p.curve.getPointAt(t, p.mesh.position);
          }

          controls.update();
          renderer.render(scene, camera);
        };
        animationId = requestAnimationFrame(animate);

        cleanupThree = () => {
          cancelAnimationFrame(animationId);
          renderer.domElement.removeEventListener('pointerdown', onPointerDown);
          controls.dispose();
          nodeGeo.dispose();
          haloGeo.dispose();
          ringGeo.dispose();
          ringMat.dispose();
          packetGeo.dispose();
          nodeMeshes.forEach((m) => m.material.dispose());
          nodeHalos.forEach((h) => h.material.dispose());
          tubeDisposables.forEach(({ geo, mat }) => {
            if (geo) geo.dispose();
            if (mat) mat.dispose();
          });
          renderer.dispose();
        };
      } catch (err) {
        if (!cancelled) {
          setWebglError(
            err instanceof Error ? err.message : 'WebGL unavailable in this browser'
          );
        }
      }
    }

    initScene();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (themeObserver) themeObserver.disconnect();
      if (cleanupThree) cleanupThree();
    };
  }, [compact]);

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border bg-fd-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-fd-foreground" />
          <span className="text-sm font-semibold">
            Interactive 3D System Topology
          </span>
          <span className="hidden text-xs text-fd-muted-foreground sm:inline">
            (Drag to orbit · Scroll to zoom · Click nodes or pills)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMotion}
            className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-2.5 py-1 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent"
          >
            {motionPaused ? (
              <>
                <Play className="size-3.5" />
                Play Motion
              </>
            ) : (
              <>
                <Pause className="size-3.5" />
                Pause Motion
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => resetCamRef.current?.()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-2.5 py-1 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent"
          >
            <RotateCcw className="size-3.5" />
            Reset Camera
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12">
        <div className="sabca-dot-grid relative lg:col-span-8">
          {webglError ? (
            <div className="flex h-[340px] flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm font-medium">3D WebGL preview unavailable</p>
              <p className="max-w-md text-xs text-fd-muted-foreground">
                {webglError}. Use the node pills on the right to inspect every SABCA component.
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              aria-label="SABCA 3D Architecture Graph"
              className={
                compact
                  ? 'h-[340px] w-full cursor-grab active:cursor-grabbing'
                  : 'h-[420px] w-full cursor-grab active:cursor-grabbing'
              }
            />
          )}
        </div>

        <div className="flex flex-col justify-between border-t border-fd-border bg-fd-muted/20 p-4 lg:col-span-4 lg:border-l lg:border-t-0">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ARCH_NODES.map((node) => {
                const active = node.id === selectedNode.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => focusNodeRef.current?.(node.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                        : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground'
                    }`}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    {node.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-fd-border bg-fd-background p-3.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fd-muted-foreground">
                  {selectedNode.tier}
                </span>
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: selectedNode.color }}
                />
              </div>
              <h3 className="text-base font-semibold">{selectedNode.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-fd-muted-foreground">
                {selectedNode.summary}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-fd-muted-foreground">
                  Key Source Paths
                </p>
                {selectedNode.files.map((filePath) => (
                  <div
                    key={filePath}
                    className="truncate rounded border border-fd-border bg-fd-muted/60 px-2 py-0.5 font-mono text-[11px] text-fd-foreground"
                  >
                    {filePath}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            href={selectedNode.docHref}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-fd-primary px-3 py-2 text-xs font-medium text-fd-primary-foreground transition hover:opacity-90"
          >
            Open Component Docs
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
