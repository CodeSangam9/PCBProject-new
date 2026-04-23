import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MousePointer2, 
  Cpu, 
  Settings2, 
  Activity, 
  Download, 
  Save, 
  Trash2, 
  Plus, 
  Layers,
  BookOpen
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type ComponentType = 'IC' | 'Resistor' | 'Capacitor' | 'Connector' | 'Diode' | 'LED' | 'Transistor' | 'Inductor' | 'Switch';

interface DesignerComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  name: string;
  pins: { id: string, name: string, x: number, y: number }[];
}

interface Wire {
  id: string;
  startPin: string;
  endPin: string;
  points: { x: number, y: number }[];
}

export default function DesignerPage() {
  const navigate = useNavigate();
  const [components, setComponents] = useState<DesignerComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [activeTool, setActiveTool] = useState<'Cursor' | 'Wire' | 'Eraser'>('Cursor');
  const [drawingWire, setDrawingWire] = useState<{ startPin: string, startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [draggingComp, setDraggingComp] = useState<string | null>(null);
  const [showBOM, setShowBOM] = useState(true);
  const [gridSnap, setGridSnap] = useState(true);

  const svgRef = useRef<SVGSVGElement>(null);

  const addComponent = (type: ComponentType) => {
    const defaultPins = [];
    if (type === 'IC') {
      defaultPins.push({ id: uuidv4(), name: 'VCC', x: -25, y: -20 });
      defaultPins.push({ id: uuidv4(), name: 'GND', x: -25, y: 20 });
      defaultPins.push({ id: uuidv4(), name: 'IN', x: 25, y: -20 });
      defaultPins.push({ id: uuidv4(), name: 'OUT', x: 25, y: 20 });
    } else if (type === 'Transistor') {
      defaultPins.push({ id: uuidv4(), name: 'B', x: -20, y: 0 });
      defaultPins.push({ id: uuidv4(), name: 'C', x: 20, y: -15 });
      defaultPins.push({ id: uuidv4(), name: 'E', x: 20, y: 15 });
    } else if (type === 'Switch') {
      defaultPins.push({ id: uuidv4(), name: '1', x: -20, y: 0 });
      defaultPins.push({ id: uuidv4(), name: '2', x: 20, y: 0 });
    } else {
      defaultPins.push({ id: uuidv4(), name: '1', x: -25, y: 0 });
      defaultPins.push({ id: uuidv4(), name: '2', x: 25, y: 0 });
    }

    setComponents([...components, {
      id: uuidv4(),
      type,
      x: 150 + Math.random() * 50,
      y: 150 + Math.random() * 50,
      name: `${type}_${components.length + 1}`,
      pins: defaultPins
    }]);
  };

  const getSvgCoordinates = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    const coords = getSvgCoordinates(e);
    
    // Snap to grid sizes of 20
    const snap = (val: number) => gridSnap ? Math.round(val / 20) * 20 : Math.round(val);

    if (draggingComp && activeTool === 'Cursor') {
      setComponents(components.map(c => 
        c.id === draggingComp ? { ...c, x: snap(coords.x), y: snap(coords.y) } : c
      ));
    } else if (drawingWire && activeTool === 'Wire') {
      setDrawingWire({ ...drawingWire, endX: coords.x, endY: coords.y });
    }
  };

  const handlePointerUp = () => {
    setDraggingComp(null);
    if (drawingWire) {
      setDrawingWire(null); // Cancel wire if dropped in empty space
    }
  };

  const handlePinDown = (e: React.MouseEvent, pinId: string, absX: number, absY: number) => {
    e.stopPropagation();
    if (activeTool === 'Wire') {
      setDrawingWire({ startPin: pinId, startX: absX, startY: absY, endX: absX, endY: absY });
    } else if (activeTool === 'Eraser') {
      // Delete connected wires
      setWires(wires.filter(w => w.startPin !== pinId && w.endPin !== pinId));
    }
  };

  const handlePinUp = (e: React.MouseEvent, pinId: string, absX: number, absY: number) => {
    e.stopPropagation();
    if (activeTool === 'Wire' && drawingWire && drawingWire.startPin !== pinId) {
      // Connect wire
      setWires([...wires, {
        id: uuidv4(),
        startPin: drawingWire.startPin,
        endPin: pinId,
        points: []
      }]);
      setDrawingWire(null);
    }
  };

  const getPinAbsoluteCoords = (compId: string, pinLocalX: number, pinLocalY: number) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    return { x: comp.x + pinLocalX, y: comp.y + pinLocalY };
  };

  const generateWirePath = (startPinId: string, endPinId?: string, currentEndX?: number, currentEndY?: number) => {
     let startComp: DesignerComponent | undefined;
     let startP: DesignerComponent['pins'][0] | undefined;
     let endComp: DesignerComponent | undefined;
     let endP: DesignerComponent['pins'][0] | undefined;

     for (let c of components) {
       for (let p of c.pins) {
         if (p.id === startPinId) { startComp = c; startP = p; }
         if (endPinId && p.id === endPinId) { endComp = c; endP = p; }
       }
     }

     if (!startComp || !startP) return '';

     const sX = startComp.x + startP.x;
     const sY = startComp.y + startP.y;
     let eX = currentEndX || 0;
     let eY = currentEndY || 0;
     
     if (endComp && endP) {
         eX = endComp.x + endP.x;
         eY = endComp.y + endP.y;
     }

     // Determine which way a pin is facing based on its offset from the component center
     const getExitDir = (dx: number, dy: number) => {
       if (dx === 0 && dy === 0) return { x: 1, y: 0 };
       if (Math.abs(dx) >= Math.abs(dy)) {
         return { x: dx >= 0 ? 1 : -1, y: 0 };
       } else {
         return { x: 0, y: dy >= 0 ? 1 : -1 };
       }
     };

     const dir1 = getExitDir(startP.x, startP.y);
     let dir2 = { x: 0, y: 0 };
     
     if (endComp && endP) {
         dir2 = getExitDir(endP.x, endP.y);
     } else {
         // Guess incoming direction for smooth live drawing mode
         const dx = eX - sX;
         const dy = eY - sY;
         if (Math.abs(dx) >= Math.abs(dy)) {
            dir2 = { x: dx >= 0 ? -1 : 1, y: 0 };
         } else {
            dir2 = { x: 0, y: dy >= 0 ? -1 : 1 };
         }
     }

     // Push out margin from pins
     const margin = 30;
     const p1 = { x: sX + dir1.x * margin, y: sY + dir1.y * margin };
     const p2 = { x: eX + dir2.x * margin, y: eY + dir2.y * margin };

     // Create obstacle boxes
     const boxes = components.map(c => ({
         id: c.id,
         left: c.x - 35,
         right: c.x + 35,
         top: c.y - 35,
         bottom: c.y + 35
     }));

     const lineIntersectsBox = (A: {x:number, y:number}, B: {x:number, y:number}, box: any) => {
         const minX = Math.min(A.x, B.x);
         const maxX = Math.max(A.x, B.x);
         const minY = Math.min(A.y, B.y);
         const maxY = Math.max(A.y, B.y);
         // Exclude borders to let lines brush past
         return minX < box.right && maxX > box.left && minY < box.bottom && maxY > box.top;
     };

     const evaluateCost = (pts: {x:number, y:number}[]) => {
         let cost = 0;
         let intersects = 0;
         for (let i = 0; i < pts.length - 1; i++) {
             const A = pts[i];
             const B = pts[i+1];
             cost += Math.abs(A.x - B.x) + Math.abs(A.y - B.y); // Manhattan distance
             
             // Check collisions
             for (const box of boxes) {
                 // Disregard the very start and tip bounds since they connect inside boxes natively
                 if (i === 0 && box.id === startComp?.id) continue;
                 if (i === pts.length - 2 && endComp && box.id === endComp.id) continue;
                 
                 if (lineIntersectsBox(A, B, box)) {
                     intersects++;
                 }
             }
         }
         // Add penalty for number of bends to prioritize clean straight flows.
         let bends = 0;
         for (let i = 1; i < pts.length - 1; i++) {
             const prev = pts[i-1];
             const curr = pts[i];
             const next = pts[i+1];
             const dirX1 = curr.x - prev.x;
             const dirY1 = curr.y - prev.y;
             const dirX2 = next.x - curr.x;
             const dirY2 = next.y - curr.y;
             if ((dirX1 !== 0 && dirY2 !== 0) || (dirY1 !== 0 && dirX2 !== 0)) {
                 bends++;
             }
         }

         // Heavily penalize intersections, lightly penalize extra bends.
         return cost + (intersects * 100000) + (bends * 10);
     };

     const midX = (p1.x + p2.x) / 2;
     const midY = (p1.y + p2.y) / 2;

     // Basic internal routes
     const routes = [
         [{x:sX, y:sY}, p1, {x: p2.x, y: p1.y}, p2, {x:eX, y:eY}], // H->V or V->H combinations
         [{x:sX, y:sY}, p1, {x: p1.x, y: p2.y}, p2, {x:eX, y:eY}],
         [{x:sX, y:sY}, p1, {x: midX, y: p1.y}, {x: midX, y: p2.y}, p2, {x:eX, y:eY}],
         [{x:sX, y:sY}, p1, {x: p1.x, y: midY}, {x: p2.x, y: midY}, p2, {x:eX, y:eY}],
     ];

     // Wrap-around emergency routes when complex overlap happens.
     const outerPadding = 50;
     const bTop = Math.min(sY, eY) - outerPadding;
     const bBottom = Math.max(sY, eY) + outerPadding;
     const bLeft = Math.min(sX, eX) - outerPadding;
     const bRight = Math.max(sX, eX) + outerPadding;
     
     routes.push([{x:sX, y:sY}, p1, {x: p1.x, y: bTop}, {x: p2.x, y: bTop}, p2, {x:eX, y:eY}]);
     routes.push([{x:sX, y:sY}, p1, {x: p1.x, y: bBottom}, {x: p2.x, y: bBottom}, p2, {x:eX, y:eY}]);
     routes.push([{x:sX, y:sY}, p1, {x: bLeft, y: p1.y}, {x: bLeft, y: p2.y}, p2, {x:eX, y:eY}]);
     routes.push([{x:sX, y:sY}, p1, {x: bRight, y: p1.y}, {x: bRight, y: p2.y}, p2, {x:eX, y:eY}]);

     let bestRoute = routes[0];
     let minCost = Infinity;

     // Calculate best route variant!
     for (const r of routes) {
         const c = evaluateCost(r);
         if (c < minCost) {
             minCost = c;
             bestRoute = r;
         }
     }

     let d = `M ${bestRoute[0].x} ${bestRoute[0].y}`;
     for (let i = 1; i < bestRoute.length; i++) {
        if (bestRoute[i].x !== bestRoute[i-1].x || bestRoute[i].y !== bestRoute[i-1].y) {
            d += ` L ${bestRoute[i].x} ${bestRoute[i].y}`;
        }
     }
     return d;
  };

  return (
    <div className="flex flex-col h-screen bg-bg-deep font-sans text-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-border-accent px-6 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-brand-primary flex items-center justify-center font-black text-white italic text-lg shadow-lg">S</div>
             <div>
               <h1 className="font-black tracking-[0.2em] text-[14px] uppercase text-slate-900 border-b-2 border-brand-primary leading-none">Self_Canvas</h1>
               <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Manual PCB Modeler</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
            {['Cursor', 'Wire', 'Eraser'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTool(t as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTool === t ? 'bg-white shadow border border-slate-200 text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="h-10 px-6 bg-brand-accent text-white hover:bg-brand-accent/90 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Board
          </button>
          <button 
            onClick={() => setShowBOM(!showBOM)}
            className={`h-10 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-sm border ${showBOM ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            BOM / Parts
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Component Library Sidebar */}
        <aside className="w-[320px] bg-white border-r border-border-accent flex flex-col shadow-sm z-20 shrink-0">
          <div className="p-6 pb-2 overflow-y-auto custom-scrollbar flex-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-brand-primary" /> Component Library
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(['IC', 'Resistor', 'Capacitor', 'Connector', 'Diode', 'LED', 'Transistor', 'Inductor', 'Switch'] as ComponentType[]).map(type => (
                <button 
                  key={type}
                  onClick={() => addComponent(type)}
                  className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
                >
                  <Cpu className="w-5 h-5 text-slate-400 group-hover:text-brand-primary mb-2" />
                  <span className="text-[9px] font-bold text-slate-600 uppercase break-all">{type}</span>
                </button>
              ))}
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mb-8">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Grid Snapping</span>
               <button 
                 onClick={() => setGridSnap(!gridSnap)}
                 className={`w-10 h-5 rounded-full relative transition-colors ${gridSnap ? 'bg-brand-primary' : 'bg-slate-200'}`}
               >
                 <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${gridSnap ? 'left-6' : 'left-1'}`}></div>
               </button>
            </div>

            {/* Design Guide Section */}
            <div className="mt-4 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-accent" /> PCB Design Guide
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                  🧩 Main Components Required
                </p>
                <div className="space-y-3 text-[10px] text-slate-600 leading-relaxed font-medium">
                  <div><strong className="text-brand-primary block mb-0.5">Power:</strong>Voltage regulator, DC-DC converter, diodes</div>
                  <div><strong className="text-brand-primary block mb-0.5">Passive:</strong>Resistors, capacitors, inductors</div>
                  <div><strong className="text-brand-primary block mb-0.5">Active:</strong>Microcontroller, ICs, transistors</div>
                  <div><strong className="text-brand-primary block mb-0.5">I/O:</strong>Switches, LEDs, sensors, displays</div>
                  <div><strong className="text-brand-primary block mb-0.5">Connectivity:</strong>Headers, USB, communication ports</div>
                  <div><strong className="text-brand-primary block mb-0.5">Clock:</strong>Crystal oscillator</div>
                  <div><strong className="text-brand-primary block mb-0.5">Protection:</strong>Fuse, TVS diode</div>
                  <div><strong className="text-brand-primary block mb-0.5">PCB Elements:</strong>Traces, vias, pads, ground plane</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 mt-auto">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed font-bold">
              Tip: Select the <span className="text-brand-primary">Wire</span> tool and drag between nodes to establish electrical netlist connections.
            </div>
          </div>
        </aside>

        {/* Drawing Context */}
        <div className="flex-1 overflow-hidden relative bg-bg-deep cursor-crosshair">
          <svg 
            ref={svgRef}
            className="w-full h-full"
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#CBD5E1" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Wires */}
            {wires.map(wire => (
                 <g key={wire.id} onClick={() => {
                     if (activeTool === 'Eraser') {
                       setWires(wires.filter(w => w.id !== wire.id));
                     }
                 }}>
                   <path 
                     d={generateWirePath(wire.startPin, wire.endPin)} 
                     fill="none" 
                     stroke="#6366F1" 
                     strokeWidth="2.5" 
                     strokeLinejoin="round"
                     className="transition-colors hover:stroke-error cursor-pointer"
                   />
                 </g>
            ))}

            {/* Active Drawing Wire */}
            {drawingWire && activeTool === 'Wire' && (
              <path 
                d={generateWirePath(drawingWire.startPin, undefined, drawingWire.endX, drawingWire.endY)}
                fill="none" 
                stroke="#6366F1" 
                strokeWidth="2" 
                strokeDasharray="5,5" 
                strokeLinejoin="round"
                opacity="0.6"
              />
            )}

            {/* Components */}
            {components.map(comp => (
              <g 
                key={comp.id} 
                transform={`translate(${comp.x}, ${comp.y})`}
                onMouseDown={() => {
                  if (activeTool === 'Cursor') setDraggingComp(comp.id);
                  if (activeTool === 'Eraser') {
                    setComponents(components.filter(c => c.id !== comp.id));
                    setWires(wires.filter(w => {
                      return !comp.pins.find(p => p.id === w.startPin || p.id === w.endPin);
                    }));
                  }
                }}
                className={`cursor-${activeTool === 'Cursor' ? 'move' : activeTool === 'Eraser' ? 'pointer' : 'default'}`}
              >
                {/* Component Body */}
                {comp.type === 'IC' && <rect x="-30" y="-30" width="60" height="60" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />}
                {comp.type === 'Resistor' && (
                  <path d="M -20 0 L -15 -10 L -5 10 L 5 -10 L 15 10 L 20 0" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {comp.type === 'Capacitor' && (
                  <g>
                    <line x1="-10" y1="-15" x2="-10" y2="15" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
                    <line x1="10" y1="-15" x2="10" y2="15" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
                  </g>
                )}
                {comp.type === 'Connector' && <rect x="-15" y="-20" width="30" height="40" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />}
                {comp.type === 'Diode' && (
                  <g fill="#10b981" stroke="#10b981">
                    <polygon points="-15,-10 -15,10 5,0" />
                    <line x1="5" y1="-10" x2="5" y2="10" strokeWidth="3" />
                  </g>
                )}
                {comp.type === 'LED' && (
                  <g fill="#ec4899" stroke="#ec4899">
                     <polygon points="-15,-10 -15,10 5,0" />
                     <line x1="5" y1="-10" x2="5" y2="10" strokeWidth="3" />
                     {/* Arrows for light emission */}
                     <path d="M -5 -15 L -10 -25 M -10 -20 L -10 -25 L -5 -25" strokeWidth="1.5" fill="none" />
                     <path d="M 5 -10 L 0 -20 M 0 -15 L 0 -20 L 5 -20" strokeWidth="1.5" fill="none" />
                  </g>
                )}
                {comp.type === 'Transistor' && (
                  <g stroke="#8b5cf6" strokeWidth="2" fill="none">
                    <circle cx="0" cy="0" r="18" fill="#f3f4f6" />
                    <line x1="-10" y1="-10" x2="-10" y2="10" strokeWidth="3" />
                    <line x1="-10" y1="0" x2="-20" y2="0" strokeWidth="2" /> {/* Base */}
                    <line x1="-10" y1="-5" x2="10" y2="-15" /> {/* Collector */}
                    <line x1="-10" y1="5" x2="10" y2="15" /> {/* Emitter */}
                    <polygon points="10,15 4,13 8,9" fill="#8b5cf6" /> {/* Emitter Arrow */}
                  </g>
                )}
                {comp.type === 'Inductor' && (
                  <path d="M -20 0 C -15 -15, -5 -15, 0 0 C 5 -15, 15 -15, 20 0" fill="none" stroke="#f97316" strokeWidth="3" />
                )}
                {comp.type === 'Switch' && (
                  <g stroke="#64748b" strokeWidth="3" strokeLinecap="round">
                    <circle cx="-15" cy="0" r="3" fill="white" />
                    <circle cx="15" cy="0" r="3" fill="white" />
                    <line x1="-12" y1="-2" x2="10" y2="-12" />
                  </g>
                )}
                
                <text y="-40" textAnchor="middle" fill="#64748b" className="text-[10px] font-bold uppercase pointer-events-none">
                   {comp.name}
                </text>

                {/* Pins */}
                {comp.pins.map(pin => (
                  <g 
                    key={pin.id} 
                    transform={`translate(${pin.x}, ${pin.y})`}
                    onMouseDown={(e) => handlePinDown(e, pin.id, comp.x + pin.x, comp.y + pin.y)}
                    onMouseUp={(e) => handlePinUp(e, pin.id, comp.x + pin.x, comp.y + pin.y)}
                  >
                    <circle cx="0" cy="0" r="5" fill="#D4AF37" stroke="#fff" strokeWidth="1" className="hover:r-7 transition-all cursor-crosshair" />
                    <text x="8" y="3" className="text-[7px] font-black fill-slate-500 uppercase pointer-events-none">{pin.name}</text>
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>

        {/* Right Sidebar for BOM */}
        <AnimatePresence>
          {showBOM && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-50 border-l border-border-accent flex flex-col shadow-sm z-20 overflow-hidden shrink-0"
            >
              <div className="p-6 w-[300px] h-full flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
                  Bill of Materials
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{components.length} Items</span>
                </h3>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  {components.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic font-medium">
                      No components placed yet.<br />Drag items from the left menu.
                    </div>
                  ) : (
                    Object.entries(
                      components.reduce((acc, comp) => {
                        acc[comp.type] = (acc[comp.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-brand-primary" />
                          </div>
                          <div>
                            <div className="text-[11px] font-black uppercase text-slate-800">{type}</div>
                            <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">SMD / THT</div>
                          </div>
                        </div>
                        <div className="text-lg font-black text-slate-900 mx-2">x{count}</div>
                      </div>
                    ))
                  )}

                  {components.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Netlist Specs</h4>
                       <div className="flex justify-between text-xs text-slate-600">
                         <span className="font-bold">Total Nodes:</span>
                         <span>{components.reduce((acc, c) => acc + c.pins.length, 0)}</span>
                       </div>
                       <div className="flex justify-between text-xs text-slate-600">
                         <span className="font-bold">Connected Traces:</span>
                         <span>{wires.length}</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
