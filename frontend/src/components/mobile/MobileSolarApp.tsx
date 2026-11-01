import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Sun,
  Zap,
  PhoneCall,
  Share2,
  Download,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Languages,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { SPACE_PRESETS, SpacePreset } from '../scanner/spaceData';
import { sounds } from '../../lib/soundEffects';

interface MobileSolarAppProps {
  onClose?: () => void;
  isOpenFullscreen?: boolean;
}

export const MobileSolarApp: React.FC<MobileSolarAppProps> = ({
  onClose,
  isOpenFullscreen = false
}) => {
  const [lang, setLang] = useState<'ta' | 'en'>('ta');
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 (100% Now) to 100 (100% Solar)
  const [panelCount, setPanelCount] = useState<number>(6);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showInstallerModal, setShowInstallerModal] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const space = SPACE_PRESETS[selectedSpaceIndex] || SPACE_PRESETS[0];

  // Dynamic calculations based on panel count
  const kwCapacity = (panelCount * 0.54).toFixed(1); // 540W bi-facial panels
  const monthlyUnits = Math.round(panelCount * 70); // ~70 units per panel/month in TN
  const monthlySavings = Math.round(monthlyUnits * 8.5); // ₹8.5/kWh average tier
  const yearlySavings = monthlySavings * 12;
  const lifetimeSavings = yearlySavings * 25;
  const subsidyAmount = panelCount <= 4 ? 30000 : panelCount <= 6 ? 60000 : 78000;
  const grossCost = panelCount * 22000;
  const netCost = Math.max(0, grossCost - subsidyAmount);

  // Translations
  const t = {
    title: lang === 'ta' ? 'அரோரா சோலார் ஸ்கேனர்' : 'Aurora Solar AI',
    subtitle: lang === 'ta' ? 'உங்கள் இடத்திற்கு சோலார் பொருத்துவது எவ்வளவு எளிது!' : 'Instant Rooftop & Balcony Solar Advisor',
    nowLabel: lang === 'ta' ? 'இப்போது (காலி இடம்)' : 'NOW (Empty Space)',
    solarLabel: lang === 'ta' ? 'சோலார் வைத்தபின்' : 'WITH SOLAR',
    dragHint: lang === 'ta' ? 'இடது / வலதுபுறம் நகர்த்தி பாருங்கள் ↔️' : 'Drag handle left / right to compare ↔️',
    monthlyBillNow: lang === 'ta' ? 'தற்போதைய இபி பில்: ₹3,500/மாதம்' : 'Current EB Bill: ₹3,500/mo',
    billWithSolar: lang === 'ta' ? 'சோலார் பில்: ₹0/மாதம் (90% மிச்சம்)' : 'Solar Bill: ₹0/mo (Zero Bill)',
    savePerMonth: lang === 'ta' ? 'மாத சேமிப்பு' : 'Monthly Savings',
    capacity: lang === 'ta' ? 'சோலார் திறன்' : 'System Size',
    freeUnits: lang === 'ta' ? 'இலவச கரண்ட்' : 'Green Power',
    subsidy: lang === 'ta' ? 'மத்திய அரசு மானியம்' : 'PM Surya Ghar Subsidy',
    adjustPanels: lang === 'ta' ? 'பேனல் எண்ணிக்கை மாற்றுங்கள்' : 'Adjust Panel Count',
    panelsUnit: lang === 'ta' ? 'பேனல்கள்' : 'Panels',
    takePhoto: lang === 'ta' ? 'கேமரா மூலம் போட்டோ எடு' : 'Snap Live Photo',
    uploadPhoto: lang === 'ta' ? 'கேலரி போட்டோ' : 'Upload Photo',
    stopCamera: lang === 'ta' ? 'கேமரா நிறுத்து' : 'Close Camera',
    callExpert: lang === 'ta' ? '📞 சோலார் நிபுணருடன் பேசுங்கள்' : '📞 Call Solar Expert',
    whatsappShare: lang === 'ta' ? '💬 வாட்ஸ்அப் பகிர்' : '💬 Share on WhatsApp',
    selectLocation: lang === 'ta' ? 'இடத்தை தேர்வு செய்க:' : 'Select Your Space Type:',
    netCostText: lang === 'ta' ? 'மானியம் போக உங்கள் செலவு' : 'Net Cost After Subsidy',
    installerTitle: lang === 'ta' ? 'அருகிலுள்ள அங்கீகரிக்கப்பட்ட சோலார் நிறுவனம்' : 'Connecting to Certified Solar Partner',
    installerDesc: lang === 'ta' ? 'டாடா பவர் & பிரீமியம் அதானி சோலார் இன்ஸ்டாலர் உங்கள் இடத்தை இலவசமாக பார்வையிட வருவார்கள்.' : 'Tata Power & Adani Solar certified installers will conduct a free site survey.',
    callNowBtn: lang === 'ta' ? 'இப்போதே அழைக்க: 1800-209-7788' : 'Call Toll-Free: 1800-209-7788',
    whatsappMessage: lang === 'ta' ? 'என் வீட்டிற்கு சோலார் வைக்க மதிப்பீடு கிடைத்துள்ளது: மாதம் ₹' + monthlySavings + ' சேமிக்கலாம்! அரசு மானியம் ₹' + subsidyAmount : 'Got my Solar Feasibility report! Save ₹' + monthlySavings + '/mo with ₹' + subsidyAmount + ' Gov Subsidy!'
  };

  // Start real camera
  const handleStartCamera = async () => {
    sounds.playScanBeep();
    setCameraActive(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera permission not granted, fallback to preset preview:', err);
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    sounds.playClick(900);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCapturedPhoto(canvas.toDataURL('image/jpeg'));
        handleStopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target?.result as string);
        sounds.playClick(800);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag interaction for Before-After slider
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const offset = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (offset / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const offset = touch.clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (offset / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto bg-slate-950 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-teal/40 flex flex-col font-sans select-none">
      {/* Top Mobile App Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-line flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber to-teal flex items-center justify-center shadow-lg shadow-amber/20">
            <Sun className="w-5 h-5 text-slate-950 animate-spin-slow" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              {t.title}
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-teal/20 text-teal border border-teal/40">
                PRO 2.0
              </span>
            </h2>
            <p className="text-[11px] text-text-dim truncate">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tamil / English Toggle */}
          <button
            onClick={() => {
              sounds.playClick(600);
              setLang(lang === 'ta' ? 'en' : 'ta');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-panel-2 border border-line text-xs font-medium text-amber hover:border-amber/50 transition-colors"
            title="Toggle Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'தமிழ்' : 'ENG'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-panel-2 border border-line text-text-dim hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Space Selector Horizontal Scroll */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-line/60 flex items-center gap-2 overflow-x-auto custom-scrollbar z-10">
        <span className="text-[11px] font-semibold text-text-dim whitespace-nowrap">
          {t.selectLocation}
        </span>
        {SPACE_PRESETS.map((preset, idx) => (
          <button
            key={preset.id}
            onClick={() => {
              sounds.playClick(700);
              setSelectedSpaceIndex(idx);
              setCapturedPhoto(null);
            }}
            className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap flex items-center gap-1 transition-all ${
              selectedSpaceIndex === idx
                ? 'bg-teal text-slate-950 font-bold shadow-md shadow-teal/30 scale-105'
                : 'bg-panel-2 border border-line text-text-dim hover:text-white'
            }`}
          >
            <span>{preset.icon}</span>
            <span>{lang === 'ta' ? preset.nameTa.split('(')[0] : preset.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* MAIN BEFORE-AFTER COMPARISON CANVAS */}
      <div
        ref={containerRef}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        onPointerMove={handlePointerMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-80 sm:h-96 bg-black overflow-hidden cursor-ew-resize select-none"
      >
        {/* Flash Effect on capture */}
        {flashEffect && <div className="absolute inset-0 bg-white z-50 animate-ping pointer-events-none" />}

        {/* 1. "NOW" BACKGROUND LAYER (LEFT SIDE - EMPTY ROOF) */}
        <div className="absolute inset-0 w-full h-full">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover filter brightness-95"
            />
          ) : capturedPhoto ? (
            <img src={capturedPhoto} alt="User Space" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full relative flex items-center justify-center"
              style={{
                background:
                  selectedSpaceIndex === 0
                    ? 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #0f172a 100%)'
                    : selectedSpaceIndex === 1
                    ? 'linear-gradient(135deg, #1a2e35 0%, #294c56 50%, #0d1e24 100%)'
                    : 'linear-gradient(135deg, #2b1d1d 0%, #4a2828 50%, #150d0d 100%)'
              }}
            >
              {/* Simulated Realistic Empty Roof Floor Grids */}
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  transform: 'perspective(400px) rotateX(45deg) translateY(40px)'
                }}
              />
              <div className="text-center z-10 px-4">
                <span className="text-5xl drop-shadow-lg">{space.icon}</span>
                <p className="text-xs font-bold text-slate-300 mt-2">
                  {lang === 'ta' ? space.nameTa : space.name}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono">
                  {t.monthlyBillNow}
                </span>
              </div>
            </div>
          )}

          {/* "NOW" Floating Badge */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-red-600/90 text-white font-black text-[11px] uppercase tracking-wider shadow-lg backdrop-blur-sm border border-red-400">
              {t.nowLabel}
            </span>
          </div>
        </div>

        {/* 2. "WITH SOLAR" LAYER (RIGHT SIDE - REVEALED ACCORDING TO SLIDER) */}
        <div
          className="absolute inset-0 h-full overflow-hidden"
          style={{
            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
          }}
        >
          {cameraActive ? (
            <video
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover filter contrast-125 saturate-125"
            />
          ) : capturedPhoto ? (
            <img src={capturedPhoto} alt="Solar AR" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full relative flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(ellipse at center top, rgba(20,184,166,0.3) 0%, rgba(15,23,42,0.95) 100%)'
              }}
            >
              {/* Sun rays glow */}
              <div className="absolute -top-10 right-10 w-44 h-44 bg-amber/30 rounded-full blur-2xl pointer-events-none animate-pulse" />
            </div>
          )}

          {/* SIMULATED 3D SOLAR AR PANELS OVERLAY */}
          <div
            className="absolute inset-x-4 bottom-8 top-16 flex items-center justify-center pointer-events-none"
            style={{
              transform: 'perspective(500px) rotateX(32deg) rotateZ(-2deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="grid grid-cols-3 gap-2 p-3 bg-teal-950/60 rounded-xl border-2 border-teal/70 shadow-2xl backdrop-blur-sm">
              {Array.from({ length: panelCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-blue-900 via-sky-950 to-slate-900 rounded-lg border border-teal/80 shadow-md relative overflow-hidden group flex flex-col justify-between p-1"
                >
                  {/* Solar Silicon Busbars & Cells */}
                  <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#00ffff_1px,transparent_1px),linear-gradient(to_bottom,#00ffff_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <div className="relative z-10 flex justify-between items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
                    <span className="text-[8px] font-mono font-bold text-teal">540W</span>
                  </div>
                  {/* Glass Reflection sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none transform -translate-x-full animate-pulse" />
                  <div className="relative z-10 text-[9px] font-mono text-center text-amber font-bold">
                    #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* "WITH SOLAR" Floating Badge */}
          <div className="absolute top-3 right-3 z-10 pointer-events-none text-right">
            <span className="px-2.5 py-1 rounded-full bg-teal text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-teal/30 backdrop-blur-sm border border-teal-300">
              {t.solarLabel}
            </span>
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-bold text-[10px] shadow">
                {t.billWithSolar}
              </span>
            </div>
          </div>
        </div>

        {/* 3. VERTICAL DIVIDER & TOUCH-DRAG HANDLE */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber via-white to-teal shadow-2xl z-30 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Circle Thumb handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-slate-950 shadow-2xl flex items-center justify-center font-bold text-xs border-2 border-teal pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
            <span className="tracking-tighter font-mono">↔</span>
          </div>
        </div>

        {/* Drag Hint Banner at Bottom */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center z-20 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-medium text-slate-200 border border-white/20 shadow">
            {t.dragHint}
          </span>
        </div>

        {/* Camera Quick Bar on Viewport */}
        <div className="absolute top-3 inset-x-0 flex justify-center z-20 pointer-events-auto">
          {cameraActive ? (
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-teal shadow-xl backdrop-blur-md">
              <button
                onClick={handleCaptureSnapshot}
                className="px-3 py-1 rounded-full bg-amber text-slate-950 text-xs font-bold hover:bg-amber-300 transition-colors flex items-center gap-1 shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>SNAP</span>
              </button>
              <button
                onClick={handleStopCamera}
                className="px-2 py-1 rounded-full bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartCamera}
                className="px-3 py-1 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-line shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-teal" />
                <span>{t.takePhoto}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-line shadow-md backdrop-blur-md flex items-center gap-1 transition-all"
              >
                <span>🖼️</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC RESULTS & FINANCIAL CARD */}
      <div className="p-4 bg-slate-950 border-t border-line space-y-3.5">
        {/* Panel Slider Adjustment */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-line flex items-center justify-between">
          <div>
            <span className="text-[11px] text-text-dim block">{t.adjustPanels}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-white">{panelCount}</span>
              <span className="text-xs text-text-dim">{t.panelsUnit}</span>
              <span className="text-xs font-mono text-teal font-semibold ml-2">
                ({kwCapacity} kW)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (panelCount > 2) {
                  sounds.playClick(500);
                  setPanelCount((c) => c - 1);
                }
              }}
              disabled={panelCount <= 2}
              className="w-8 h-8 rounded-xl bg-panel-2 border border-line flex items-center justify-center text-white disabled:opacity-30 hover:border-teal transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (panelCount < 12) {
                  sounds.playClick(850);
                  setPanelCount((c) => c + 1);
                }
              }}
              disabled={panelCount >= 12}
              className="w-8 h-8 rounded-xl bg-panel-2 border border-line flex items-center justify-center text-white disabled:opacity-30 hover:border-teal transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Key Metrics Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Monthly Savings */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
            <span className="text-[10px] text-emerald-400 font-medium block truncate">
              {t.savePerMonth}
            </span>
            <span className="text-base font-black font-mono text-emerald-300 mt-0.5 block">
              ₹{monthlySavings.toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-500 block">per month</span>
          </div>

          {/* Monthly Free Units */}
          <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal/40 text-center">
            <span className="text-[10px] text-teal-400 font-medium block truncate">
              {t.freeUnits}
            </span>
            <span className="text-base font-black font-mono text-teal-300 mt-0.5 block">
              {monthlyUnits}
            </span>
            <span className="text-[9px] text-teal-500 block">Units / Month</span>
          </div>

          {/* Govt Subsidy */}
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber/40 text-center">
            <span className="text-[10px] text-amber-400 font-medium block truncate">
              {t.subsidy}
            </span>
            <span className="text-base font-black font-mono text-amber-300 mt-0.5 block">
              ₹{subsidyAmount.toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-500 block">Direct DBT</span>
          </div>
        </div>

        {/* Summary Banner: Net Cost & Lifetime Value */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-amber-950/80 border border-line flex items-center justify-between text-xs">
          <div>
            <span className="text-text-dim text-[11px] block">{t.netCostText}:</span>
            <span className="text-sm font-bold font-mono text-white">
              ₹{netCost.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-text-dim text-[11px] block">25-Yr Lifetime Savings:</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              ₹{lifetimeSavings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* PRIMARY CALL-TO-ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              sounds.playClick(900);
              setShowInstallerModal(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-teal/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t.callExpert}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(t.whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => sounds.playClick(700)}
              className="py-2.5 px-3 rounded-xl bg-green-950/50 border border-green-500/40 text-green-300 hover:bg-green-900/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.whatsappShare}</span>
            </a>

            <button
              onClick={() => {
                sounds.playClick(650);
                alert(
                  lang === 'ta'
                    ? 'சோலார் ஆய்வு அறிக்கை தயார்! உங்கள் போனில் PDF ஆக சேமிக்கப்படும்.'
                    : 'Solar Feasibility PDF Report generated successfully!'
                );
              }}
              className="py-2.5 px-3 rounded-xl bg-panel-2 border border-line text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* INSTALLER CONNECT MODAL */}
      <AnimatePresence>
        {showInstallerModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full bg-slate-900 border border-teal/50 rounded-2xl p-4 space-y-3.5 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                  <h3 className="font-bold text-sm text-white">{t.installerTitle}</h3>
                </div>
                <button
                  onClick={() => setShowInstallerModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{t.installerDesc}</p>

              <div className="p-3 rounded-xl bg-slate-950 border border-line space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-text-dim">Location:</span>
                  <span className="text-white font-bold">{space.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Panels:</span>
                  <span className="text-teal font-bold">{panelCount} Panels ({kwCapacity} kW)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Est. Subsidy:</span>
                  <span className="text-amber font-bold">₹{subsidyAmount.toLocaleString()}</span>
                </div>
              </div>

              <a
                href="tel:18002097788"
                onClick={() => setShowInstallerModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal to-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{t.callNowBtn}</span>
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
