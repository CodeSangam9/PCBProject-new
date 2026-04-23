import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCBLayout, Net } from '../types';
import { Loader2, Grid3X3, Layers, Monitor, Activity } from 'lucide-react';

interface PCBViewerProps {
  layout: PCBLayout;
  netlist?: Net[];
  viewMode: '3d' | '2d' | 'schematic';
  highlightTerm?: string;
}

export default function PCBViewer({ layout, netlist, viewMode, highlightTerm }: PCBViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // 3D Rendering Logic
  useEffect(() => {
    if (viewMode !== '3d' || !containerRef.current) return;
    setLoading(true);

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe2e8f0); // Lighter neutral background for better understanding

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(15, 15, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setClearColor(0x000000, 0); 
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Advanced Studio Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // Enhanced overall illumination
    
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2); // DirectionalLight with shadow casting for primary lighting
    dLight.position.set(20, 40, 20);
    dLight.castShadow = true;
    dLight.shadow.mapSize.width = 2048;
    dLight.shadow.mapSize.height = 2048;
    scene.add(dLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.6); // PointLight for fill lighting
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    // Board
    const scale = 0.06;
    const width = layout.boardSize?.width || 100;
    const height = layout.boardSize?.height || 100;
    const bW = width * scale;
    const bH = height * scale;
    
    // Realistic Dark Green PCB Substrate
    const boardGeo = new THREE.BoxGeometry(bW, 0.15, bH);
    
    // Create a canvas texture for the fiberglass/FR4 look
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const boardTex = new THREE.CanvasTexture(canvas);
    boardTex.wrapS = THREE.RepeatWrapping;
    boardTex.wrapT = THREE.RepeatWrapping;
    boardTex.repeat.set(2, 2);

    const boardMat = new THREE.MeshStandardMaterial({ 
      map: boardTex,
      roughness: 0.15, // Shiny lacquer look
      metalness: 0.2, // Subtle metallic flake in substrate
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.receiveShadow = true;
    scene.add(board);

    // Silkscreen Helper (Add text markers on the board)
    const addSilkscreen = (text: string, x: number, z: number, fontsize: number = 32, opacity: number = 0.8) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontsize}px "sans-serif"`;
      ctx.textAlign = 'center';
      ctx.fillText(text, 128, 64);
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity });
      const spriteGeo = new THREE.PlaneGeometry(1.6, 0.8);
      const sprite = new THREE.Mesh(spriteGeo, spriteMat);
      sprite.rotation.x = -Math.PI / 2;
      sprite.position.set(x, 0.081, z);
      scene.add(sprite);
    };

    // Grid Overlay (Technical Dark Grid for light theme)
    const grid = new THREE.GridHelper(20, 40, 0x94a3b8, 0xe2e8f0);
    grid.position.y = -0.16;
    scene.add(grid);

    // Color generation for different signals
    const getSignalColor = (netName: string) => {
      let hash = 0;
      for (let i = 0; i < netName.length; i++) {
        hash = netName.charCodeAt(i) + ((hash << 5) - hash);
      }
      return new THREE.Color(`hsl(${Math.abs(hash) % 360}, 70%, 50%)`);
    };

    // Copper Traces (Enhanced 3D)
    (layout.traces || []).forEach(trace => {
      if (trace.points.length < 2) return;
      
      const signalBaseColor = trace.netName ? getSignalColor(trace.netName) : new THREE.Color(0x6366f1);
      
      const points = trace.points.map(p => new THREE.Vector3((p.x * scale) - (bW / 2), 0.08, (p.y * scale) - (bH / 2)));
      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
      const traceGeo = new THREE.TubeGeometry(curve, points.length * 2, 0.012, 8, false);
      const traceMat = new THREE.MeshStandardMaterial({ 
        color: 0xE5E7EB, // Tinned Copper / Silver look
        metalness: 1.0, 
        roughness: 0.1,
        emissive: signalBaseColor,
        emissiveIntensity: 0.5, // Emissive signal color
      });
      const traceMesh = new THREE.Mesh(traceGeo, traceMat);
      traceMesh.castShadow = true;
      scene.add(traceMesh);

      // Name the signal near the middle of the trace
      if (trace.netName) {
        const midPoint = points[Math.floor(points.length / 2)];
        addSilkscreen(trace.netName, midPoint.x, midPoint.z - 0.2, 48, 0.5);
      }

      // Add Vias at start and end
      [points[0], points[points.length - 1]].forEach(p => {
        const viaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 16);
        const viaMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 1, roughness: 0.1 });
        const via = new THREE.Mesh(viaGeo, viaMat);
        via.position.copy(p);
        via.position.y = 0;
        scene.add(via);
      });
    });

    // Components
    (layout.components || []).forEach((comp) => {
      const isHighlighted = highlightTerm && (
        comp.id.toLowerCase().includes(highlightTerm.toLowerCase())
      );

      const type = comp.id.charAt(0).toUpperCase();
      let cW = 0.6;
      let cH = 0.6;
      let cD = 0.3;
      let color = 0x222222;
      let geometry: THREE.BufferGeometry = new THREE.BoxGeometry(cW, cD, cH);
      let axial = false;

      const group = new THREE.Group();

      switch (type) {
        case 'U': // IC
          cW = 2.0; cH = 1.2; cD = 0.4;
          color = 0x111111;
          geometry = new THREE.BoxGeometry(cW, cD, cH);
          const body = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
          
          // Add notch
          const notchGeo = new THREE.BoxGeometry(0.1, 0.1, 0.2);
          const notch = new THREE.Mesh(notchGeo, new THREE.MeshStandardMaterial({ color: 0x050505 }));
          notch.position.set(-cW/2 + 0.05, cD/2 - 0.05, 0);
          body.add(notch);

          // Add legs
          for(let i=0; i<4; i++) {
             const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.05);
             const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
             const l1 = new THREE.Mesh(legGeo, legMat);
             l1.position.set(-cW/2 + (i*0.5) + 0.25, -0.2, cH/2);
             body.add(l1);
             const l2 = new THREE.Mesh(legGeo, legMat);
             l2.position.set(-cW/2 + (i*0.5) + 0.25, -0.2, -cH/2);
             body.add(l2);
          }
          group.add(body);
          break;
        case 'R': // Resistor
          cW = 1.2; cH = 0.3; cD = 0.3;
          color = 0x3b82f6;
          geometry = new THREE.CylinderGeometry(cH/2, cH/2, cW, 24);
          const rBody = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
          rBody.rotation.z = Math.PI / 2;
          
          // Add bands
          [0.2, 0, -0.2].forEach((off, i) => {
            const bandGeo = new THREE.CylinderGeometry(cH/2 + 0.01, cH/2 + 0.01, 0.1, 24);
            const bandMat = new THREE.MeshStandardMaterial({ color: [0x8b4513, 0xff0000, 0x000000][i] });
            const band = new THREE.Mesh(bandGeo, bandMat);
            band.position.y = off;
            rBody.add(band);
          });
          group.add(rBody);
          axial = true;
          break;
        case 'C': // Cap
          cW = 0.8; cH = 0.8; cD = 1.2;
          color = 0x1a1a1a;
          geometry = new THREE.CylinderGeometry(cW/2, cW/2, cD, 32);
          const cBody = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
          
          // White stripe
          const stripeGeo = new THREE.CylinderGeometry(cW/2 + 0.01, cW/2 + 0.01, cD, 32, 1, false, 0, Math.PI / 4);
          const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
          cBody.add(stripe);
          group.add(cBody);
          axial = true;
          break;
        default:
          group.add(new THREE.Mesh(new THREE.BoxGeometry(cW, cD, cH), new THREE.MeshStandardMaterial({ color, roughness: 0.6 })));
      }

      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (isHighlighted) {
            (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x2563eb);
            (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
          }
        }
      });

      // Add metallic pads for all components
      const padGeo = new THREE.BoxGeometry(axial ? 0.3 : cW * 0.2, 0.01, axial ? 0.3 : cH * 0.3);
      const padMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 1, roughness: 0.1 }); // Gold Pads
      const solderMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }); // Lead-free solder
      
      const p1 = new THREE.Mesh(padGeo, padMat);
      p1.position.set(-cW/2, axial ? 0 : -cD/2 - 0.05, 0);
      group.add(p1);

      // Solder Blob 1
      const blobGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const b1 = new THREE.Mesh(blobGeo, solderMat);
      b1.position.copy(p1.position);
      b1.position.y += 0.04;
      group.add(b1);

      const p2 = new THREE.Mesh(padGeo, padMat);
      p2.position.set(cW/2, axial ? 0 : -cD/2 - 0.05, 0);
      group.add(p2);

      // Solder Blob 2
      const b2 = new THREE.Mesh(blobGeo, solderMat);
      b2.position.copy(p2.position);
      b2.position.y += 0.04;
      group.add(b2);
      
      const gX = (comp.x * scale) - (bW / 2);
      const gZ = (comp.y * scale) - (bH / 2);
      group.position.x = gX;
      group.position.z = gZ;
      group.position.y = axial ? cH / 2 + 0.08 : (cD / 2) + 0.075;
      
      group.rotation.y = THREE.MathUtils.degToRad(comp.rotation);
      scene.add(group);

      // Add Silkscreen ID near component
      addSilkscreen(comp.id, gX, gZ + (cH * scale) + 0.3);
    });

    const animate = () => {
      if (viewMode !== '3d') return;
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    setLoading(false);

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [layout, viewMode, highlightTerm]);

  const getDynamicBounds = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (layout.components && layout.components.length > 0) {
      layout.components.forEach(c => {
        minX = Math.min(minX, c.x - 30);
        minY = Math.min(minY, c.y - 30);
        maxX = Math.max(maxX, c.x + 30);
        maxY = Math.max(maxY, c.y + 30);
      });
    }
    if (layout.traces && layout.traces.length > 0) {
      layout.traces.forEach(t => {
        t.points.forEach(p => {
          minX = Math.min(minX, p.x - 10);
          minY = Math.min(minY, p.y - 10);
          maxX = Math.max(maxX, p.x + 10);
          maxY = Math.max(maxY, p.y + 10);
        });
      });
    }
    if (minX === Infinity) return { minX: 0, minY: 0, width: 100, height: 100 };
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  };

  const bounds = getDynamicBounds();

  return (
    <div ref={containerRef} className="w-full h-full relative bg-bg-deep overflow-hidden">
      {viewMode === '2d' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-deep p-12 overflow-hidden relative">
           <div className="absolute inset-0 grid-bg opacity-10"></div>
           <div className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em] mb-10 absolute top-10 flex items-center gap-3">
              <Layers className="w-4 h-4" /> Layout_Plane_Active
           </div>
           
           <svg 
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
            className="w-full max-w-2xl h-auto border-2 border-border-accent bg-bg-panel/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 overflow-visible"
           >
            <rect x={bounds.minX} y={bounds.minY} width={bounds.width} height={bounds.height} fill="rgba(6, 78, 59, 0.05)" stroke="rgba(6, 78, 59, 0.4)" strokeWidth="0.5" rx="8" />
            
            {(layout.traces || []).map((trace, i) => (
              <polyline
                key={i}
                points={trace.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#6366F1"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            ))}

            {(layout.components || []).map((comp) => {
              const isHighlight = highlightTerm && comp.id.toLowerCase().includes(highlightTerm.toLowerCase());
              const type = comp.id.charAt(0).toUpperCase();
              let w = 12, h = 12;
              if (type === 'U') { w = 24; h = 16; }
              else if (type === 'R' || type === 'C') { w = 14; h = 8; }

              return (
                <g key={comp.id} transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}>
                  {/* Pads */}
                  {type === 'U' ? (
                     <g>
                       <rect x={-w/2 - 2} y={-h/2 + 2} width="4" height="4" fill="#D4AF37" rx="1" />
                       <rect x={w/2 - 2} y={-h/2 + 2} width="4" height="4" fill="#D4AF37" rx="1" />
                       <rect x={-w/2 - 2} y={h/2 - 6} width="4" height="4" fill="#D4AF37" rx="1" />
                       <rect x={w/2 - 2} y={h/2 - 6} width="4" height="4" fill="#D4AF37" rx="1" />
                     </g>
                  ) : (
                     <g>
                       <rect x={-w/2 - 2} y={-h/2} width="4" height={h} fill="#D4AF37" rx="1" />
                       <rect x={w/2 - 2} y={-h/2} width="4" height={h} fill="#D4AF37" rx="1" />
                     </g>
                  )}
                  
                  {/* Body */}
                  <rect 
                    x={-w/2} y={-h/2} width={w} height={h} 
                    fill={isHighlight ? "rgba(37, 99, 235, 0.2)" : "rgba(30, 41, 59, 0.8)"} 
                    stroke={isHighlight ? "#2563EB" : "#fff"} 
                    strokeWidth={isHighlight ? "2" : "0.5"} 
                    rx="2"
                  />
                  {type === 'U' && <circle cx={-w/2 + 4} cy={-h/2 + 4} r="1.5" fill="#fff" />}
                  
                  <text 
                    x="0" y={h/2 + 6} textAnchor="middle" dominantBaseline="middle" 
                    fill={isHighlight ? "#2563eb" : "#f8fafc"} 
                    className="text-[5px] font-sans font-black"
                  >
                    {comp.id}
                  </text>
                </g>
              );
            })}
           </svg>
        </div>
      )}

      {viewMode === 'schematic' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-deep p-12 overflow-hidden relative">
           <div className="absolute inset-0 grid-bg opacity-10"></div>
           <div className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em] mb-10 absolute top-10 flex items-center gap-3">
              <Activity className="w-4 h-4" /> Logic_Schematic_Node
           </div>

           <svg viewBox={`${bounds.minX - 20} ${bounds.minY - 20} ${bounds.width + 40} ${bounds.height + 40}`} className="w-full max-w-3xl h-auto border-2 border-border-accent bg-white rounded-2xl p-12 shadow-inner">
             {/* Schematic Grid */}
             <defs>
               <pattern id="schematicGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                 <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
               </pattern>
             </defs>
             <rect x={bounds.minX - 20} y={bounds.minY - 20} width={bounds.width + 40} height={bounds.height + 40} fill="url(#schematicGrid)" />

             <g>
                {(netlist || []).map((net, ni) => (
                  <g key={ni}>
                     {net.pins.map((p, pi) => {
                       const next = net.pins[pi+1];
                       if (!next) return null;
                       const c1 = layout.components.find(c => c.id === p.componentId);
                       const c2 = layout.components.find(c => c.id === next.componentId);
                       if (!c1 || !c2) return null;
                       
                       // Improved Orthogonal Routing
                       const midX = (c1.x + c2.x) / 2;
                       
                       return (
                         <path 
                           key={pi} 
                           d={`M ${c1.x} ${c1.y} L ${midX} ${c1.y} L ${midX} ${c2.y} L ${c2.x} ${c2.y}`} 
                           stroke="#6366F1" 
                           strokeWidth="1.2" 
                           fill="none"
                           strokeOpacity="0.8" 
                         />
                       )
                     })}
                  </g>
                ))}
             </g>
             {layout.components.map(comp => {
               const type = comp.id.charAt(0).toUpperCase();
               return (
                 <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`}>
                    {/* Component Symbols */}
                    {type === 'R' ? (
                      <path d="M -12 0 L -8 -4 L -4 4 L 0 -4 L 4 4 L 8 -4 L 12 0" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    ) : type === 'C' ? (
                      <g>
                        <line x1="-8" y1="-8" x2="-8" y2="8" stroke="#1e293b" strokeWidth="1.5" />
                        <line x1="8" y1="-8" x2="8" y2="8" stroke="#1e293b" strokeWidth="1.5" />
                        <line x1="-16" y1="0" x2="-8" y2="0" stroke="#1e293b" strokeWidth="1.5" />
                        <line x1="8" y1="0" x2="16" y2="0" stroke="#1e293b" strokeWidth="1.5" />
                      </g>
                    ) : type === 'U' ? (
                      <rect x="-15" y="-20" width="30" height="40" fill="white" stroke="#1e293b" strokeWidth="1.5" rx="2" />
                    ) : (
                      <circle cx="0" cy="0" r="6" fill="white" stroke="#1e293b" strokeWidth="1.5" />
                    )}
                    
                    <text y="-28" textAnchor="middle" className="text-[10px] fill-slate-900 font-black uppercase tracking-tighter">{comp.id}</text>
                    <text y="32" textAnchor="middle" className="text-[7px] fill-slate-400 font-bold uppercase">VAL_N/A</text>
                 </g>
               )
             })}
           </svg>
        </div>
      )}

      {loading && viewMode === '3d' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/90 z-20">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Initializing Mesh...</span>
        </div>
      )}
    </div>
  );
}
