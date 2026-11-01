import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Video,
  VideoOff,
  SwitchCamera,
  Upload,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Sun,
  Compass,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Check,
  X,
  RotateCcw,
  Zap,
  ShieldCheck,
  Wrench,
  DollarSign
} from 'lucide-react';
import { SPACE_PRESETS, SpacePreset, FixMethod } from './spaceData';
import { sounds } from '../../lib/soundEffects';
import { api } from '../../services/api';

interface LiveSpaceScannerProps {
  onApplyConfig?: (config: {
    spaceId: string;
    fixMethodId: string;
    panelCount: number;
    capacityKw: number;
    dailyYieldKwh: number;
    monthlySavingsNum: number;
  }) => void;
  isCompact?: boolean;
}

export const LiveSpaceScanner: React.FC<LiveSpaceScannerProps> = ({
  onApplyConfig,
  isCompact = false
}) => {
  // Active Space & Fix Selection
  const [selectedSpace, setSelectedSpace] = useState<SpacePreset>(SPACE_PRESETS[0]);
  const [selectedFix, setSelectedFix] = useState<FixMethod>(SPACE_PRESETS[0].fixWays[0]);
  const [panelCount, setPanelCount] = useState<number>(4);
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Camera State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<any | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [checkedSteps, setCheckedSteps] = useState<{ [key: number]: boolean }>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync fix when space changes
  const handleSelectSpace = (space: SpacePreset) => {
    sounds.playClick(720);
    setSelectedSpace(space);
    setSelectedFix(space.fixWays[0]);
    setPanelCount(Math.min(panelCount, space.maxPanels) || Math.min(4, space.maxPanels));
    setCheckedSteps({});
  };

  const handleSelectFix = (fix: FixMethod) => {
    sounds.playClick(840);
    setSelectedFix(fix);
    setCheckedSteps({});
  };

  // Camera stream management
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    sounds.playScanBeep();
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setUploadedImage(null);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Camera not accessible on this device or permission was dismissed. Using high-definition space simulation!'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    sounds.playClick(440);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        stopCamera();
        sounds.playSuccessChime();
      };
      reader.readAsDataURL(file);

      // Trigger real backend CV terrain photo analysis
      setIsAnalyzingPhoto(true);
      api.analyzeSitePhoto(file)
        .then((analysis) => {
          setPhotoAnalysis(analysis);
          sounds.playSuccessChime();
        })
        .catch((err) => {
          console.warn('Backend photo analysis notice:', err);
        })
        .finally(() => {
          setIsAnalyzingPhoto(false);
        });
    }
  };

  const takeSnapshot = () => {
    sounds.playShutter();
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 300);
  };

  // Voice narration
  const handleVoiceAdvice = () => {
    const textToSpeak =
      lang === 'ta'
        ? `${selectedSpace.nameTa}. ${selectedFix.nameTa}. ${selectedFix.shortFixTa}. செலவு: ${selectedFix.costEstimate}. மாத சேமிப்பு: ${selectedFix.monthlySavings}.`
        : `${selectedSpace.name}. Recommended fix: ${selectedFix.name}. ${selectedFix.shortFix}. Estimated cost: ${selectedFix.costEstimate}. Monthly savings: ${selectedFix.monthlySavings}.`;

    sounds.speakAdvice(textToSpeak, lang);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 5000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Recalculated dynamic metrics based on panel count
  const calculatedCapacityKw = Number(
    ((selectedFix.capacityKw / 4) * Math.max(1, panelCount)).toFixed(1)
  );
  const calculatedDailyYieldKwh = Number(
    ((selectedFix.dailyYieldKwh / 4) * Math.max(1, panelCount)).toFixed(1)
  );
  const baseSavingsInt = parseInt(selectedFix.monthlySavings.replace(/[^0-9]/g, ''), 10) || 1200;
  const calculatedMonthlySavings = Math.round((baseSavingsInt / 4) * Math.max(1, panelCount));

  const handleApplyToDashboard = () => {
    sounds.playSuccessChime();
    if (onApplyConfig) {
      onApplyConfig({
        spaceId: selectedSpace.id,
        fixMethodId: selectedFix.id,
        panelCount,
        capacityKw: calculatedCapacityKw,
        dailyYieldKwh: calculatedDailyYieldKwh,
        monthlySavingsNum: calculatedMonthlySavings
      });
    }
  };

  return (
    <div
      className={`scada-panel overflow-hidden border-teal/40 glow-teal transition-all ${
        isFullscreen ? 'fixed inset-2 z-50 flex flex-col' : 'relative shadow-xl'
      }`}
    >
      {/* Snapshot Flash Overlay */}
      <AnimatePresence>
        {snapshotFlash && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="p-3 sm:p-4 bg-panel-2 border-b border-line flex flex-wrap items-center justify-between gap-3 relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center text-teal">
            <Camera className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5 font-mono">
                <span>AI CAMERA SPACE SCANNER & FIX STUDIO</span>
                <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
              </h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-teal/20 text-teal border border-teal/40">
                LIVE AR
              </span>
            </div>
            <p className="text-[11px] text-text-dim font-mono">
              {lang === 'ta'
                ? 'உங்கள் கேமராவை எந்த இடத்தில் காட்டினாலும் எளிய வழிமுறைகளை தரும்'
                : 'Point camera at any roof, balcony, wall, or porch for instant 1-tap solar fix recommendations'}
            </p>
          </div>
        </div>

        {/* Action Controls & Language Switch */}
        <div className="flex items-center gap-2">
          {/* Language Toggle (EN / TA) */}
          <button
            onClick={() => {
              sounds.playClick(600);
              setLang(lang === 'en' ? 'ta' : 'en');
            }}
            className="px-2.5 py-1 rounded bg-panel border border-line text-[11px] font-mono text-text-main hover:border-teal/50 transition-colors flex items-center gap-1 shadow-sm"
            title="Toggle English / தமிழ்"
          >
            <span className="text-teal font-bold">{lang === 'en' ? 'EN' : 'தமிழ்'}</span>
            <span className="text-text-dim text-[9px]">({lang === 'en' ? 'தமிழ்' : 'EN'})</span>
          </button>

          {/* Camera On / Off Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleCamera}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              cameraActive
                ? 'bg-red/20 text-red border border-red/40 hover:bg-red/30'
                : 'bg-teal text-bg hover:bg-teal/90 shadow-glow-teal'
            }`}
          >
            {cameraActive ? (
              <>
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Open Camera</span>
              </>
            )}
          </motion.button>

          {/* Flip Camera if active */}
          {cameraActive && (
            <button
              onClick={flipCamera}
              className="p-1.5 rounded bg-panel border border-line text-text-dim hover:text-text-main transition-colors"
              title="Flip Camera (Front/Rear)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {/* Upload Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded bg-panel border border-line text-text-dim hover:text-teal hover:border-teal/50 transition-colors"
            title="Upload Photo of your Roof / Balcony"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-panel border border-line text-text-dim hover:text-text-main transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Place Presets Strip (6 Instant 1-tap options) */}
      <div className="px-3 py-2 bg-panel border-b border-line overflow-x-auto no-scroll flex items-center gap-2">
        <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3 text-teal" />
          <span>{lang === 'ta' ? 'இடங்கள்:' : 'Spaces:'}</span>
        </span>
        {SPACE_PRESETS.map((preset) => {
          const isSelected = selectedSpace.id === preset.id;
          return (
            <motion.button
              key={preset.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectSpace(preset)}
              className={`px-2.5 py-1 rounded-full text-xs font-mono shrink-0 flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-teal text-bg font-bold shadow-glow-teal'
                  : 'bg-panel-2 border border-line text-text-dim hover:text-text-main hover:border-teal/40'
              }`}
            >
              <span>{preset.icon}</span>
              <span>{lang === 'ta' ? preset.nameTa : preset.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Main Scanner Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-[380px] relative">
        {/* Left: Viewport (Camera Stream OR Realistic Simulation) */}
        <div className="lg:col-span-7 bg-black relative overflow-hidden flex items-center justify-center min-h-[300px] lg:min-h-[440px]">
          {/* Active Camera Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              cameraActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Uploaded Image or Preset Simulated Scene */}
          {!cameraActive && (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700"
              style={{
                background: uploadedImage
                  ? `url(${uploadedImage}) center/cover no-repeat`
                  : selectedSpace.mockBgImage
              }}
            >
              {/* Photorealistic grid overlay pattern to make it look like a physical structure */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(34,230,196,0.3) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
            </div>
          )}

          {/* Camera Error / Status Notification */}
          {cameraError && !cameraActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 inset-x-3 z-30 p-2 rounded bg-bg/90 border border-amber/40 text-[11px] font-mono text-amber flex items-center gap-2 shadow-lg"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
              <button
                onClick={() => setCameraError(null)}
                className="ml-auto text-text-dim hover:text-text-main"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Live AR Target HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
            {/* Top HUD: Detected Surface, Light Lux & Heading */}
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 rounded bg-bg/85 backdrop-blur-md border border-teal/40 font-mono text-[10px] space-y-1 shadow-md">
                <div className="flex items-center gap-1.5 text-teal font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
                  <span>
                    {cameraActive
                      ? 'AI SURFACE TRACKING: ACTIVE'
                      : 'SIMULATED ENVIRONMENT: ACTIVE'}
                  </span>
                </div>
                <div className="text-text-main font-semibold text-xs flex items-center gap-1">
                  <span>{selectedSpace.icon}</span>
                  <span>{lang === 'ta' ? selectedSpace.nameTa : selectedSpace.name}</span>
                </div>
                <div className="text-text-dim flex items-center gap-2 text-[10px]">
                  <span>Est. Area: {selectedSpace.areaSqFt} sq.ft</span>
                  <span>•</span>
                  <span>Max Panels: {selectedSpace.maxPanels}</span>
                </div>
              </div>

              {/* Live Solar Sensor Dial */}
              <div className="p-2 rounded bg-bg/85 backdrop-blur-md border border-line font-mono text-[10px] space-y-1 shadow-md text-right">
                <div className="flex items-center justify-end gap-1 text-amber font-semibold">
                  <Sun className="w-3 h-3 text-amber animate-spin-slow" />
                  <span>{selectedSpace.lux} W/m²</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-teal">
                  <Compass className="w-3 h-3" />
                  <span>{selectedSpace.heading}</span>
                </div>
                <div className="text-text-dim">Tilt: {selectedSpace.tiltAngle}°</div>
              </div>
            </div>

            {/* Center AR Virtual Solar Panels Overlay (Changes dynamically with selected fix!) */}
            <div className="relative my-auto flex flex-col items-center justify-center">
              {/* Reticle / Crosshair */}
              <div className="w-48 h-48 border border-dashed border-teal/30 rounded-2xl flex items-center justify-center relative">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-teal" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-teal" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-teal" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-teal" />

                {/* AR Dynamic Solar Array Representation */}
                <motion.div
                  key={`${selectedFix.id}-${panelCount}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative p-2"
                  style={{
                    perspective: 600,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Pergola Pillars Visualization */}
                  {selectedFix.arVisualType === 'pergola' && (
                    <div className="absolute -bottom-8 inset-x-2 flex justify-between pointer-events-none opacity-80">
                      <div className="w-1.5 h-10 bg-teal/60 rounded-sm shadow-sm" />
                      <div className="w-1.5 h-10 bg-teal/60 rounded-sm shadow-sm" />
                    </div>
                  )}

                  {/* Balcony Railing Hooks Visualization */}
                  {selectedFix.arVisualType === 'balcony_hook' && (
                    <div className="absolute -top-4 inset-x-4 flex justify-between pointer-events-none">
                      <div className="w-2.5 h-4 border-2 border-green/80 rounded-t-full border-b-0" />
                      <div className="w-2.5 h-4 border-2 border-green/80 rounded-t-full border-b-0" />
                    </div>
                  )}

                  {/* Array of Panels */}
                  <div
                    className="grid gap-1.5 p-2 rounded-lg bg-panel/70 border border-teal/60 shadow-2xl backdrop-blur-sm"
                    style={{
                      gridTemplateColumns:
                        panelCount === 1
                          ? 'repeat(1, 1fr)'
                          : panelCount <= 4
                          ? 'repeat(2, 1fr)'
                          : 'repeat(4, 1fr)',
                      transform:
                        selectedFix.arVisualType === 'tilt_rack'
                          ? 'rotateX(28deg) rotateY(-8deg)'
                          : selectedFix.arVisualType === 'pergola'
                          ? 'rotateX(15deg) translateY(-8px)'
                          : selectedFix.arVisualType === 'wall_awning'
                          ? 'rotateX(48deg)'
                          : selectedFix.arVisualType === 'balcony_hook'
                          ? 'rotateX(65deg)'
                          : 'rotateX(10deg)'
                    }}
                  >
                    {Array.from({ length: panelCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-14 rounded-sm bg-gradient-to-br from-teal/30 via-panel to-teal/20 border border-teal/70 relative overflow-hidden flex flex-col justify-between p-0.5 shadow-md group"
                      >
                        {/* Busbar grid lines */}
                        <div className="absolute inset-0 flex justify-evenly opacity-30 pointer-events-none">
                          <div className="w-px bg-teal" />
                          <div className="w-px bg-teal" />
                          <div className="w-px bg-teal" />
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-evenly opacity-30 pointer-events-none">
                          <div className="h-px bg-teal" />
                          <div className="h-px bg-teal" />
                        </div>
                        <div className="text-[7px] font-mono text-teal/80 font-bold">400W</div>
                        <div className="text-[6px] font-mono text-amber self-end">⚡</div>
                      </div>
                    ))}
                  </div>

                  {/* Fix Way Tag Label under panels */}
                  <div className="mt-2 text-center">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-bg/90 border border-teal/40 text-teal shadow-md inline-block">
                      {selectedFix.name} ({calculatedCapacityKw} kW)
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom HUD: Live Action Quick Bar on Camera */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono text-text-dim bg-bg/80 px-2 py-1 rounded border border-line">
                <span>Touch / Tap any fix method on the right to preview</span>
              </div>

              {cameraActive && (
                <button
                  onClick={takeSnapshot}
                  className="px-3 py-1 rounded bg-teal/20 border border-teal/40 text-teal text-[11px] font-mono hover:bg-teal hover:text-bg transition-colors flex items-center gap-1 shadow-sm pointer-events-auto"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture AR</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: How to Fix - Short & Interactive Solutions */}
        <div className="lg:col-span-5 p-4 sm:p-5 bg-panel-2 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-line overflow-y-auto max-h-[580px] custom-scrollbar">
          {/* Section Title */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-teal uppercase tracking-widest flex items-center gap-1">
                <Wrench className="w-3 h-3 text-teal" />
                <span>{lang === 'ta' ? 'எளிய பொருத்தும் முறைகள்' : 'EFFECTIVE WAYS TO FIX'}</span>
              </span>

              {/* Text-to-Speech Audio Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceAdvice}
                className={`p-1.5 rounded-full border text-xs flex items-center gap-1 transition-all ${
                  isSpeaking
                    ? 'bg-teal text-bg border-teal animate-pulse'
                    : 'bg-panel border-line text-text-dim hover:text-teal hover:border-teal/50'
                }`}
                title="Speak Short Advice Aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">
                  {isSpeaking ? 'Speaking…' : 'Audio Guide'}
                </span>
              </motion.button>
            </div>

            <h4 className="text-base font-bold text-text-main mt-1">
              {lang === 'ta'
                ? `${selectedSpace.nameTa}க்கு சிறந்த வழிகள்`
                : `Best Ways to Install on ${selectedSpace.name}`}
            </h4>
          </div>

          {/* Fix Ways Selector Tabs */}
          <div className="space-y-2">
            {selectedSpace.fixWays.map((fix) => {
              const isSelected = selectedFix.id === fix.id;
              return (
                <motion.div
                  key={fix.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectFix(fix)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-panel border-teal glow-teal shadow-md'
                      : 'bg-panel/40 border-line hover:border-line/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-text-main flex items-center gap-1.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-line shrink-0" />
                      )}
                      <span>{lang === 'ta' ? fix.nameTa : fix.name}</span>
                    </span>

                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${fix.tagColor}`}
                    >
                      {fix.tag}
                    </span>
                  </div>

                  {/* Short Fix Description */}
                  <p className="text-[11px] text-text-dim font-mono mt-1.5 leading-relaxed pl-5">
                    {lang === 'ta' ? fix.shortFixTa : fix.shortFix}
                  </p>

                  {/* Metrics Badges */}
                  <div className="flex items-center gap-3 mt-2 pl-5 text-[10px] font-mono text-text-dim">
                    <span className="text-teal font-bold">{fix.capacityKw} kW</span>
                    <span>•</span>
                    <span className="text-amber font-semibold">{fix.costEstimate}</span>
                    <span>•</span>
                    <span className="text-green font-semibold">Saves {fix.monthlySavings}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Real AI CV Terrain Diagnostics when photo uploaded */}
          {isAnalyzingPhoto && (
            <div className="p-3 rounded-lg bg-teal/10 border border-teal/40 flex items-center gap-2 text-xs font-mono text-teal">
              <div className="w-3.5 h-3.5 border-2 border-teal border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Analyzing uploaded terrain image via backend AI Computer Vision...</span>
            </div>
          )}
          {photoAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-teal/10 border border-teal/50 space-y-2 text-xs font-mono shadow-md"
            >
              <div className="flex items-center justify-between text-teal font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI CV Terrain Diagnostics
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal/20 border border-teal/40 text-teal font-bold">
                  {photoAnalysis.suitability_verdict}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-teal/20">
                <div>Soil: <span className="text-text-main font-semibold capitalize">{String(photoAnalysis.detected_soil_type || '').replace('_', ' ')}</span></div>
                <div>Slope: <span className="text-text-main font-semibold">{photoAnalysis.estimated_slope_deg}°</span></div>
                <div>Vegetation: <span className="text-text-main font-semibold">{photoAnalysis.vegetation_coverage_pct}%</span></div>
                <div>Shading Loss: <span className="text-text-main font-semibold">{photoAnalysis.shading_obstruction_pct}%</span></div>
              </div>
            </motion.div>
          )}

          {/* Interactive Panel Quantity Slider */}
          <div className="p-3 rounded-lg bg-panel border border-line space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-dim flex items-center gap-1">
                <span>{lang === 'ta' ? 'பேனல்கள் எண்ணிக்கை:' : 'Solar Panel Count:'}</span>
                <span className="font-bold text-teal">{panelCount} Panels</span>
              </span>
              <span className="text-amber font-bold">{calculatedCapacityKw} kW Total</span>
            </div>

            <input
              type="range"
              min="1"
              max={selectedSpace.maxPanels}
              value={panelCount}
              onChange={(e) => {
                sounds.playClick(500 + Number(e.target.value) * 30);
                setPanelCount(Number(e.target.value));
              }}
              className="w-full accent-teal h-1.5 bg-line rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[9px] font-mono text-text-dim">
              <span>1 Panel (400W)</span>
              <span>
                Max: {selectedSpace.maxPanels} ({selectedSpace.areaSqFt} sq.ft)
              </span>
            </div>
          </div>

          {/* Short 3-Step Interactive Installation Checklist */}
          <div className="p-3 rounded-lg bg-panel border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider">
                {lang === 'ta' ? '3 எளிய படிகள் (3-Step Fix):' : '3-STEP FAST INSTALL GUIDE:'}
              </span>
              <span className="text-[10px] font-mono text-teal">
                ⏱ {selectedFix.installDifficulty}
              </span>
            </div>

            <div className="space-y-1.5">
              {(lang === 'ta' ? selectedFix.stepsTa : selectedFix.steps).map((step, idx) => {
                const isDone = !!checkedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      sounds.playClick(900);
                      setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
                    }}
                    className={`p-2 rounded border text-xs font-mono flex items-start gap-2 cursor-pointer transition-colors ${
                      isDone
                        ? 'bg-teal/10 border-teal/40 text-teal line-through'
                        : 'bg-panel-2 border-line text-text-main hover:border-teal/30'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        isDone ? 'bg-teal border-teal text-bg' : 'border-line'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-tight">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Call to Action: Apply to Dashboard */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApplyToDashboard}
              className="w-full py-2.5 rounded bg-teal text-bg font-bold font-mono text-xs uppercase tracking-wider hover:bg-teal/90 transition-all flex items-center justify-center gap-2 shadow-glow-teal"
            >
              <Zap className="w-4 h-4" />
              <span>
                {lang === 'ta'
                  ? `இந்த தீர்வை செயல்படுத்து (₹${calculatedMonthlySavings.toLocaleString()}/மாதம் சேமிப்பு)`
                  : `Apply This Fix (Saves ₹${calculatedMonthlySavings.toLocaleString()}/mo)`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
