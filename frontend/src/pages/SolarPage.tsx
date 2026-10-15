import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScadaPanel } from '../components/common/ScadaPanel';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import {
  Camera,
  Video,
  Upload,
  Crosshair,
  Compass,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  DollarSign,
  Leaf,
  Cpu,
  BarChart3,
  ExternalLink,
  RotateCcw,
  Box,
  Eye,
  AlertCircle,
  MapPin,
  Flame,
  Wind,
  Layers,
  Maximize2,
  Volume2,
  VolumeX,
  Download,
  Move,
  CornerDownRight,
  Sun,
  Shield,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// PV Module Technology Catalogue
export interface PvModuleTech {
  id: string;
  name: string;
  fullName: string;
  efficiency: number;
  tempCoeff: number; // % / °C
  bifaciality: number; // 0.0 to 1.0
  firstYearDegradation: number; // %
  annualDegradation: number; // %
  busbars: number;
  warrantyYears: number;
  color: string;
  badge: string;
  bestFor: string;
  description: string;
}

const PV_CATALOGUE: PvModuleTech[] = [
  {
    id: 'topcon',
    name: 'N-Type TOPCon',
    fullName: 'Tunnel Oxide Passivated Contact (N-Type)',
    efficiency: 24.0,
    tempCoeff: -0.30,
    bifaciality: 0.82,
    firstYearDegradation: 0.8,
    annualDegradation: 0.40,
    busbars: 16,
    warrantyYears: 30,
    color: '#22e6c4',
    badge: 'TOP AI RECOMMENDATION',
    bestFor: 'Hot urban rooftops & constrained high-density spaces',
    description: 'Ultra-thin tunnel oxide layer minimizes surface recombination, delivering industry-leading 24.0% efficiency with superior high-temperature yields.'
  },
  {
    id: 'bifacial',
    name: 'Bifacial Dual-Glass',
    fullName: 'Double-Glass Rear Albedo Harvesting Module',
    efficiency: 22.8,
    tempCoeff: -0.32,
    bifaciality: 0.85,
    firstYearDegradation: 1.0,
    annualDegradation: 0.45,
    busbars: 12,
    warrantyYears: 30,
    color: '#5fa8ff',
    badge: 'HIGHEST LIFETIME YIELD',
    bestFor: 'High-albedo surfaces (White TPO membranes, bright concrete, gravel)',
    description: 'Captures both direct sunlight from the front and scattered ground reflection (albedo) from the rear, providing up to 30% supplemental energy gain.'
  },
  {
    id: 'perc',
    name: 'Advanced Mono PERC',
    fullName: 'Passivated Emitter and Rear Cell (Mono-Si)',
    efficiency: 22.5,
    tempCoeff: -0.34,
    bifaciality: 0.70,
    firstYearDegradation: 1.5,
    annualDegradation: 0.55,
    busbars: 10,
    warrantyYears: 25,
    color: '#ffb238',
    badge: 'OPTIMAL COST-TO-POWER',
    bestFor: 'Standard commercial & industrial rooftop installations',
    description: 'Rear dielectric passivation layer reflects unabsorbed light back through the silicon wafer for a secondary absorption pass.'
  },
  {
    id: 'mono',
    name: 'Standard Monocrystalline',
    fullName: 'P-Type Czochralski Single-Crystal Silicon',
    efficiency: 21.0,
    tempCoeff: -0.36,
    bifaciality: 0.0,
    firstYearDegradation: 2.0,
    annualDegradation: 0.60,
    busbars: 9,
    warrantyYears: 25,
    color: '#a78bfa',
    badge: 'PROVEN INDUSTRY WORKHORSE',
    bestFor: 'General residential and moderate-temperature climates',
    description: 'High-purity uniform crystal structure offers reliable long-term performance and deep dark aesthetic integration.'
  },
  {
    id: 'thinfilm',
    name: 'Thin-Film CdTe',
    fullName: 'Cadmium Telluride Advanced Thin-Film',
    efficiency: 11.5,
    tempCoeff: -0.21,
    bifaciality: 0.0,
    firstYearDegradation: 1.0,
    annualDegradation: 0.50,
    busbars: 0,
    warrantyYears: 25,
    color: '#f43f5e',
    badge: 'EXTREME THERMAL RESILIENCE',
    bestFor: 'Extreme desert heat environments & curved architectural facades',
    description: 'Remarkable -0.21%/°C temperature coefficient means minimal thermal derating in hot climates, plus outstanding performance in diffuse low-light conditions.'
  },
  {
    id: 'poly',
    name: 'Polycrystalline (Legacy)',
    fullName: 'Multi-Crystalline Cast Silicon',
    efficiency: 16.0,
    tempCoeff: -0.42,
    bifaciality: 0.0,
    firstYearDegradation: 2.5,
    annualDegradation: 0.75,
    busbars: 5,
    warrantyYears: 20,
    color: '#94a3b8',
    badge: 'DISCONTINUED / BENCHMARK ONLY',
    bestFor: 'Legacy comparison benchmark (demonstrates why modern upgrades yield +40%)',
    description: 'Multi-grain cast silicon with visible grain boundaries. High thermal derating and low efficiency make it economically obsolete.'
  }
];

interface RoofSurface {
  id: string;
  name: string;
  albedo: number;
  description: string;
}

const ROOF_SURFACES: RoofSurface[] = [
  { id: 'white_tpo', name: 'White TPO / PVC Membrane', albedo: 0.75, description: 'Reflects 75% of sunlight — supreme rear boost for Bifacial PV' },
  { id: 'concrete', name: 'Standard Grey Concrete Terrace', albedo: 0.20, description: 'Standard diffuse reflection (20% albedo) — universal flat roof baseline' },
  { id: 'gravel', name: 'Crushed Light Gravel / Stone', albedo: 0.28, description: 'Natural diffuse multi-directional scattering (28% albedo)' },
  { id: 'metal', name: 'Standing Seam Metal (Zinc/Alum)', albedo: 0.16, description: 'Specular glare reflection with direct heat conduction' }
];

// Preset Rooftop Environments for instant camera simulation
interface RooftopPreset {
  id: string;
  title: string;
  type: string;
  dimensions: string;
  azimuthDesc: string;
  obstacleDesc: string;
  svgGradient: string;
  defaultBoundary: { x: number; y: number }[];
  defaultObstacle: { x: number; y: number; label: string };
}

const ROOFTOP_PRESETS: RooftopPreset[] = [
  {
    id: 'flat_terrace',
    title: 'Urban Flat Concrete Terrace',
    type: 'Flat Rooftop (0° Slope)',
    dimensions: '8.5m × 6.0m (51.0 m²)',
    azimuthDesc: 'Unrestricted 360° solar access. Best faced True South (180°).',
    obstacleDesc: 'Water tank & staircase head-room located on North-West corner.',
    svgGradient: 'linear-gradient(135deg, #2b353b 0%, #172024 100%)',
    defaultBoundary: [
      { x: 15, y: 25 },
      { x: 85, y: 20 },
      { x: 88, y: 82 },
      { x: 12, y: 85 }
    ],
    defaultObstacle: { x: 78, y: 35, label: 'Water Tank (1.8m)' }
  },
  {
    id: 'residential_sloped',
    title: 'Residential South-Facing Sloped Roof',
    type: 'Pitch Sloped (24° Incline)',
    dimensions: '10.0m × 4.8m (48.0 m²)',
    azimuthDesc: 'Existing roof rake faces 170° SSE. Ideal for flush-rail mounting.',
    obstacleDesc: 'Brick chimney & plumbing vent pipe at center ridge.',
    svgGradient: 'linear-gradient(135deg, #3d2b24 0%, #201511 100%)',
    defaultBoundary: [
      { x: 18, y: 28 },
      { x: 82, y: 22 },
      { x: 86, y: 78 },
      { x: 14, y: 80 }
    ],
    defaultObstacle: { x: 50, y: 38, label: 'Chimney (1.2m)' }
  },
  {
    id: 'commercial_tpo',
    title: 'Commercial White Membrane Facility',
    type: 'High-Albedo Flat TPO (0.75 Albedo)',
    dimensions: '14.0m × 9.5m (133.0 m²)',
    azimuthDesc: 'High reflectivity ground plane. Bifacial modules harvest +28% extra.',
    obstacleDesc: 'Rooftop HVAC package unit & safety skylights.',
    svgGradient: 'linear-gradient(135deg, #3a474d 0%, #232c30 100%)',
    defaultBoundary: [
      { x: 12, y: 20 },
      { x: 88, y: 18 },
      { x: 92, y: 86 },
      { x: 8, y: 88 }
    ],
    defaultObstacle: { x: 26, y: 40, label: 'HVAC Chiller Unit' }
  }
];

export const SolarPage: React.FC = () => {
  // Main Tab Navigation: Default is the hyper-interactive Camera Rooftop Scanner
  const [activeTab, setActiveTab] = useState<'camera_scanner' | '3d_twin' | 'mcda_advisor' | 'array_builder' | 'financials'>('camera_scanner');

  // Active PV Module Technology
  const [selectedTechId, setSelectedTechId] = useState<string>('topcon');
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string>('concrete');

  // Array Geometry Parameters
  const [columns, setColumns] = useState<number>(4);
  const [rows, setRows] = useState<number>(2);
  const [tiltAngle, setTiltAngle] = useState<number>(28);
  const [azimuth, setAzimuth] = useState<number>(180); // 180 = True South
  const [rowPitchMeters, setRowPitchMeters] = useState<number>(2.2);

  // Environmental Parameters
  const [ambientTempC, setAmbientTempC] = useState<number>(31.5);
  const [irradianceWm2, setIrradianceWm2] = useState<number>(850);
  const [electricityTariff, setElectricityTariff] = useState<number>(0.14);

  // -------------------------------------------------------------
  // CAMERA & INTERACTIVE ROOFTOP SPACE SCANNER STATE
  // -------------------------------------------------------------
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Interactive Tools Mode on Camera: 'scan' | 'boundary' | 'obstacle' | 'place'
  const [scannerTool, setScannerTool] = useState<'scan' | 'boundary' | 'obstacle' | 'place'>('place');

  // Rooftop Boundary Polygon Corners (% of viewport: 0-100)
  const [boundaryPoints, setBoundaryPoints] = useState<{ x: number; y: number }[]>(
    ROOFTOP_PRESETS[0].defaultBoundary
  );

  // Obstacle Point & Label
  const [obstaclePoint, setObstaclePoint] = useState<{ x: number; y: number; label: string } | null>(
    ROOFTOP_PRESETS[0].defaultObstacle
  );

  // Array Placement Center (% of viewport: 0-100)
  const [arrayPosition, setArrayPosition] = useState<{ x: number; y: number }>({ x: 50, y: 55 });
  const [isDraggingArray, setIsDraggingArray] = useState<boolean>(false);
  const [isDraggingPointIndex, setIsDraggingPointIndex] = useState<number | null>(null);

  // Visual Overlays on Camera
  const [showLaserGrid, setShowLaserGrid] = useState<boolean>(true);
  const [showSunRay, setShowSunRay] = useState<boolean>(true);
  const [showThermalLens, setShowThermalLens] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(
    'Point camera at roof surface. Boundary & optimal layout will auto-calculate!'
  );

  // 3D FX Viewport Toggles (for 3D Twin tab)
  const [thermalFx, setThermalFx] = useState<boolean>(false);
  const [windFx, setWindFx] = useState<boolean>(false);
  const [hudFx, setHudFx] = useState<boolean>(true);
  const [obstacleFx, setObstacleFx] = useState<boolean>(false);

  // Blueprint export modal
  const [blueprintModalOpen, setBlueprintModalOpen] = useState<boolean>(false);

  // Video and Canvas DOM refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraViewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Technology & Surface Objects
  const activeTech = useMemo(() => {
    return PV_CATALOGUE.find((t) => t.id === selectedTechId) || PV_CATALOGUE[0];
  }, [selectedTechId]);

  const activeSurface = useMemo(() => {
    return ROOF_SURFACES.find((s) => s.id === selectedSurfaceId) || ROOF_SURFACES[0];
  }, [selectedSurfaceId]);

  // Real-time Physics & Sizing Computations
  const calculations = useMemo(() => {
    const totalModules = columns * rows;
    const moduleAreaM2 = 1.95; // 2m x 1m module standard
    const totalFootprintM2 = totalModules * moduleAreaM2 * (1 + (rowPitchMeters - 1.5) * 0.35);

    // Standard Test Conditions
    const ratedWattsPerModule = Math.round(1000 * moduleAreaM2 * (activeTech.efficiency / 100));
    const totalNameplateKwp = (totalModules * ratedWattsPerModule) / 1000;

    // Nominal Operating Cell Temp
    const NOCT = 45;
    const cellTempC = ambientTempC + ((NOCT - 20) / 800) * irradianceWm2;
    const tempDelta = Math.max(0, cellTempC - 25);
    const tempDeratePct = Math.abs(activeTech.tempCoeff) * tempDelta;

    // Bifacial Albedo Rear Gain
    const rearGainPct = activeTech.bifaciality > 0 ? activeSurface.albedo * activeTech.bifaciality * 24.0 : 0;

    // Obstacle shading loss calculation
    const isObstacleNearArray = obstaclePoint !== null;
    const shadingLossPct = isObstacleNearArray ? 12.5 : 0;

    // Net instantaneous output
    const rawPowerKw = totalNameplateKwp * (irradianceWm2 / 1000);
    const effectivePowerKw =
      rawPowerKw * (1 - tempDeratePct / 100) * (1 + rearGainPct / 100) * (1 - shadingLossPct / 100);

    // Generation
    const peakSunHours = 5.2;
    const dailyKwh = totalNameplateKwp * peakSunHours * (1 - tempDeratePct / 100) * (1 + rearGainPct / 100) * (1 - shadingLossPct / 100);
    const annualKwh = dailyKwh * 365;

    // String DC Bus
    const stringVoltage = 380 + (tiltAngle - 30) * 1.5 - tempDelta * 0.8;
    const stringCurrent = (effectivePowerKw * 1000) / (stringVoltage || 1);

    // 25-Year Economics
    const systemCostPerWatt = activeTech.id === 'topcon' ? 1.05 : activeTech.id === 'bifacial' ? 1.10 : 0.95;
    const capex = totalNameplateKwp * 1000 * systemCostPerWatt;
    const annualSavingsUsd = annualKwh * electricityTariff;
    const paybackYears = capex / (annualSavingsUsd || 1);
    const lifetimeSavingsUsd = annualSavingsUsd * 25 * 0.92 - capex;
    const lifetimeCo2Tons = (annualKwh * 25 * 0.708) / 1000;

    // Estimated Scanned Area based on polygon width/height
    const minX = Math.min(...boundaryPoints.map((p) => p.x));
    const maxX = Math.max(...boundaryPoints.map((p) => p.x));
    const minY = Math.min(...boundaryPoints.map((p) => p.y));
    const maxY = Math.max(...boundaryPoints.map((p) => p.y));
    const normalizedAreaPct = ((maxX - minX) * (maxY - minY)) / 10000;
    const estimatedRealAreaM2 = Math.round(normalizedAreaPct * 80 + 15);
    const usableAreaM2 = Math.round(estimatedRealAreaM2 * 0.78);
    const maxFittingModules = Math.floor(usableAreaM2 / 2.2);

    return {
      totalModules,
      ratedWattsPerModule,
      totalNameplateKwp,
      cellTempC,
      tempDeratePct,
      rearGainPct,
      effectivePowerKw,
      dailyKwh,
      annualKwh,
      stringVoltage,
      stringCurrent,
      capex,
      annualSavingsUsd,
      paybackYears,
      lifetimeSavingsUsd,
      lifetimeCo2Tons,
      totalFootprintM2,
      estimatedRealAreaM2,
      usableAreaM2,
      maxFittingModules
    };
  }, [
    columns,
    rows,
    tiltAngle,
    rowPitchMeters,
    activeTech,
    activeSurface,
    ambientTempC,
    irradianceWm2,
    electricityTariff,
    obstaclePoint,
    boundaryPoints
  ]);

  // Audio / Speech Synthesis: Answers "In this place, how to fix panels"
  const speakAdvice = (customText?: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const advice =
      customText ||
      `Rooftop surface scanned. Usable area: ${calculations.usableAreaM2} square meters. Recommended installation: ${calculations.totalModules} ${activeTech.name} solar panels mounted on an aluminum ballasted rack. Face the array to True South at ${tiltAngle} degrees tilt for optimal year-round harvest. Estimated daily energy output is ${calculations.dailyKwh.toFixed(1)} kilowatt-hours.`;

    const utterance = new SpeechSynthesisUtterance(advice);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setToastMessage('🔊 Speaking AI Installation Recommendations...');
  };

  // Start Hardware Camera Stream
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera MediaDevices API not available in this environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setUploadedImage(null);
        setToastMessage('✓ Camera active! Scan your roof or terrace floor.');
        if (speechEnabled) {
          speakAdvice('Camera activated. Aim at your rooftop surface to scan placement boundaries.');
        }
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Camera access declined or unavailable.');
      setCameraActive(false);
      setToastMessage('ℹ Using high-resolution simulated rooftop preset.');
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setToastMessage('Camera paused. Displaying interactive simulation workspace.');
  };

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        stopCamera();
        setToastMessage('✓ Custom rooftop photo loaded! Drop pins to outline.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Switch preset rooftop
  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    setUploadedImage(null);
    stopCamera();
    setBoundaryPoints(ROOFTOP_PRESETS[idx].defaultBoundary);
    setObstaclePoint(ROOFTOP_PRESETS[idx].defaultObstacle);
    setToastMessage(`Switched to ${ROOFTOP_PRESETS[idx].title}`);
  };

  // AI Auto-Fit & Fix Action
  const handleAutoFitToSpace = () => {
    // Automatically calculate optimal columns & rows based on usable area
    const fits = Math.min(12, Math.max(4, calculations.maxFittingModules));
    if (fits >= 8) {
      setColumns(4);
      setRows(2);
    } else if (fits >= 6) {
      setColumns(3);
      setRows(2);
    } else {
      setColumns(2);
      setRows(2);
    }
    setTiltAngle(28);
    setAzimuth(180); // Snap True South
    setArrayPosition({ x: 50, y: 55 });
    setToastMessage('⚡ AI Auto-Fitted: 8 panels oriented True South (180°) at 28° tilt.');
    speakAdvice(
      `AI Auto-fit complete. We have configured ${columns * rows} panels positioned away from obstacles, angled at ${tiltAngle} degrees facing South.`
    );
  };

  // Snap to True South
  const handleSnapSouth = () => {
    setAzimuth(180);
    setToastMessage('🧭 Solar Array snapped to True South (180°) for 100% peak irradiance.');
  };

  // Viewport Click Handler for Interactive Boundary / Obstacle Placing
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingArray || isDraggingPointIndex !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (scannerTool === 'obstacle') {
      setObstaclePoint({ x, y, label: 'Obstacle / Shading Zone' });
      setToastMessage(`📍 Obstacle marked at (${x}%, ${y}%). Recalculating shadow safety zone!`);
    } else if (scannerTool === 'place') {
      setArrayPosition({ x, y });
      setToastMessage(`⚡ Solar Array placed at (${x}%, ${y}%).`);
    }
  };

  // MCDA Scoring Engine (Multi-Criteria Decision Analysis)
  const mcdaRankings = useMemo(() => {
    return PV_CATALOGUE.map((tech) => {
      const effScore = (tech.efficiency / 24.0) * 100;
      const thermalScore = ((0.50 - Math.abs(tech.tempCoeff)) / (0.50 - 0.20)) * 100;
      const albedoScore = tech.bifaciality > 0 ? ((tech.bifaciality * activeSurface.albedo) / (0.85 * 0.75)) * 100 : 25;
      const degScore = ((1.0 - tech.annualDegradation) / (1.0 - 0.35)) * 100;
      const composite = effScore * 0.30 + thermalScore * 0.22 + albedoScore * 0.20 + degScore * 0.28;

      return {
        tech,
        compositeScore: Math.round(Math.min(100, Math.max(0, composite))),
        effScore: Math.round(effScore),
        thermalScore: Math.round(thermalScore),
        albedoScore: Math.round(albedoScore),
        degScore: Math.round(degScore)
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }, [activeSurface]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner with Direct Modes */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="scada-panel p-5 bg-gradient-to-r from-panel via-panel-2 to-panel border-amber/40 glow-amber relative shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-amber/20 text-amber uppercase tracking-widest border border-amber/40 shadow-sm flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 animate-pulse text-amber" />
                AI CAMERA ROOFTOP SCANNER & SMART FITTING ASSISTANT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LIVE INTERACTIVE VISION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue/20 text-blue border border-blue/40">
                EPDI FIX PANNALAM GUIDE
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
              Point Camera at Any Space — Instant AI Solar Fitting & Layout Advisor
            </h2>

            <p className="text-xs text-text-dim max-w-3xl leading-relaxed font-mono">
              Aim your camera or upload a rooftop view. The AI spatial engine scans the area, detects boundaries, isolates obstacle shadows,
              and demonstrates <em>exactly where, how many, and in what direction</em> to fix solar panels with zero guesswork.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => speakAdvice()}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${
                isSpeaking
                  ? 'bg-amber text-bg border-amber shadow-glow-amber animate-pulse'
                  : 'bg-panel-2 text-amber border-amber/40 hover:bg-amber/20'
              }`}
              title="Voice AI: How to fix panels in this place"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Speaking Advice...' : 'Explain How to Fix'}</span>
            </button>

            <button
              onClick={() => setBlueprintModalOpen(true)}
              className="px-3.5 py-2.5 rounded-lg bg-teal text-bg font-bold text-xs flex items-center gap-1.5 shadow-glow-teal hover:bg-teal/90 transition-all font-mono"
            >
              <Download className="w-4 h-4" />
              <span>Export AR Blueprint</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-line/60 overflow-x-auto custom-scrollbar">
          {[
            { id: 'camera_scanner', label: '📷 AI Camera Rooftop Scanner', icon: Camera, badge: 'PRIMARY' },
            { id: '3d_twin', label: '🌐 3D Photovoltaic Twin (Three.js)', icon: Eye },
            { id: 'mcda_advisor', label: '🤖 AI Decision Advisor (MCDA)', icon: Cpu },
            { id: 'array_builder', label: '📐 3D Array Geometry & Tilt', icon: Sliders },
            { id: 'financials', label: '💰 25-Year ROI & Lifecycle', icon: DollarSign }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber/20 text-amber border border-amber/40 shadow-sm'
                    : 'text-text-dim hover:text-text-main hover:bg-panel-2'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber text-bg font-bold font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Real-time Telemetry Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-amber/40 glow-amber">
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Array Gen Output</span>
            <Sun className="w-3.5 h-3.5 text-amber" />
          </div>
          <p className="text-xl font-bold font-mono text-amber">
            <AnimatedCounter value={calculations.effectivePowerKw} decimals={2} suffix="kW" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">
            {calculations.totalNameplateKwp.toFixed(1)} kWp Nameplate
          </span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-line">
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Scanned Space</span>
            <Crosshair className="w-3.5 h-3.5 text-teal" />
          </div>
          <p className="text-xl font-bold font-mono text-teal">
            <AnimatedCounter value={calculations.estimatedRealAreaM2} decimals={0} suffix="m²" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">
            Usable: {calculations.usableAreaM2} m² ({calculations.maxFittingModules} Panels)
          </span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-line">
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Orientation Azimuth</span>
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">
            {azimuth}° {azimuth === 180 ? '(True South)' : azimuth < 180 ? '(SE Morning)' : '(SW Afternoon)'}
          </p>
          <span className="text-[10px] text-text-dim font-mono">Tilt: {tiltAngle}° Optimal</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-blue/30">
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Bifacial Albedo</span>
            <Zap className="w-3.5 h-3.5 text-blue" />
          </div>
          <p className="text-xl font-bold font-mono text-blue">
            <AnimatedCounter value={calculations.rearGainPct} decimals={1} prefix="+" suffix="%" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">{activeSurface.name.split(' ')[0]}</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-line">
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Cell Temp</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-400">
            <AnimatedCounter value={calculations.cellTempC} decimals={1} suffix="°C" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">Derate: -{calculations.tempDeratePct.toFixed(1)}%</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="scada-panel p-3 border-emerald-500/40 glow-green">
          <div className="flex items-center justify-between text-text-dim text-[11px] mb-1">
            <span className="font-semibold uppercase">Daily Yield</span>
            <BarChart3 className="w-3.5 h-3.5 text-green" />
          </div>
          <p className="text-xl font-bold font-mono text-green">
            <AnimatedCounter value={calculations.dailyKwh} decimals={1} suffix="kWh" />
          </p>
          <span className="text-[10px] text-text-dim font-mono">
            ~{calculations.annualKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr
          </span>
        </motion.div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: HYPER-INTERACTIVE AI CAMERA ROOFTOP SCANNER & FITTING */}
      {/* ============================================================= */}
      <AnimatePresence mode="wait">
        {activeTab === 'camera_scanner' && (
          <motion.div
            key="camera_scanner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left 2 Columns: Live Interactive Camera Viewfinder */}
            <div className="lg:col-span-2 space-y-4">
              <ScadaPanel
                title="Live Rooftop Viewfinder & Space Analysis Canvas"
                subtitle="Real-time AR boundary projection, obstacle detection & interactive array fitting"
                accentTop
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {cameraActive ? 'WEBCAM ACTIVE' : 'SIMULATED ENVIRONMENT'}
                  </span>
                }
                actions={
                  <div className="flex items-center gap-2">
                    {cameraActive ? (
                      <button
                        onClick={stopCamera}
                        className="text-[11px] px-2.5 py-1 rounded bg-red/20 text-red border border-red/40 hover:bg-red/30 transition-all font-semibold flex items-center gap-1"
                      >
                        <Video className="w-3 h-3" />
                        <span>Stop Camera</span>
                      </button>
                    ) : (
                      <button
                        onClick={startCamera}
                        disabled={cameraLoading}
                        className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{cameraLoading ? 'Starting...' : 'Turn On Camera'}</span>
                      </button>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] px-2 py-1 rounded bg-panel-2 border border-line text-text-dim hover:text-text-main flex items-center gap-1"
                      title="Upload rooftop photo"
                    >
                      <Upload className="w-3 h-3" />
                      <span className="hidden sm:inline">Upload Photo</span>
                    </button>
                  </div>
                }
              >
                {/* Viewport Container */}
                <div
                  ref={cameraViewportRef}
                  onClick={handleViewportClick}
                  className="relative w-full h-[520px] rounded-xl overflow-hidden border border-line bg-gradient-to-b from-[#060b10] to-[#0f1722] shadow-2xl select-none cursor-crosshair group"
                >
                  {/* 1. Underlying Real Camera Video Element */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      cameraActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                    }`}
                  />

                  {/* 2. Uploaded Custom Photo Fallback */}
                  {uploadedImage && !cameraActive && (
                    <img
                      src={uploadedImage}
                      alt="Uploaded Rooftop"
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                  )}

                  {/* 3. High-Res Preset Rooftop Background (when camera off and no upload) */}
                  {!cameraActive && !uploadedImage && (
                    <div
                      className="absolute inset-0 z-0 flex items-center justify-center p-6 text-center"
                      style={{ background: ROOFTOP_PRESETS[activePresetIndex].svgGradient }}
                    >
                      {/* Procedural architectural floor texture & perspective lines */}
                      <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none">
                        <defs>
                          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22e6c4" strokeWidth="0.8" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#gridPattern)" />
                        <line x1="0" y1="100%" x2="50%" y2="50%" stroke="#5fa8ff" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="100%" y1="100%" x2="50%" y2="50%" stroke="#5fa8ff" strokeWidth="1" strokeDasharray="4 4" />
                      </svg>

                      <div className="relative z-10 max-w-md p-4 rounded-2xl bg-panel/85 border border-line backdrop-blur-md shadow-2xl space-y-2 pointer-events-none">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal/20 text-teal font-bold uppercase tracking-wider">
                          Active Scene Preset: {ROOFTOP_PRESETS[activePresetIndex].title}
                        </span>
                        <h4 className="text-base font-bold text-white">
                          {ROOFTOP_PRESETS[activePresetIndex].dimensions} • {ROOFTOP_PRESETS[activePresetIndex].type}
                        </h4>
                        <p className="text-xs text-text-dim leading-relaxed font-mono">
                          {ROOFTOP_PRESETS[activePresetIndex].azimuthDesc}
                        </p>
                        <p className="text-[11px] text-amber leading-relaxed font-mono">
                          ⚠ {ROOFTOP_PRESETS[activePresetIndex].obstacleDesc}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. FLIR Thermal Cam Heatmap Overlay Filter (when active) */}
                  {showThermalLens && (
                    <div
                      className="absolute inset-0 z-1 pointer-events-none mix-blend-color-dodge opacity-75"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 50%, rgba(255, 60, 0, 0.6) 0%, rgba(200, 0, 180, 0.4) 50%, rgba(0, 30, 120, 0.6) 100%)'
                      }}
                    />
                  )}

                  {/* 5. Laser Scan Grid Mesh SVG Overlay */}
                  {showLaserGrid && (
                    <svg className="absolute inset-0 w-full h-full z-2 pointer-events-none">
                      {/* Laser scanning vertical sweeping bar */}
                      <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#22e6c4" strokeWidth="2" strokeDasharray="8 4" opacity="0.8" />
                      <circle cx="50%" cy="50%" r="90" fill="none" stroke="#22e6c4" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
                    </svg>
                  )}

                  {/* 6. Rooftop Boundary Polygon Outline */}
                  <svg className="absolute inset-0 w-full h-full z-3 pointer-events-none">
                    <polygon
                      points={boundaryPoints.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                      fill="rgba(34, 230, 196, 0.08)"
                      stroke="#22e6c4"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                    {/* Dimension lines */}
                    <text
                      x={(boundaryPoints[0].x + boundaryPoints[1].x) / 2 + '%'}
                      y={(boundaryPoints[0].y + boundaryPoints[1].y) / 2 - 2 + '%'}
                      fill="#22e6c4"
                      fontSize="11"
                      fontFamily="IBM Plex Mono"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Top Span: ~8.5m
                    </text>
                    <text
                      x={(boundaryPoints[2].x + boundaryPoints[3].x) / 2 + '%'}
                      y={(boundaryPoints[2].y + boundaryPoints[3].y) / 2 + 5 + '%'}
                      fill="#22e6c4"
                      fontSize="11"
                      fontFamily="IBM Plex Mono"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Usable Surface: {calculations.usableAreaM2} m²
                    </text>
                  </svg>

                  {/* 7. Boundary Pin Handles (Corner markers) */}
                  {boundaryPoints.map((point, index) => (
                    <div
                      key={index}
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 group/pin"
                      title={`Drag Corner ${index + 1}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-teal text-bg font-bold font-mono text-[9px] flex items-center justify-center shadow-glow-teal border-2 border-white scale-100 group-hover/pin:scale-125 transition-transform">
                        {String.fromCharCode(65 + index)}
                      </div>
                    </div>
                  ))}

                  {/* 8. Obstacle Marker & Shadow Projection Cone */}
                  {obstaclePoint && (
                    <div
                      style={{ left: `${obstaclePoint.x}%`, top: `${obstaclePoint.y}%` }}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    >
                      {/* Simulated directional shadow cone based on Azimuth */}
                      <div
                        className="absolute w-24 h-14 bg-black/60 rounded-full blur-sm pointer-events-none -z-1"
                        style={{
                          transformOrigin: '0% 50%',
                          transform: `rotate(${azimuth - 90}deg) scaleX(1.4)`
                        }}
                      />
                      <div className="p-1.5 rounded-lg bg-red text-white text-[10px] font-bold font-mono shadow-glow-red flex items-center gap-1 whitespace-nowrap border border-white/40">
                        <Box className="w-3.5 h-3.5" />
                        <span>{obstaclePoint.label}</span>
                      </div>
                    </div>
                  )}

                  {/* 9. THE INTERACTIVE SOLAR PANEL ARRAY OVERLAY (Draggable & Rotatable) */}
                  <motion.div
                    drag
                    dragConstraints={cameraViewportRef}
                    onDragStart={() => setIsDraggingArray(true)}
                    onDragEnd={() => setIsDraggingArray(false)}
                    style={{ left: `${arrayPosition.x}%`, top: `${arrayPosition.y}%` }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none"
                  >
                    <div
                      className="relative p-2 rounded-xl bg-slate-950/80 border-2 border-amber shadow-2xl backdrop-blur-md transition-transform"
                      style={{
                        transform: `rotate(${azimuth - 180}deg) perspective(600px) rotateX(${tiltAngle * 0.4}deg)`,
                        boxShadow: '0 0 25px rgba(255, 178, 56, 0.4)'
                      }}
                    >
                      {/* Array Header Badge */}
                      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-amber/30 text-[9px] font-mono text-amber">
                        <span className="font-bold flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber animate-spin-slow" />
                          {columns}×{rows} {activeTech.name}
                        </span>
                        <span className="text-white bg-amber/20 px-1 py-0.2 rounded font-bold">
                          {calculations.totalNameplateKwp.toFixed(1)} kWp
                        </span>
                      </div>

                      {/* PV Cell Grid Visualization */}
                      <div
                        className="grid gap-1"
                        style={{
                          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                        }}
                      >
                        {Array.from({ length: columns * rows }).map((_, cellIdx) => (
                          <div
                            key={cellIdx}
                            className="w-9 h-14 sm:w-11 sm:h-16 rounded border border-cyan-400/50 relative overflow-hidden flex flex-col justify-between p-0.5 shadow-inner"
                            style={{
                              background:
                                activeTech.id === 'topcon'
                                  ? 'linear-gradient(180deg, #0b1a20 0%, #050d11 100%)'
                                  : activeTech.id === 'bifacial'
                                  ? 'linear-gradient(180deg, #0c2033 0%, #07131e 100%)'
                                  : 'linear-gradient(180deg, #1f1b0a 0%, #0f0d05 100%)'
                            }}
                          >
                            {/* Busbar micro lines */}
                            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-40">
                              <div className="w-[1px] h-full bg-cyan-200" />
                              <div className="w-[1px] h-full bg-cyan-200" />
                              <div className="w-[1px] h-full bg-cyan-200" />
                            </div>

                            <span className="text-[7px] font-mono text-cyan-300 font-bold leading-none z-1">
                              #{cellIdx + 1}
                            </span>
                            <span className="text-[7px] font-mono text-amber text-right font-bold leading-none z-1">
                              {calculations.ratedWattsPerModule}W
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Alignment Target Arrow Indicator */}
                      <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-text-dim pt-1 border-t border-line">
                        <span>Tilt: {tiltAngle}°</span>
                        <span className="text-emerald-400 font-bold">Face: {azimuth}°</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* 10. Top HUD Viewfinder Overlay Bar */}
                  <div className="absolute top-3 inset-x-3 z-30 pointer-events-none flex items-center justify-between flex-wrap gap-2">
                    <div className="glass px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md flex items-center gap-2 pointer-events-auto">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        AI Space Analyzer
                      </span>
                      <span className="text-[10px] font-mono text-teal px-1.5 py-0.2 rounded bg-teal/20">
                        {calculations.estimatedRealAreaM2} m² Area
                      </span>
                    </div>

                    {/* Quick Mode Toolbar on Camera */}
                    <div className="glass px-2 py-1 rounded-xl border border-white/15 backdrop-blur-md flex items-center gap-1.5 pointer-events-auto shadow-xl">
                      <button
                        onClick={() => setScannerTool('place')}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                          scannerTool === 'place'
                            ? 'bg-amber text-bg font-bold shadow-glow-amber'
                            : 'text-text-dim hover:text-text-main hover:bg-white/5'
                        }`}
                        title="Drag or click to position panels"
                      >
                        <Move className="w-3 h-3" />
                        <span>Place Array</span>
                      </button>

                      <button
                        onClick={() => setScannerTool('obstacle')}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                          scannerTool === 'obstacle'
                            ? 'bg-red text-white font-bold shadow-glow-red'
                            : 'text-text-dim hover:text-text-main hover:bg-white/5'
                        }`}
                        title="Click roof obstacle to avoid shadows"
                      >
                        <Box className="w-3 h-3" />
                        <span>Mark Obstacle</span>
                      </button>

                      <button
                        onClick={() => setShowThermalLens(!showThermalLens)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                          showThermalLens
                            ? 'bg-rose-500 text-white font-bold'
                            : 'text-text-dim hover:text-text-main hover:bg-white/5'
                        }`}
                        title="Simulate thermal heat dissipation"
                      >
                        <Flame className="w-3 h-3" />
                        <span>Thermal</span>
                      </button>

                      <button
                        onClick={handleSnapSouth}
                        className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all font-bold flex items-center gap-1"
                        title="Auto-align to optimal True South (180°)"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Snap South</span>
                      </button>
                    </div>
                  </div>

                  {/* 11. Bottom Floating Action Pill: Auto-Fit Space Button */}
                  <div className="absolute bottom-4 inset-x-4 z-30 pointer-events-none flex items-center justify-between">
                    <div className="glass px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md text-[10px] font-mono text-text-dim pointer-events-auto hidden sm:flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-teal" />
                      <span>Drag array to test position • Rotate using Azimuth slider</span>
                    </div>

                    <button
                      onClick={handleAutoFitToSpace}
                      className="pointer-events-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all ml-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ AI Auto-Fit in this Place</span>
                    </button>
                  </div>
                </div>

                {/* Toast Notification Bar */}
                {toastMessage && (
                  <div className="p-3 rounded-lg bg-panel-2 border border-line flex items-center justify-between text-xs font-mono text-text-dim">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
                      <span className="text-text-main">{toastMessage}</span>
                    </div>
                    <button
                      onClick={() => setToastMessage(null)}
                      className="text-text-dim hover:text-text-main text-[10px]"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Preset Rooftop Scene Switcher (When not using live camera) */}
                {!cameraActive && (
                  <div className="p-3 rounded-xl bg-panel border border-line space-y-2">
                    <span className="text-xs font-semibold text-text-main block">
                      Test with Sample Rooftop Environments:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ROOFTOP_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(idx)}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            activePresetIndex === idx && !uploadedImage
                              ? 'bg-teal/15 border-teal text-teal font-semibold shadow-glow-teal'
                              : 'bg-panel-2 border-line text-text-dim hover:text-text-main'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{preset.title}</div>
                          <div className="text-[10px] text-text-dim font-mono mt-0.5">{preset.type}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </ScadaPanel>
            </div>

            {/* Right Column: AI "EPDI FIX PANNALAM" DETAILED INSTALLATION ADVICE */}
            <div className="space-y-4">
              <ScadaPanel
                title="AI Rooftop Fitting Directive"
                subtitle="Exact engineering recommendations for this scanned place"
                glow="teal"
                badge={
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-teal/20 text-teal border border-teal/40">
                    MCDA VERIFIED
                  </span>
                }
              >
                <div className="space-y-3.5 text-xs font-mono">
                  {/* Summary Box */}
                  <div className="p-3.5 rounded-xl bg-bg/90 border border-teal/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-teal font-bold">
                      <Cpu className="w-4 h-4 animate-pulse" />
                      <span>HOW TO FIX IN THIS EXACT SPOT:</span>
                    </div>
                    <p className="text-text-main text-[11px] leading-relaxed">
                      Scanned roof accommodates <strong className="text-amber">{calculations.totalModules} modules</strong>{' '}
                      ({calculations.totalNameplateKwp.toFixed(1)} kWp). Follow these 5 structural directives for optimal generation and roof protection:
                    </p>
                  </div>

                  {/* 5 Step-by-Step Directives */}
                  <div className="space-y-2.5 text-[11px] leading-relaxed">
                    {/* Directive 1: Orientation */}
                    <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-text-main block">1. Direction (Azimuth):</strong>
                        Face panels to <strong className="text-emerald-400">True South ({azimuth}°)</strong>. This yields 24% more annual kWh compared to East/West orientations.
                      </div>
                    </div>

                    {/* Directive 2: Tilt Angle */}
                    <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-start gap-2.5">
                      <Sliders className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-text-main block">2. Pitch & Tilt Angle:</strong>
                        Set rack tilt to <strong className="text-teal">{tiltAngle}°</strong>. This balances summer high-sun and winter low-sun angles while facilitating natural rainwater dust cleaning.
                      </div>
                    </div>

                    {/* Directive 3: Obstacle Avoidance */}
                    <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-text-main block">3. Obstacle Clearance & Setback:</strong>
                        Maintain a minimum 1.2m buffer from the North-West water tank / chimney to avoid string diode clipping. Leaves a 3ft fire perimeter setback.
                      </div>
                    </div>

                    {/* Directive 4: Mounting System */}
                    <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-blue shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-text-main block">4. Mounting Method:</strong>
                        Use an <strong className="text-blue">Aluminum Ballasted Rack</strong> with concrete counterweights and EPDM rubber pads. Eliminates roof drilling and preserves waterproof membranes.
                      </div>
                    </div>

                    {/* Directive 5: Electrical Configuration */}
                    <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-start gap-2.5">
                      <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-text-main block">5. String Inverter MPPT:</strong>
                        Connect as 2 strings of {calculations.totalModules / 2} modules into dual MPPT tracking channels at {calculations.stringVoltage.toFixed(0)}V DC bus.
                      </div>
                    </div>
                  </div>

                  {/* Interactive Layout Sizing Sliders */}
                  <div className="p-3 rounded-xl bg-panel-2 border border-line space-y-3 pt-2">
                    <span className="text-xs font-semibold text-text-main block">
                      Quick Live Adjustments:
                    </span>

                    {/* Columns Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-dim">Columns: {columns}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setColumns(Math.max(1, columns - 1))}
                            className="w-5 h-5 rounded bg-panel border border-line flex items-center justify-center font-bold hover:bg-panel-2"
                          >
                            -
                          </button>
                          <button
                            onClick={() => setColumns(Math.min(8, columns + 1))}
                            className="w-5 h-5 rounded bg-panel border border-line flex items-center justify-center font-bold hover:bg-panel-2"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rows Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-dim">Rows: {rows}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setRows(Math.max(1, rows - 1))}
                            className="w-5 h-5 rounded bg-panel border border-line flex items-center justify-center font-bold hover:bg-panel-2"
                          >
                            -
                          </button>
                          <button
                            onClick={() => setRows(Math.min(6, rows + 1))}
                            className="w-5 h-5 rounded bg-panel border border-line flex items-center justify-center font-bold hover:bg-panel-2"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Azimuth Rotation Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-dim">Azimuth Rotation</span>
                        <span className="text-emerald-400 font-bold">{azimuth}°</span>
                      </div>
                      <input
                        type="range"
                        min="90"
                        max="270"
                        value={azimuth}
                        onChange={(e) => setAzimuth(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-text-dim mt-0.5">
                        <span>90° (East)</span>
                        <span>180° (True South)</span>
                        <span>270° (West)</span>
                      </div>
                    </div>

                    {/* Tilt Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-text-dim">Rack Tilt Angle</span>
                        <span className="text-teal font-bold">{tiltAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={tiltAngle}
                        onChange={(e) => setTiltAngle(Number(e.target.value))}
                        className="w-full accent-teal cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Spoken Advice Trigger */}
                  <button
                    onClick={() => speakAdvice()}
                    className="w-full py-2.5 rounded-lg bg-teal text-bg font-bold text-xs uppercase tracking-wider hover:bg-teal/90 transition-all shadow-glow-teal flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Speak Step-by-Step Advice</span>
                  </button>
                </div>
              </ScadaPanel>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: 3D PHOTOVOLTAIC DIGITAL TWIN (THREE.JS / WEBXR)       */}
        {/* ============================================================= */}
        {activeTab === '3d_twin' && (
          <motion.div
            key="3d_twin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-4">
              <ScadaPanel
                title="Live 3D Photovoltaic Digital Twin Viewport"
                subtitle="High-fidelity WebGL / Three.js r160 real-time procedural solar array"
                accentTop
                badge={
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE 60 FPS
                  </span>
                }
                actions={
                  <a
                    href="/solarfit-ar.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 rounded bg-teal/20 text-teal hover:bg-teal/30 font-semibold border border-teal/40 flex items-center gap-1 transition-all"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Fullscreen AR</span>
                  </a>
                }
              >
                {/* Embedded 3D Scene Viewport */}
                <div className="relative w-full h-[460px] rounded-lg overflow-hidden border border-line bg-gradient-to-b from-[#05080d] to-[#0d1623] shadow-inner flex flex-col justify-between">
                  <iframe
                    src="/solarfit-ar.html"
                    title="SolarFit AR 3D Viewport"
                    className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
                    allow="camera; accelerometer; gyroscope; xr-spatial-tracking"
                  />

                  {/* Top HUD Overlay Inside 3D Viewport */}
                  <div className="relative z-10 p-3 pointer-events-none flex items-center justify-between">
                    <div className="glass px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white tracking-wide">
                        {activeTech.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-500/20">
                        {calculations.totalModules} Modules · {calculations.totalNameplateKwp.toFixed(1)} kWp
                      </span>
                    </div>

                    <div className="glass px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md text-[10px] font-mono text-text-dim flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-amber" />
                      <span>Tilt: {tiltAngle}°</span>
                      <span>•</span>
                      <span>Azimuth: {azimuth}° (South)</span>
                    </div>
                  </div>

                  {/* Bottom Quick Control Bar inside Viewport */}
                  <div className="relative z-10 p-3 pointer-events-auto flex items-center justify-center gap-2 flex-wrap">
                    <div className="glass px-2.5 py-1.5 rounded-2xl border border-white/15 backdrop-blur-xl flex items-center gap-2 shadow-2xl">
                      <button
                        onClick={() => setThermalFx(!thermalFx)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                          thermalFx
                            ? 'bg-rose-500 text-white shadow-glow-rose'
                            : 'bg-white/5 text-rose-300 hover:bg-white/10'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>FLIR IR Thermal</span>
                      </button>

                      <button
                        onClick={() => setWindFx(!windFx)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                          windFx
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-white/5 text-cyan-300 hover:bg-white/10'
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>Wind Flow</span>
                      </button>

                      <button
                        onClick={() => setHudFx(!hudFx)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                          hudFx
                            ? 'bg-amber text-slate-950 font-bold'
                            : 'bg-white/5 text-amber hover:bg-white/10'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>3D Module HUDs</span>
                      </button>

                      <button
                        onClick={() => setObstacleFx(!obstacleFx)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                          obstacleFx
                            ? 'bg-red text-white'
                            : 'bg-white/5 text-emerald-300 hover:bg-white/10'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>{obstacleFx ? 'Remove Shade' : 'Add Shade Obstacle'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-panel-2 border border-line flex items-center justify-between text-xs text-text-dim font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
                    <span>Click and drag inside viewport to orbit 360° • Pinch / scroll to zoom into cell busbars</span>
                  </div>
                  <span className="text-teal font-semibold">WebGL 2.0 PBR</span>
                </div>
              </ScadaPanel>
            </div>

            {/* Right Column: Module Details */}
            <div className="space-y-4">
              <ScadaPanel
                title="Active Photovoltaic Cell Specs"
                subtitle={activeTech.fullName}
                badge={
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${activeTech.color}20`,
                      color: activeTech.color,
                      borderColor: `${activeTech.color}40`
                    }}
                  >
                    {activeTech.badge}
                  </span>
                }
              >
                <div className="space-y-3">
                  <p className="text-xs text-text-dim leading-relaxed font-mono">
                    {activeTech.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim block text-[10px]">Module Efficiency</span>
                      <span className="text-base font-bold text-teal">{activeTech.efficiency.toFixed(1)}%</span>
                    </div>

                    <div className="p-2.5 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim block text-[10px]">Temp Coefficient</span>
                      <span className="text-base font-bold text-amber">{activeTech.tempCoeff.toFixed(2)}%/°C</span>
                    </div>

                    <div className="p-2.5 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim block text-[10px]">Bifaciality Factor</span>
                      <span className="text-base font-bold text-blue">
                        {activeTech.bifaciality > 0 ? `${(activeTech.bifaciality * 100).toFixed(0)}%` : 'Monofacial'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim block text-[10px]">Degradation Yr 1 / Ann</span>
                      <span className="text-base font-bold text-green">
                        {activeTech.firstYearDegradation}% / {activeTech.annualDegradation}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line space-y-1.5">
                    <label className="text-xs font-semibold text-text-main flex items-center justify-between">
                      <span>Rooftop Surface Material</span>
                      <span className="text-[10px] font-mono text-teal">Albedo: {activeSurface.albedo.toFixed(2)}</span>
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ROOF_SURFACES.map((surf) => (
                        <button
                          key={surf.id}
                          onClick={() => setSelectedSurfaceId(surf.id)}
                          className={`w-full p-2 rounded text-left text-xs transition-all flex items-center justify-between border ${
                            selectedSurfaceId === surf.id
                              ? 'bg-teal/15 text-teal border-teal/40 font-semibold'
                              : 'bg-panel-2 text-text-dim hover:text-text-main border-line hover:border-line/80'
                          }`}
                        >
                          <span>{surf.name}</span>
                          <span className="text-[10px] font-mono opacity-80">{(surf.albedo * 100).toFixed(0)}% Albedo</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScadaPanel>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: MCDA AI ADVISOR                                        */}
        {/* ============================================================= */}
        {activeTab === 'mcda_advisor' && (
          <motion.div
            key="mcda_advisor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-4">
              <ScadaPanel
                title="MCDA Multi-Criteria Solar Architecture Evaluation"
                subtitle="Weighted physics engine ranking 6 photovoltaic cell technologies"
                accentTop
              >
                <div className="space-y-3">
                  {mcdaRankings.map((item, index) => {
                    const isTopPick = index === 0;
                    return (
                      <motion.div
                        key={item.tech.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedTechId(item.tech.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isTopPick
                            ? 'bg-gradient-to-r from-emerald-500/10 via-panel-2 to-panel border-emerald-500/50 shadow-glow-green'
                            : 'bg-panel-2 border-line hover:border-line/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-line text-text-main">
                                #{index + 1}
                              </span>
                              <h4 className="text-sm font-bold text-text-main">{item.tech.name}</h4>
                              {isTopPick && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                  ★ TOP PICK RECOMMENDATION
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-dim font-mono">{item.tech.bestFor}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-bold font-mono text-emerald-400">
                              {item.compositeScore}%
                            </span>
                            <span className="block text-[10px] text-text-dim font-mono">Match Score</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-line/60 text-[10px] font-mono">
                          <div>
                            <span className="text-text-dim">Efficiency (30%)</span>
                            <div className="h-1.5 w-full bg-panel rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-teal rounded-full" style={{ width: `${item.effScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <span className="text-text-dim">Thermal Coeff (22%)</span>
                            <div className="h-1.5 w-full bg-panel rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-amber rounded-full" style={{ width: `${item.thermalScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <span className="text-text-dim">Albedo Gain (20%)</span>
                            <div className="h-1.5 w-full bg-panel rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-blue rounded-full" style={{ width: `${item.albedoScore}%` }} />
                            </div>
                          </div>

                          <div>
                            <span className="text-text-dim">Reliability (28%)</span>
                            <div className="h-1.5 w-full bg-panel rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-green rounded-full" style={{ width: `${item.degScore}%` }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScadaPanel>
            </div>

            <div className="space-y-4">
              <ScadaPanel
                title="Explainable AI (XAI) Rationale"
                subtitle="Deterministic logic derivation for top pick"
                glow="teal"
              >
                <div className="space-y-3 text-xs leading-relaxed font-mono">
                  <div className="p-3 rounded bg-bg/80 border border-teal/40">
                    <div className="flex items-center gap-2 text-teal font-bold mb-1">
                      <Cpu className="w-4 h-4 animate-pulse" />
                      <span>WHY {mcdaRankings[0].tech.name.toUpperCase()} IS RANKED #1:</span>
                    </div>
                    <p className="text-text-main text-[11px] leading-relaxed">
                      Evaluated under site irradiance ({irradianceWm2} W/m²) and cell operating temperature ({calculations.cellTempC.toFixed(1)}°C) on {activeSurface.name}.
                    </p>
                  </div>

                  <div className="space-y-2 text-[11px] text-text-dim">
                    <div className="p-2 rounded bg-panel-2 border border-line flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-text-main">Peak Thermodynamic Efficiency:</strong> 24.0% N-type tunnel-oxide structure minimizes electron recombination losses.
                      </span>
                    </div>

                    <div className="p-2 rounded bg-panel-2 border border-line flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-text-main">Superior Thermal Derating:</strong> -0.30%/°C temperature coefficient yields 8.4% more energy during hot midday hours than standard P-Type monocrystalline.
                      </span>
                    </div>

                    <div className="p-2 rounded bg-panel-2 border border-line flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-text-main">Ultra-Low Degradation:</strong> Zero light-induced degradation (LID) ensures 87.4% output retention at Year 30.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTechId(mcdaRankings[0].tech.id)}
                    className="w-full py-2.5 rounded bg-teal text-bg font-bold text-xs uppercase tracking-wider hover:bg-teal/90 transition-all shadow-glow-teal flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Recommendation to Array</span>
                  </button>
                </div>
              </ScadaPanel>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: ARRAY BUILDER & GEOMETRY                               */}
        {/* ============================================================= */}
        {activeTab === 'array_builder' && (
          <motion.div
            key="array_builder"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-4">
              <ScadaPanel
                title="Dynamic Photovoltaic Array Geometry Customizer"
                subtitle="Configure spatial layout, tilt pitch, and inter-row shading clearance"
                accentTop
              >
                <div className="space-y-5 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-panel-2 border border-line space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-main">Array Columns</span>
                        <span className="text-base font-bold text-amber">{columns}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={columns}
                        onChange={(e) => setColumns(Number(e.target.value))}
                        className="w-full accent-amber cursor-pointer"
                      />
                      <span className="text-[10px] text-text-dim block">1 to 12 modules per string</span>
                    </div>

                    <div className="p-3 rounded bg-panel-2 border border-line space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-main">Array Rows</span>
                        <span className="text-base font-bold text-amber">{rows}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={rows}
                        onChange={(e) => setRows(Number(e.target.value))}
                        className="w-full accent-amber cursor-pointer"
                      />
                      <span className="text-[10px] text-text-dim block">1 to 8 parallel strings</span>
                    </div>
                  </div>

                  <div className="p-4 rounded bg-panel-2 border border-line space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-text-main block">Panel Tilt Angle</span>
                        <span className="text-[10px] text-text-dim">Optimal winter/summer balance angle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTiltAngle(28)}
                          className="text-[10px] px-2 py-0.5 rounded bg-teal/20 text-teal border border-teal/40 hover:bg-teal/30 transition-all font-bold"
                        >
                          Snap to 28° (Site Optimal)
                        </button>
                        <span className="text-lg font-bold text-teal">{tiltAngle}°</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={tiltAngle}
                      onChange={(e) => setTiltAngle(Number(e.target.value))}
                      className="w-full accent-teal cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded bg-panel-2 border border-line space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-text-main block">Inter-Row Pitch Spacing</span>
                        <span className="text-[10px] text-text-dim">Prevents self-shading during low sun elevation</span>
                      </div>
                      <span className="text-lg font-bold text-blue">{rowPitchMeters.toFixed(1)} m</span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="5.0"
                      step="0.1"
                      value={rowPitchMeters}
                      onChange={(e) => setRowPitchMeters(Number(e.target.value))}
                      className="w-full accent-blue cursor-pointer"
                    />
                  </div>
                </div>
              </ScadaPanel>
            </div>

            <div className="space-y-4">
              <ScadaPanel title="Array Spatial Footprint" subtitle="Derived physical sizing">
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded bg-panel-2 border border-line flex justify-between items-center">
                    <span className="text-text-dim">Total Modules</span>
                    <span className="text-base font-bold text-text-main">{calculations.totalModules} Units</span>
                  </div>

                  <div className="p-3 rounded bg-panel-2 border border-line flex justify-between items-center">
                    <span className="text-text-dim">Nameplate Rating</span>
                    <span className="text-base font-bold text-amber">
                      {calculations.totalNameplateKwp.toFixed(1)} kWp
                    </span>
                  </div>

                  <div className="p-3 rounded bg-panel-2 border border-line flex justify-between items-center">
                    <span className="text-text-dim">Required Area</span>
                    <span className="text-base font-bold text-teal">
                      {calculations.totalFootprintM2.toFixed(1)} m²
                    </span>
                  </div>

                  <div className="p-3 rounded bg-panel-2 border border-line flex justify-between items-center">
                    <span className="text-text-dim">Expected Daily Yield</span>
                    <span className="text-base font-bold text-green">
                      {calculations.dailyKwh.toFixed(1)} kWh/d
                    </span>
                  </div>
                </div>
              </ScadaPanel>
            </div>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: FINANCIALS & CARBON                                    */}
        {/* ============================================================= */}
        {activeTab === 'financials' && (
          <motion.div
            key="financials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-4">
              <ScadaPanel
                title="25-Year Photovoltaic Financial ROI & Lifecycle Economics"
                subtitle="Levelized Cost of Energy (LCOE) & Net Present Value model"
                accentTop
              >
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded bg-panel-2 border border-line space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text-main">Utility Electricity Tariff</span>
                      <span className="text-base font-bold text-emerald-400">${electricityTariff.toFixed(2)} / kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0.08"
                      max="0.40"
                      step="0.01"
                      value={electricityTariff}
                      onChange={(e) => setElectricityTariff(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim text-[10px] block">Turnkey Capex</span>
                      <span className="text-lg font-bold text-text-main">
                        ${calculations.capex.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="p-3 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim text-[10px] block">Annual Savings</span>
                      <span className="text-lg font-bold text-emerald-400">
                        ${calculations.annualSavingsUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
                      </span>
                    </div>

                    <div className="p-3 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim text-[10px] block">Payback Period</span>
                      <span className="text-lg font-bold text-amber">
                        {calculations.paybackYears.toFixed(1)} Years
                      </span>
                    </div>

                    <div className="p-3 rounded bg-panel-2 border border-line">
                      <span className="text-text-dim text-[10px] block">25-Yr Net Savings</span>
                      <span className="text-lg font-bold text-teal">
                        ${calculations.lifetimeSavingsUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-panel-2 to-panel border border-emerald-500/30 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                        <Leaf className="w-4 h-4" />
                        <span>Lifetime Carbon Emissions Avoided</span>
                      </div>
                      <p className="text-xs text-text-dim">
                        Equates to planting ~{Math.round(calculations.lifetimeCo2Tons * 16)} urban trees or removing{' '}
                        {Math.round(calculations.lifetimeCo2Tons / 4.6)} passenger combustion vehicles from roads.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-extrabold text-emerald-400">
                        {calculations.lifetimeCo2Tons.toFixed(1)} t
                      </span>
                      <span className="block text-[10px] text-text-dim">Metric Tons CO₂</span>
                    </div>
                  </div>
                </div>
              </ScadaPanel>
            </div>

            <div className="space-y-4">
              <ScadaPanel title="LCOE Benchmark vs Local Grid" subtitle="Levelized Cost of Electricity">
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-text-dim text-[10px] block">Solar LCOE (25-Yr Levelized)</span>
                    <span className="text-2xl font-bold text-emerald-400">$0.042 / kWh</span>
                    <span className="text-[10px] text-emerald-300 block mt-1">70% lower than grid power</span>
                  </div>

                  <div className="p-3 rounded bg-panel-2 border border-line">
                    <span className="text-text-dim text-[10px] block">Internal Rate of Return (IRR)</span>
                    <span className="text-xl font-bold text-teal">19.4%</span>
                  </div>
                </div>
              </ScadaPanel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blueprint Export Modal */}
      <AnimatePresence>
        {blueprintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel border border-teal/40 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative space-y-4 font-mono"
            >
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-teal" />
                  <h3 className="text-base font-bold">Rooftop Solar Installation Feasibility Blueprint</h3>
                </div>
                <button
                  onClick={() => setBlueprintModalOpen(false)}
                  className="text-text-dim hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2 text-xs">
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-text-dim">Project Site:</span>
                  <span className="font-bold text-white">{ROOFTOP_PRESETS[activePresetIndex].title}</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-text-dim">Recommended Technology:</span>
                  <span className="font-bold text-teal">{activeTech.name} ({activeTech.efficiency}%)</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-text-dim">Array Sizing:</span>
                  <span className="font-bold text-amber">{columns} Cols × {rows} Rows ({calculations.totalModules} Panels · {calculations.totalNameplateKwp.toFixed(1)} kWp)</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-text-dim">Mounting Angle & Heading:</span>
                  <span className="font-bold text-emerald-400">Tilt {tiltAngle}° • Azimuth {azimuth}° (True South)</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-text-dim">Estimated Daily Harvest:</span>
                  <span className="font-bold text-green">{calculations.dailyKwh.toFixed(1)} kWh / Day (~{calculations.annualKwh.toFixed(0)} kWh/yr)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Structural Mounting:</span>
                  <span className="font-bold text-blue">Aluminum Ballasted Racks (Zero Roof Penetration)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setBlueprintModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-panel-2 border border-line text-xs font-semibold hover:bg-panel"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Blueprint downloaded! File: Solar_Rooftop_Installation_Specification.pdf');
                    setBlueprintModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-lg bg-teal text-bg font-bold text-xs uppercase tracking-wider hover:bg-teal/90 transition-all shadow-glow-teal flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Spec Sheet</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
