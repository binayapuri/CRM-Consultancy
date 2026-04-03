import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Lightweight WebGL layer: floating “paper plane” + soft particles behind the hero photo.
 * Disabled when prefers-reduced-motion is on (parent passes reducedMotion).
 */
export function HeroThreeScene({ reducedMotion }: { reducedMotion: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const mount = mountRef.current;
    if (!mount) return;

    let frame = 0;
    let destroyed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.2, 6.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xaaccff, 0.45);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xc1a376, 1.1);
    key.position.set(5, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x4a7ab8, 0.35);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    function buildPlane(): THREE.Group {
      const g = new THREE.Group();
      const gold = new THREE.MeshStandardMaterial({
        color: 0xd4b896,
        metalness: 0.35,
        roughness: 0.42,
        emissive: 0x2a1810,
        emissiveIntensity: 0.25,
      });
      const blue = new THREE.MeshStandardMaterial({
        color: 0x5b8fd4,
        metalness: 0.4,
        roughness: 0.38,
        emissive: 0x0a1528,
        emissiveIntensity: 0.15,
      });

      const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 1.15), gold);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.035, 0.42), gold);
      wing.position.set(0, 0, 0.08);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.14), blue);
      tail.position.set(0, 0.18, -0.48);

      g.add(fuselage, wing, tail);
      g.rotation.set(0.15, -0.4, 0.08);
      return g;
    }

    const plane = buildPlane();
    scene.add(plane);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 120;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0x9ec5ff,
        size: 0.055,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
        depthWrite: false,
      })
    );
    scene.add(stars);

    const ringGeo = new THREE.TorusGeometry(2.8, 0.008, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc1a376,
      transparent: true,
      opacity: 0.22,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    ring.position.z = -1.5;
    scene.add(ring);

    const setSize = () => {
      if (!mount || destroyed) return;
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(mount);

    let t = 0;
    const animate = () => {
      if (destroyed) return;
      frame = requestAnimationFrame(animate);
      t += 0.014;

      plane.position.x = Math.sin(t * 0.42) * 2.4;
      plane.position.y = Math.cos(t * 0.38) * 0.55 + Math.sin(t * 0.9) * 0.12;
      plane.position.z = Math.sin(t * 0.25) * 0.35;
      plane.rotation.z = Math.sin(t * 0.55) * 0.4;
      plane.rotation.y = Math.sin(t * 0.28) * 0.5 + t * 0.12;
      plane.rotation.x = Math.sin(t * 0.33) * 0.12;

      stars.rotation.y = t * 0.018;
      stars.rotation.x = Math.sin(t * 0.08) * 0.05;

      ring.rotation.z = t * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else (m as THREE.Material | undefined)?.dispose();
        }
      });
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <div ref={mountRef} className="absolute inset-0 z-[1] overflow-hidden rounded-[inherit]" aria-hidden />;
}
