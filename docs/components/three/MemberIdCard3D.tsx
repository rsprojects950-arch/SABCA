'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck, ShieldAlert, Pause, Play } from 'lucide-react';

type CardPreviewMode = 'verified' | 'pending';

function createCardCanvas(
  side: 'front' | 'back',
  mode: CardPreviewMode,
  logoImage?: HTMLImageElement | null
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 646;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const isVerified = mode === 'verified';

  const grad = ctx.createLinearGradient(0, 0, 1024, 646);
  if (side === 'front') {
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.55, '#131b2b');
    grad.addColorStop(1, '#1e293b');
  } else {
    grad.addColorStop(0, '#0b0f19');
    grad.addColorStop(1, '#161f30');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 646);

  // Clean metallic top band
  ctx.fillStyle = '#e53935';
  ctx.fillRect(0, 0, 1024, 12);

  if (side === 'front') {
    // Official SABCA logo tile in top-left
    if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(56, 42, 86, 82, 12);
      ctx.fill();
      ctx.drawImage(logoImage, 62, 47, 74, 72);
    }

    const headerX = logoImage && logoImage.complete && logoImage.naturalWidth > 0 ? 162 : 56;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.fillText('SABCA', headerX, 78);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 19px system-ui, -apple-system, sans-serif';
    ctx.fillText('State A Class Builders & Contractors Association', headerX, 110);

    // Status pill
    ctx.fillStyle = isVerified ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)';
    ctx.beginPath();
    ctx.roundRect(720, 48, 248, 44, 10);
    ctx.fill();
    ctx.strokeStyle = isVerified ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isVerified ? '#34d399' : '#fbbf24';
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
    ctx.fillText(isVerified ? 'LIFE MEMBER' : 'ID : PENDING', 754, 77);

    // Photo frame
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(56, 178, 180, 210);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 178, 180, 210);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('MEMBER', 108, 286);
    ctx.fillText('PHOTO', 114, 312);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.fillText(isVerified ? 'R. Venkateswara Rao' : 'K. Srinivasulu', 274, 212);

    if (isVerified) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('SRI LAKSHMI CONSTRUCTIONS', 274, 256);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 17px system-ui, -apple-system, sans-serif';
      ctx.fillText('LOCATION', 274, 312);
      ctx.fillText('CONTACT & BLOOD GROUP', 540, 312);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('Guntur', 274, 344);
      ctx.fillText('9876543210 : Blood Group : O+', 540, 344);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 17px system-ui, -apple-system, sans-serif';
      ctx.fillText('idLine (formatIdCardFields)', 56, 488);
      ctx.fillText('EMAIL', 56, 560);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('ID : SABCA-GMCA-LM-1001 : LIFE TIME', 56, 524);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '500 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('member@sabca.co.in', 56, 592);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('ID : PENDING', 274, 260);

      ctx.fillStyle = '#fde68a';
      ctx.font = '600 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('No ": NONE" suffix & zero hardcoded fallback data', 274, 310);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 19px system-ui, -apple-system, sans-serif';
      ctx.fillText('companyName: null  |  location: null  (omitted cleanly)', 274, 354);
      ctx.fillText('contactLine: "8790862969"  (empty blood_group omitted)', 274, 388);
      ctx.fillText('email: fallback to signed-in userEmail when profile.email unset', 56, 535);
    }
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('SABCA MEMBER PASS (QR ACCESS)', 56, 86);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(56, 148, 260, 260);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if ((r + c * 2) % 3 === 0 || (r < 3 && c < 3) || (r > 5 && c < 3) || (r < 3 && c > 5)) {
          ctx.fillRect(76 + c * 24, 168 + r * 24, 18, 18);
        }
      }
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 21px system-ui, -apple-system, sans-serif';
    ctx.fillText('Route: /member/qr-access', 356, 188);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 19px monospace';
    ctx.fillText(isVerified ? 'ID: SABCA-GMCA-LM-1001' : 'ID: PENDING', 356, 236);
    ctx.fillText('Status: Active   |   SIG: signQRCode(mid, uid, status)', 356, 274);
    ctx.font = '500 19px system-ui, -apple-system, sans-serif';
    ctx.fillText('Formatter: sabca-app/utils/idCardFormatter.ts', 356, 336);
    ctx.fillText('PDF Safety: escapeHtml() guards HTML interpolation', 356, 372);
  }

  return canvas;
}

export function MemberIdCard3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRotationY = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);

  const [mode, setMode] = useState<CardPreviewMode>('verified');
  const [flipped, setFlipped] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      pausedRef.current = true;
      setMotionPaused(true);
    }
  }, []);

  useEffect(() => {
    targetRotationY.current = flipped ? Math.PI : 0;
  }, [flipped]);

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
    let cleanupThree: (() => void) | null = null;

    async function initCard() {
      if (!container) return;
      try {
        const [THREE, { OrbitControls }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/controls/OrbitControls.js'),
        ]);
        if (cancelled) return;

        const width = container.clientWidth || 640;
        const height = container.clientHeight || 340;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
        camera.position.set(0, 0.2, 6.2);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 3.8;
        controls.maxDistance = 9.5;

        scene.add(new THREE.AmbientLight(0xffffff, 1.15));
        const key = new THREE.DirectionalLight(0xffffff, 1.3);
        key.position.set(3, 5, 6);
        scene.add(key);

        const cardGroup = new THREE.Group();
        scene.add(cardGroup);

        const coreGeo = new THREE.BoxGeometry(3.8, 2.4, 0.06);
        const edgeMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.7,
          roughness: 0.25,
        });

        const frontCanvas = createCardCanvas('front', mode);
        const frontTex = new THREE.CanvasTexture(frontCanvas);
        frontTex.colorSpace = THREE.SRGBColorSpace;
        const backTex = new THREE.CanvasTexture(createCardCanvas('back', mode));
        backTex.colorSpace = THREE.SRGBColorSpace;

        const frontMat = new THREE.MeshStandardMaterial({
          map: frontTex,
          roughness: 0.35,
          metalness: 0.15,
        });
        const backMat = new THREE.MeshStandardMaterial({
          map: backTex,
          roughness: 0.35,
          metalness: 0.15,
        });

        // Paint official SABCA logo onto the front card texture once loaded
        const logoImg = new Image();
        logoImg.src = '/images/sabca-logo.png';
        logoImg.onload = () => {
          if (cancelled) return;
          const updated = createCardCanvas('front', mode, logoImg);
          const ctx = frontCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
            ctx.drawImage(updated, 0, 0);
            frontTex.needsUpdate = true;
          }
        };

        const cardMesh = new THREE.Mesh(coreGeo, [
          edgeMat,
          edgeMat,
          edgeMat,
          edgeMat,
          frontMat,
          backMat,
        ]);
        cardGroup.add(cardMesh);

        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = Math.max(entry.contentRect.width, 260);
            const h = Math.max(entry.contentRect.height, 220);
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
          }
          cardGroup.rotation.y += (targetRotationY.current - cardGroup.rotation.y) * 0.12;
          cardGroup.position.y = pausedRef.current ? 0 : Math.sin(simTime * 1.4) * 0.04;
          controls.update();
          renderer.render(scene, camera);
        };
        animationId = requestAnimationFrame(animate);

        cleanupThree = () => {
          cancelAnimationFrame(animationId);
          controls.dispose();
          coreGeo.dispose();
          edgeMat.dispose();
          frontMat.dispose();
          backMat.dispose();
          frontTex.dispose();
          backTex.dispose();
          renderer.dispose();
        };
      } catch (err) {
        if (!cancelled) {
          setWebglError(
            err instanceof Error ? err.message : 'WebGL unavailable for 3D ID preview'
          );
        }
      }
    }

    initCard();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (cleanupThree) cleanupThree();
    };
  }, [mode]);

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border bg-fd-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('verified')}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              mode === 'verified'
                ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            <ShieldCheck className="size-3.5" />
            Verified Paid Member
          </button>
          <button
            type="button"
            onClick={() => setMode('pending')}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              mode === 'pending'
                ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:text-fd-foreground'
            }`}
          >
            <ShieldAlert className="size-3.5" />
            Pending Member (Option 1)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMotion}
            className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-2.5 py-1.5 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent"
          >
            {motionPaused ? (
              <>
                <Play className="size-3.5" />
                Play Float
              </>
            ) : (
              <>
                <Pause className="size-3.5" />
                Pause Float
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFlipped((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-background px-3 py-1.5 text-xs font-medium text-fd-foreground transition hover:bg-fd-accent"
          >
            <RefreshCw className="size-3.5" />
            Flip Card ({flipped ? 'Back' : 'Front'})
          </button>
        </div>
      </div>

      {webglError ? (
        <div className="p-6 text-sm text-fd-muted-foreground">
          WebGL 3D ID Card preview unavailable ({webglError}). Active state:{' '}
          <strong>{mode}</strong>.
        </div>
      ) : (
        <div
          ref={containerRef}
          aria-label="Interactive 3D SABCA Member ID Card"
          className="sabca-dot-grid h-[340px] w-full cursor-grab active:cursor-grabbing"
        />
      )}
    </div>
  );
}
