/**
 * LENSKART AR v3.0 — HIGH-PRECISION 3D EYEWEAR & COMPUTER VISION ENGINE
 * 
 * Features:
 * • Procedural High-Poly 3D Eyewear Models (Wayfarer, Aviator, Rimless, Clubmaster, Cat-Eye, Hexagonal, Round)
 * • Physically-Based Rendering (PBR) Materials with Procedural Acetate, Metals & AR Anti-Reflective Lenses
 * • 3D Head Occluder for photorealistic ear/temple occlusion when rotating head
 * • One-Euro Adaptive Filter: Zero-jitter stationary lock + Instant zero-latency head movement tracking
 * • AI Real-Time Face Shape Classifier (Oval, Round, Square, Heart, Diamond) & Frame Stylist Recommender
 * • Real-Time Pupillary Distance (PD in mm) and Frame Fitment Analyzer
 * • Procedural Mannequin Head for Demo Mode when camera is off
 */

import * as THREE from 'three';

// ============================================================================
// 1. PROCEDURAL TEXTURE GENERATOR (Acetate, Tortoiseshell, Brushed Metal)
// ============================================================================
export class EyewearTextureFactory {
  static createTortoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm amber / honey brown
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.5, '#92400e');
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Dark obsidian / black organic patches
    ctx.fillStyle = 'rgba(15, 10, 5, 0.85)';
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 15 + Math.random() * 45;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.4 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Golden honey highlights
    ctx.fillStyle = 'rgba(217, 119, 6, 0.45)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 10 + Math.random() * 25;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  static createBrushedMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, 256, 256);

    // Fine linear micro-scratches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 2) {
      if (Math.random() > 0.4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
}

// ============================================================================
// 2. EYEWEAR CATALOGUE & METADATA
// ============================================================================
export const EYEWEAR_CATALOG = [
  {
    id: 'vc_wayfarer',
    name: 'Vincent Chase Wayfarer',
    subtitle: 'Classic Italian Acetate · Polarized',
    price: '₹ 1,999',
    type: 'wayfarer',
    materialType: 'acetate',
    defaultColor: '#111827',
    defaultLens: 'polarized',
    widthMm: 138,
    bridgeMm: 18,
    lensHeightMm: 42,
    suitableFaces: ['Oval', 'Round', 'Heart'],
    description: 'Iconic trapezoidal silhouette with sculpted acetate temples and silver hinge studs. Perfect everyday statement piece.',
    matchScores: { 'Oval': 98, 'Round': 96, 'Heart': 92, 'Square': 82, 'Diamond': 85 }
  },
  {
    id: 'jj_aviator',
    name: 'John Jacobs Parisian Aviator',
    subtitle: 'Dual Brow-Bar · 24K Gold Titanium',
    price: '₹ 3,499',
    type: 'aviator',
    materialType: 'metal',
    defaultColor: '#f59e0b',
    defaultLens: 'gradient_amber',
    widthMm: 142,
    bridgeMm: 14,
    lensHeightMm: 50,
    suitableFaces: ['Oval', 'Square', 'Heart'],
    description: 'Signature military-inspired teardrop aviator with double top bridge bar and ultra-thin titanium wire arms.',
    matchScores: { 'Oval': 97, 'Square': 95, 'Heart': 91, 'Round': 79, 'Diamond': 88 }
  },
  {
    id: 'air_rimless',
    name: 'Lenskart Air Titanium Rimless',
    subtitle: 'Weightless 9.2g · Laser Beveled',
    price: '₹ 2,999',
    type: 'rimless',
    materialType: 'metal',
    defaultColor: '#94a3b8',
    defaultLens: 'blucut_clear',
    widthMm: 136,
    bridgeMm: 17,
    lensHeightMm: 38,
    suitableFaces: ['Oval', 'Round', 'Diamond', 'Heart'],
    description: 'Minimalist rimless silhouette crafted from surgical-grade flexible titanium. Feels virtually weightless on the face.',
    matchScores: { 'Oval': 96, 'Diamond': 97, 'Round': 93, 'Heart': 94, 'Square': 84 }
  },
  {
    id: 'hooper_clubmaster',
    name: 'Hooper Retro Clubmaster',
    subtitle: 'Browline Accent · Tortoise & Gold',
    price: '₹ 2,299',
    type: 'clubmaster',
    materialType: 'tortoise',
    defaultColor: '#78350f',
    defaultLens: 'blucut_clear',
    widthMm: 139,
    bridgeMm: 19,
    lensHeightMm: 44,
    suitableFaces: ['Oval', 'Round', 'Heart'],
    description: 'Timeless 1950s browline styling featuring handcrafted tortoise shell top caps with a polished gold wire under-rim.',
    matchScores: { 'Oval': 99, 'Round': 95, 'Heart': 93, 'Square': 80, 'Diamond': 86 }
  },
  {
    id: 'vogue_cateye',
    name: 'Vogue Runway Cat-Eye',
    subtitle: 'Sculpted Wings · Rose Gold Luster',
    price: '₹ 2,799',
    type: 'cateye',
    materialType: 'metal',
    defaultColor: '#fb7185',
    defaultLens: 'gradient_rose',
    widthMm: 137,
    bridgeMm: 16,
    lensHeightMm: 43,
    suitableFaces: ['Diamond', 'Round', 'Square'],
    description: 'Glamorous upturned wing geometry that accentuates cheekbones and lifts the facial profile with couture elegance.',
    matchScores: { 'Diamond': 99, 'Round': 94, 'Square': 92, 'Oval': 91, 'Heart': 83 }
  },
  {
    id: 'hustlr_hexagonal',
    name: 'Hustlr Geometric Hex',
    subtitle: 'Octagon Facets · Cyber Chrome',
    price: '₹ 2,499',
    type: 'hexagonal',
    materialType: 'metal',
    defaultColor: '#38bdf8',
    defaultLens: 'mirrored_blue',
    widthMm: 135,
    bridgeMm: 18,
    lensHeightMm: 42,
    suitableFaces: ['Oval', 'Round', 'Heart'],
    description: 'Bold angular polygonal rims for the trendsetting generation. Sleek cyber-chrome finish with beveled perimeter facets.',
    matchScores: { 'Round': 98, 'Oval': 95, 'Heart': 92, 'Diamond': 89, 'Square': 76 }
  },
  {
    id: 'potter_round',
    name: 'Studio Retro Round Wire',
    subtitle: 'Circular Minimalist · Matte Graphite',
    price: '₹ 1,799',
    type: 'round',
    materialType: 'metal',
    defaultColor: '#334155',
    defaultLens: 'blucut_clear',
    widthMm: 134,
    bridgeMm: 21,
    lensHeightMm: 46,
    suitableFaces: ['Square', 'Oval', 'Heart'],
    description: 'Vintage circular optical wireframe beloved by artists and academics. Softens angular jawlines and structured faces.',
    matchScores: { 'Square': 98, 'Heart': 95, 'Oval': 92, 'Diamond': 88, 'Round': 72 }
  }
];

// Available color finishes
export const COLOR_FINISHES = [
  { id: 'matte_black', name: 'Obsidian Black', hex: '#111827', type: 'acetate' },
  { id: 'tortoise', name: 'Havana Tortoise', hex: '#78350f', type: 'tortoise' },
  { id: 'gold', name: '24K Polished Gold', hex: '#f59e0b', type: 'metal' },
  { id: 'silver', name: 'Brushed Titanium', hex: '#cbd5e1', type: 'metal' },
  { id: 'rose_gold', name: 'Rose Gold', hex: '#fb7185', type: 'metal' },
  { id: 'emerald', name: 'Emerald Crystal', hex: '#059669', type: 'acetate' },
  { id: 'cyber_cyan', name: 'Cyber Blue', hex: '#0284c7', type: 'metal' }
];

// Available lens coatings
export const LENS_COATINGS = [
  { id: 'blucut_clear', name: 'Blu Cut™ Anti-Glare', color: '#e0f2fe', transmission: 0.94, opacity: 0.98, reflection: '#10b981', desc: 'Blocks 98% harmful digital blue-light' },
  { id: 'polarized', name: 'Dark Polarized UV400', color: '#091e14', transmission: 0.25, opacity: 0.88, reflection: '#22c55e', desc: '100% UV Protection & Road Glare Shield' },
  { id: 'gradient_amber', name: 'Gradient Bronze Mirrored', color: '#78350f', transmission: 0.40, opacity: 0.85, reflection: '#f59e0b', desc: 'Warm sunset tone with top-down fade' },
  { id: 'gradient_rose', name: 'Rose Champagne Tint', color: '#881337', transmission: 0.45, opacity: 0.82, reflection: '#fda4af', desc: 'Couture tinted elegance' },
  { id: 'mirrored_blue', name: 'Ocean Blue Flash Mirror', color: '#0369a1', transmission: 0.28, opacity: 0.92, reflection: '#38bdf8', desc: 'High-specular reflective street style' },
  { id: 'photochromic', name: 'Transitions™ Adaptive', color: '#1e293b', transmission: 0.70, opacity: 0.90, reflection: '#94a3b8', desc: 'Darkens dynamically in outdoor sunlight' }
];

// ============================================================================
// 3. 3D PROCEDURAL EYEWEAR BUILDER (THREE.JS)
// ============================================================================
export class ProceduralEyewearBuilder {
  constructor() {
    this.tortoiseTex = EyewearTextureFactory.createTortoiseTexture();
    this.brushedTex = EyewearTextureFactory.createBrushedMetalTexture();
  }

  createEyewear(modelData, activeColorHex, activeLensId) {
    const group = new THREE.Group();
    group.name = `eyewear_${modelData.id}`;

    // Dimensions normalized for Three.js 3D world units (1 unit = ~100mm)
    // Standard eyeglasses width = ~138mm = ~1.38 units
    const scale = (modelData.widthMm / 138) * 1.35;
    const halfWidth = 0.68 * scale;
    const lensWidth = 0.52 * scale;
    const lensHeight = (modelData.lensHeightMm / 40) * 0.42 * scale;
    const bridgeWidth = (modelData.bridgeMm / 18) * 0.26 * scale;
    const rimThickness = modelData.type === 'wayfarer' ? 0.055 : (modelData.type === 'rimless' ? 0.012 : 0.028);
    const depth = 0.04;

    // Resolve materials
    const frameMat = this.getFrameMaterial(modelData.materialType, activeColorHex);
    const lensMat = this.getLensMaterial(activeLensId);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.15,
      envMapIntensity: 2.0
    });

    const frameGroup = new THREE.Group();
    frameGroup.name = 'frame';

    // 1. Build Left & Right Rims and Lenses
    const leftLensGroup = this.buildLensAndRim(modelData.type, lensWidth, lensHeight, rimThickness, depth, frameMat, lensMat, 1);
    leftLensGroup.position.x = bridgeWidth / 2 + lensWidth / 2;
    frameGroup.add(leftLensGroup);

    const rightLensGroup = this.buildLensAndRim(modelData.type, lensWidth, lensHeight, rimThickness, depth, frameMat, lensMat, -1);
    rightLensGroup.position.x = -(bridgeWidth / 2 + lensWidth / 2);
    frameGroup.add(rightLensGroup);

    // 2. Build Bridge Bar
    const bridge = this.buildBridge(modelData.type, bridgeWidth, lensHeight, rimThickness, frameMat);
    frameGroup.add(bridge);

    // 3. Build Temples & Arms reaching toward ears
    const temples = this.buildTemples(halfWidth + lensWidth / 2, depth, frameMat, accentMat);
    frameGroup.add(temples);

    // 4. Build Nose Pads (for metal & rimless frames)
    if (modelData.materialType === 'metal' || modelData.type === 'rimless') {
      const nosePads = this.buildNosePads(bridgeWidth, lensHeight, accentMat);
      frameGroup.add(nosePads);
    }

    // 5. Build Hinge Rivet Accents (for Wayfarer style)
    if (modelData.type === 'wayfarer' || modelData.type === 'clubmaster') {
      const rivets = this.buildRivets(halfWidth + lensWidth / 2, lensHeight * 0.45, accentMat);
      frameGroup.add(rivets);
    }

    group.add(frameGroup);

    // Store references for dynamic live updates
    group.userData = {
      modelData,
      frameMat,
      lensMat,
      frameGroup,
      updateColor: (hex, matType) => {
        const newMat = this.getFrameMaterial(matType || modelData.materialType, hex);
        frameGroup.traverse(child => {
          if (child.isMesh && child.name.includes('frame_part')) {
            child.material = newMat;
          }
        });
      },
      updateLens: (lensId) => {
        const newLensMat = this.getLensMaterial(lensId);
        frameGroup.traverse(child => {
          if (child.isMesh && child.name.includes('lens_part')) {
            child.material = newLensMat;
          }
        });
      },
      setPhotochromicAlpha: (factor) => {
        // factor: 0.0 (clear indoor) to 1.0 (dark outdoor sunglasses)
        if (activeLensId === 'photochromic') {
          lensMat.opacity = 0.6 + factor * 0.35;
          lensMat.color.lerpColors(new THREE.Color('#cbd5e1'), new THREE.Color('#0f172a'), factor);
        }
      }
    };

    return group;
  }

  getFrameMaterial(materialType, colorHex) {
    if (materialType === 'tortoise') {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map: this.tortoiseTex,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.6,
        envMapIntensity: 1.8
      });
    } else if (materialType === 'metal') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        metalness: 0.92,
        roughness: 0.22,
        roughnessMap: this.brushedTex,
        envMapIntensity: 2.2
      });
    } else {
      // High-Gloss Acetate
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.7,
        envMapIntensity: 1.6
      });
    }
  }

  getLensMaterial(lensId) {
    const coating = LENS_COATINGS.find(c => c.id === lensId) || LENS_COATINGS[0];

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(coating.color),
      transparent: true,
      opacity: coating.opacity,
      transmission: coating.transmission,
      ior: 1.52,
      roughness: 0.02,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      reflectivity: 0.85,
      envMapIntensity: 2.5
    });

    // Subtle Anti-Reflective (AR) green / cyan coating tint on back face
    mat.specularColor = new THREE.Color(coating.reflection);
    mat.specularIntensity = 1.0;
    return mat;
  }

  buildLensAndRim(type, width, height, thickness, depth, frameMat, lensMat, side) {
    const group = new THREE.Group();

    // Create 2D outer & inner curve shape for the rim
    const outerShape = new THREE.Shape();
    const innerHole = new THREE.Path();

    const w = width / 2;
    const h = height / 2;

    if (type === 'round') {
      // Circular profile
      outerShape.absellipse(0, 0, w + thickness, h + thickness, 0, Math.PI * 2, false);
      innerHole.absellipse(0, 0, w, h, 0, Math.PI * 2, true);
    } else if (type === 'aviator') {
      // Teardrop profile (drooping bottom-outer corner)
      this.createAviatorShape(outerShape, w + thickness, h + thickness, side);
      this.createAviatorShape(innerHole, w, h, side, true);
    } else if (type === 'cateye') {
      // Swept upward winged outer top corner
      this.createCatEyeShape(outerShape, w + thickness, h + thickness, side);
      this.createCatEyeShape(innerHole, w, h, side, true);
    } else if (type === 'hexagonal') {
      // 6-sided faceted polygon
      this.createHexShape(outerShape, w + thickness, h + thickness);
      this.createHexShape(innerHole, w, h, true);
    } else {
      // Wayfarer / Clubmaster / Classic rounded rectangle
      this.createWayfarerShape(outerShape, w + thickness, h + thickness, side);
      this.createWayfarerShape(innerHole, w, h, side, true);
    }

    // Only add physical rim if not rimless
    if (type !== 'rimless') {
      outerShape.holes.push(innerHole);
      const extrudeSettings = {
        depth: depth,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.01,
        bevelThickness: 0.01
      };
      const rimGeo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
      rimGeo.center();
      const rimMesh = new THREE.Mesh(rimGeo, frameMat);
      rimMesh.name = 'frame_part_rim';
      rimMesh.castShadow = true;
      group.add(rimMesh);
    }

    // Create Lens Geometry (Slightly curved thin meniscus cylinder/disc)
    const lensGeo = new THREE.CylinderGeometry(w * 0.98, w * 0.98, depth * 0.35, 32);
    lensGeo.scale(1, 1, h / w);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.name = 'lens_part';
    lensMesh.receiveShadow = true;
    group.add(lensMesh);

    return group;
  }

  createWayfarerShape(shape, w, h, side, isHole = false) {
    const flare = side * 0.04;
    const r = 0.08;
    // Trapezoid slightly wider at top than bottom
    const topW = w * 1.05 + flare;
    const btmW = w * 0.85;

    shape.moveTo(-btmW + r, -h);
    shape.lineTo(btmW - r, -h);
    shape.quadraticCurveTo(btmW, -h, btmW, -h + r);
    shape.lineTo(topW, h - r);
    shape.quadraticCurveTo(topW, h, topW - r, h);
    shape.lineTo(-topW + r, h);
    shape.quadraticCurveTo(-topW, h, -topW, h - r);
    shape.lineTo(-btmW, -h + r);
    shape.quadraticCurveTo(-btmW, -h, -btmW + r, -h);
  }

  createAviatorShape(shape, w, h, side, isHole = false) {
    // Teardrop: flat top brow, rounded drooping outer bottom
    const outerDrop = side > 0 ? 0.06 : -0.06;
    shape.moveTo(-w * 0.7, h);
    shape.lineTo(w * 0.7, h);
    shape.bezierCurveTo(w * 1.05, h, w * 1.15, -h * 0.2, w * 0.8 + outerDrop, -h * 0.95);
    shape.bezierCurveTo(w * 0.4, -h * 1.15, -w * 0.4, -h * 1.15, -w * 0.8 + outerDrop, -h * 0.95);
    shape.bezierCurveTo(-w * 1.15, -h * 0.2, -w * 1.05, h, -w * 0.7, h);
  }

  createCatEyeShape(shape, w, h, side, isHole = false) {
    // Dramatic upward flare on outer corner
    const outerX = side > 0 ? w * 1.25 : -w * 1.25;
    const outerY = h * 1.35;
    const innerX = side > 0 ? -w * 0.7 : w * 0.7;

    shape.moveTo(innerX, h * 0.5);
    shape.quadraticCurveTo(0, h * 0.8, outerX, outerY);
    shape.quadraticCurveTo(outerX * 0.9, 0, 0, -h * 0.95);
    shape.quadraticCurveTo(innerX * 1.1, -h * 0.5, innerX, h * 0.5);
  }

  createHexShape(shape, w, h, isHole = false) {
    const sides = 6;
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(angle) * w;
      const y = Math.sin(angle) * h;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
  }

  buildBridge(type, bridgeWidth, lensHeight, thickness, frameMat) {
    const bridgeGroup = new THREE.Group();

    if (type === 'aviator') {
      // Double brow bar
      // Top bar
      const topBarGeo = new THREE.CylinderGeometry(0.012, 0.012, bridgeWidth * 2.2, 16);
      topBarGeo.rotateZ(Math.PI / 2);
      topBarGeo.translate(0, lensHeight * 0.42, 0);
      const topBarMesh = new THREE.Mesh(topBarGeo, frameMat);
      topBarMesh.name = 'frame_part_bridge_top';
      bridgeGroup.add(topBarMesh);

      // Curved lower bridge
      const lowerCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-bridgeWidth / 2, lensHeight * 0.15, 0),
        new THREE.Vector3(0, lensHeight * 0.28, 0.02),
        new THREE.Vector3(bridgeWidth / 2, lensHeight * 0.15, 0)
      );
      const tubeGeo = new THREE.TubeGeometry(lowerCurve, 20, 0.012, 8, false);
      const lowerMesh = new THREE.Mesh(tubeGeo, frameMat);
      lowerMesh.name = 'frame_part_bridge_lower';
      bridgeGroup.add(lowerMesh);
    } else {
      // Arch bridge
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-bridgeWidth / 2, 0, 0),
        new THREE.Vector3(0, 0.08, 0.02),
        new THREE.Vector3(bridgeWidth / 2, 0, 0)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 20, thickness * 0.75, 12, false);
      const bridgeMesh = new THREE.Mesh(tubeGeo, frameMat);
      bridgeMesh.name = 'frame_part_bridge';
      bridgeGroup.add(bridgeMesh);
    }

    return bridgeGroup;
  }

  buildTemples(outerX, depth, frameMat, accentMat) {
    const templeGroup = new THREE.Group();
    const armLength = 1.65; // Extends back along head to ears

    // Left Arm
    const leftArmCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(outerX, 0, -depth),
      new THREE.Vector3(outerX + 0.03, 0, -armLength * 0.3),
      new THREE.Vector3(outerX - 0.02, 0, -armLength * 0.7),
      new THREE.Vector3(outerX - 0.08, -0.15, -armLength) // downward curve behind ear
    );
    const leftArmGeo = new THREE.TubeGeometry(leftArmCurve, 24, 0.022, 8, false);
    const leftArm = new THREE.Mesh(leftArmGeo, frameMat);
    leftArm.name = 'frame_part_arm_left';
    leftArm.castShadow = true;
    templeGroup.add(leftArm);

    // Right Arm
    const rightArmCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-outerX, 0, -depth),
      new THREE.Vector3(-outerX - 0.03, 0, -armLength * 0.3),
      new THREE.Vector3(-outerX + 0.02, 0, -armLength * 0.7),
      new THREE.Vector3(-outerX + 0.08, -0.15, -armLength)
    );
    const rightArmGeo = new THREE.TubeGeometry(rightArmCurve, 24, 0.022, 8, false);
    const rightArm = new THREE.Mesh(rightArmGeo, frameMat);
    rightArm.name = 'frame_part_arm_right';
    rightArm.castShadow = true;
    templeGroup.add(rightArm);

    return templeGroup;
  }

  buildNosePads(bridgeWidth, lensHeight, accentMat) {
    const padGroup = new THREE.Group();
    const padGeo = new THREE.CapsuleGeometry(0.02, 0.045, 8, 8);
    const padMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.3,
      ior: 1.45
    });

    const leftPad = new THREE.Mesh(padGeo, padMat);
    leftPad.position.set(bridgeWidth * 0.5, -lensHeight * 0.2, -0.06);
    leftPad.rotation.set(0.2, -0.3, 0.2);
    padGroup.add(leftPad);

    const rightPad = new THREE.Mesh(padGeo, padMat);
    rightPad.position.set(-bridgeWidth * 0.5, -lensHeight * 0.2, -0.06);
    rightPad.rotation.set(0.2, 0.3, -0.2);
    padGroup.add(rightPad);

    return padGroup;
  }

  buildRivets(outerX, yPos, accentMat) {
    const rivetGroup = new THREE.Group();
    const rivetGeo = new THREE.BoxGeometry(0.028, 0.015, 0.01);

    const rLeft = new THREE.Mesh(rivetGeo, accentMat);
    rLeft.position.set(outerX * 0.92, yPos, 0.025);
    rivetGroup.add(rLeft);

    const rRight = new THREE.Mesh(rivetGeo, accentMat);
    rRight.position.set(-outerX * 0.92, yPos, 0.025);
    rivetGroup.add(rRight);

    return rivetGroup;
  }
}

// ============================================================================
// 4. 3D HEAD OCCLUDER (Hides temple arms when user turns head sideways)
// ============================================================================
export class HeadOccluder {
  static createOccluder() {
    // 3D head-shaped egg / ellipsoid mesh
    const headGeo = new THREE.SphereGeometry(1.0, 32, 24);
    headGeo.scale(0.85, 1.15, 1.0);
    headGeo.translate(0, -0.15, -0.85);

    // Depth-only material: writes to depth buffer, hides arms behind head, but doesn't draw color!
    const occluderMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true
    });

    const occluderMesh = new THREE.Mesh(headGeo, occluderMat);
    occluderMesh.name = 'head_occluder';
    occluderMesh.renderOrder = -1; // Render before eyewear
    return occluderMesh;
  }
}

// ============================================================================
// 5. ONE-EURO ADAPTIVE LOW-PASS FILTER (Jitter-Free & Zero-Latency)
// ============================================================================
export class OneEuroFilter {
  constructor(freq = 60, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(rate, cutoff) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(x, timestamp = performance.now()) {
    if (this.xPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestamp;
      return x;
    }

    const dt = Math.max((timestamp - this.tPrev) / 1000, 1e-4);
    const rate = 1.0 / dt;
    this.tPrev = timestamp;

    // Estimate velocity
    const dx = (x - this.xPrev) * rate;
    const aD = this.alpha(rate, this.dCutoff);
    const edx = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = edx;

    // Dynamic cutoff frequency: small motion -> low cutoff (silky smooth), fast motion -> high cutoff (instant snap)
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this.alpha(rate, cutoff);
    const xFiltered = a * x + (1 - a) * this.xPrev;
    this.xPrev = xFiltered;
    return xFiltered;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

export class PoseFilter3D {
  constructor() {
    // 3D Position filters
    this.fx = new OneEuroFilter(60, 1.2, 0.015);
    this.fy = new OneEuroFilter(60, 1.2, 0.015);
    this.fz = new OneEuroFilter(60, 0.8, 0.020);

    // Euler Rotation filters (Yaw, Pitch, Roll)
    this.fPitch = new OneEuroFilter(60, 1.5, 0.025);
    this.fYaw = new OneEuroFilter(60, 1.5, 0.025);
    this.fRoll = new OneEuroFilter(60, 1.5, 0.025);

    // Scale filter
    this.fScale = new OneEuroFilter(60, 0.9, 0.012);
  }

  filter(pos, rot, scale, timestamp) {
    return {
      pos: new THREE.Vector3(
        this.fx.filter(pos.x, timestamp),
        this.fy.filter(pos.y, timestamp),
        this.fz.filter(pos.z, timestamp)
      ),
      rot: new THREE.Euler(
        this.fPitch.filter(rot.x, timestamp),
        this.fYaw.filter(rot.y, timestamp),
        this.fRoll.filter(rot.z, timestamp),
        'YXZ'
      ),
      scale: this.fScale.filter(scale, timestamp)
    };
  }

  reset() {
    this.fx.reset(); this.fy.reset(); this.fz.reset();
    this.fPitch.reset(); this.fYaw.reset(); this.fRoll.reset();
    this.fScale.reset();
  }
}

// ============================================================================
// 6. AI FACE SHAPE CLASSIFIER & PUPILLARY DISTANCE (PD) ANALYZER
// ============================================================================
export class FaceShapeAI {
  /**
   * Analyzes 468 MediaPipe FaceMesh landmarks in real time
   * Landmarks:
   * 10: Forehead Top, 152: Chin Bottom
   * 234: Right Cheek/Temple, 454: Left Cheek/Temple
   * 54: Right Forehead, 284: Left Forehead
   * 172: Right Jaw, 397: Left Jaw
   * 33: Right Eye Outer, 263: Left Eye Outer
   * 133: Right Eye Inner, 362: Left Eye Inner
   */
  static analyzeFace(landmarks, canvasWidth, canvasHeight) {
    if (!landmarks || landmarks.length < 468) return null;

    const pt = (idx) => ({
      x: landmarks[idx].x * canvasWidth,
      y: landmarks[idx].y * canvasHeight,
      z: landmarks[idx].z || 0
    });

    const dist2D = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const faceLength = dist2D(pt(10), pt(152));
    const cheekboneWidth = dist2D(pt(234), pt(454));
    const foreheadWidth = dist2D(pt(54), pt(284));
    const jawlineWidth = dist2D(pt(172), pt(397));

    // Eye centers & Interpupillary Distance (PD)
    const rightEye = pt(133);
    const leftEye = pt(362);
    const eyePixelDistance = dist2D(rightEye, leftEye);

    // Approximate PD in millimeters (avg human outer eye distance is ~63mm)
    // Calibrated using standard facial anthropometry ratio
    const estimatedPdMm = Math.round(56 + (eyePixelDistance / cheekboneWidth) * 16);
    const clampedPd = Math.min(Math.max(estimatedPdMm, 56), 72);

    // Ratios
    const lengthToWidthRatio = faceLength / (cheekboneWidth || 1);
    const foreheadToJawRatio = foreheadWidth / (jawlineWidth || 1);
    const jawToCheekRatio = jawlineWidth / (cheekboneWidth || 1);

    let faceShape = 'Oval';
    let reasoning = 'Balanced proportions with gentle curves.';

    if (lengthToWidthRatio < 1.15 && jawToCheekRatio > 0.82) {
      faceShape = 'Round';
      reasoning = 'Soft curves with nearly equal face length and width. Angular rectangular & geometric frames create slimming balance.';
    } else if (lengthToWidthRatio < 1.25 && jawToCheekRatio > 0.88) {
      faceShape = 'Square';
      reasoning = 'Strong, defined jawline and balanced forehead width. Round, Oval, and Aviator frames soften facial contours.';
    } else if (foreheadToJawRatio > 1.35) {
      faceShape = 'Heart';
      reasoning = 'Broad forehead tapering down to an elegant pointed chin. Browline, Rimless, and Wayfarer styles complement perfectly.';
    } else if (cheekboneWidth > foreheadWidth * 1.15 && cheekboneWidth > jawlineWidth * 1.25) {
      faceShape = 'Diamond';
      reasoning = 'Dramatic high cheekbones with narrower forehead and chin. Cat-Eye, Oval, and Rimless frames highlight natural symmetry.';
    } else {
      faceShape = 'Oval';
      reasoning = 'Evenly balanced facial geometry with softly rounded chin. The most versatile shape — virtually any frame style looks stunning!';
    }

    return {
      faceShape,
      reasoning,
      pdMm: clampedPd,
      faceLengthPx: Math.round(faceLength),
      cheekboneWidthPx: Math.round(cheekboneWidth),
      fitCategory: clampedPd < 60 ? 'Narrow Fit' : (clampedPd > 66 ? 'Wide Fit' : 'Medium Fit')
    };
  }
}

// ============================================================================
// 7. SYNTHETIC 3D MANNEQUIN HEAD (Interactive Demo Mode when Camera is Off)
// ============================================================================
export class SyntheticDemoAvatar {
  static createMannequin() {
    const avatarGroup = new THREE.Group();
    avatarGroup.name = 'demo_mannequin';

    // Stylized Cyber / Porcelain Mannequin Head
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.45,
      wireframe: false
    });

    // Face / Cranium
    const headGeo = new THREE.SphereGeometry(1.0, 32, 28);
    headGeo.scale(0.84, 1.12, 0.95);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 0, -0.4);
    avatarGroup.add(headMesh);

    // Jaw / Chin contour
    const chinGeo = new THREE.CylinderGeometry(0.35, 0.2, 0.6, 16);
    chinGeo.scale(1, 1, 0.8);
    const chinMesh = new THREE.Mesh(chinGeo, headMat);
    chinMesh.position.set(0, -0.75, -0.25);
    chinMesh.rotation.x = 0.2;
    avatarGroup.add(chinMesh);

    // Nose Bridge Accent
    const noseGeo = new THREE.ConeGeometry(0.12, 0.45, 12);
    noseGeo.scale(0.8, 1, 1.2);
    const noseMesh = new THREE.Mesh(noseGeo, headMat);
    noseMesh.position.set(0, -0.05, 0.35);
    noseMesh.rotation.x = -0.3;
    avatarGroup.add(noseMesh);

    // Subtle Eye Sockets
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMat);
    leftEye.position.set(0.36, 0.1, 0.22);
    avatarGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMat);
    rightEye.position.set(-0.36, 0.1, 0.22);
    avatarGroup.add(rightEye);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.8, 20);
    const neckMesh = new THREE.Mesh(neckGeo, headMat);
    neckMesh.position.set(0, -1.3, -0.4);
    avatarGroup.add(neckMesh);

    return avatarGroup;
  }
}
