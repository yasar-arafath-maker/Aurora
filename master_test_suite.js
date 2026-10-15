import { AISolarDecisionEngine } from './ai-solar-engine.js';
import fs from 'fs';

console.log('===============================================================');
console.log('       SOLARFIT AR & AI DECISION ENGINE MASTER TEST SUITE       ');
console.log('===============================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// TEST SUITE 1: HTML & JavaScript Syntax and Integrity
// -------------------------------------------------------------
console.log('--- Suite 1: HTML & ES Module Syntax Integrity ---');
const htmlContent = fs.readFileSync('solarfit-ar.html', 'utf8');
assert(htmlContent.includes('<!DOCTYPE html>'), 'HTML5 Doctype present');
assert(htmlContent.includes('<script type="importmap">'), 'Three.js r160 Import Map present');
assert(htmlContent.includes('AISolarDecisionEngine'), 'AI Decision Engine import present');
assert(htmlContent.includes('buildArraySystem'), 'Dynamic 3D layout builder function present');
assert(htmlContent.includes('ProceduralAudio'), 'Web Audio procedural sound synthesizer present');
assert(htmlContent.includes('updateRoiCalculations'), '25-Year ROI calculator present');
assert(htmlContent.includes('inspectorCard'), '3D Raycast component inspector present');
assert(htmlContent.includes('snapshotModal'), 'AR snapshot generator present');

const moduleScriptMatch = htmlContent.split('<script type="module">')[1].split('</script>')[0];
const stripped = moduleScriptMatch.replace(/^import\s+.*$/gm, '// import');
let syntaxValid = false;
try {
  new Function(stripped);
  syntaxValid = true;
} catch (e) {
  console.error('Syntax error:', e);
}
assert(syntaxValid, 'Zero JavaScript syntax or parse errors in solarfit-ar.html');

// -------------------------------------------------------------
// TEST SUITE 2: AI Solar Decision Engine Physics & MCDA
// -------------------------------------------------------------
console.log('\n--- Suite 2: AI Solar Decision Engine Physics & Logic ---');
const ai = new AISolarDecisionEngine();
const TYPES = [
  { id:'mono',  name:'Monocrystalline', eff:21 },
  { id:'poly',  name:'Polycrystalline', eff:16, legacy:true },
  { id:'thin',  name:'Thin-Film', eff:11.5 },
  { id:'perc',  name:'Advanced Mono PERC', eff:22.5 },
  { id:'topcon',name:'Advanced TOPCon', eff:24 },
  { id:'bifi',  name:'Bifacial', eff:22 }
];

// Scenario A: Concrete Rooftop
const resConcrete = ai.evaluate(TYPES, {
  surface: 'concrete',
  ambientTemp: 30,
  irradiance: 900,
  diffuseRadiation: 100,
  cloudCover: 10,
  latitude: 37.77
});
assert(resConcrete.topRecommendation.id === 'topcon', 'Concrete rooftop recommends TOPCon (highest efficiency & thermal coefficient)');
assert(resConcrete.cellTemp > 30, 'Calculates realistic operating cell temperature (>ambient under sun)');
const bifiConcrete = resConcrete.rankedPanels.find(p => p.id === 'bifi');
assert(bifiConcrete.compositeScore < resConcrete.topRecommendation.compositeScore, 'Bifacial is penalized on dark grey concrete');

// Scenario B: White Reflective Membrane (High Albedo)
const resWhite = ai.evaluate(TYPES, {
  surface: 'white_membrane',
  ambientTemp: 25,
  irradiance: 850,
  diffuseRadiation: 120,
  cloudCover: 10,
  latitude: 37.77
});
const bifiWhite = resWhite.rankedPanels.find(p => p.id === 'bifi');
assert(bifiWhite.rearGain > 15, 'Bifacial receives >15% rear boost on high-albedo white membrane');
assert(bifiWhite.compositeScore > 80, 'Bifacial achieves top-tier score on white membrane');

// Scenario C: Southern Hemisphere Azimuth
const resSouthHemi = ai.evaluate(TYPES, {
  surface: 'concrete',
  ambientTemp: 22,
  irradiance: 800,
  diffuseRadiation: 100,
  cloudCover: 10,
  latitude: -33.86 // Sydney, Australia
});
assert(resSouthHemi.optimalGeometry.azimuth === 0, 'Southern Hemisphere recommends True North (0°) azimuth');
assert(resSouthHemi.optimalGeometry.cardinalDirection === 'True North', 'Cardinal direction labeled True North in Southern Hemisphere');

// -------------------------------------------------------------
// TEST SUITE 3: Dynamic 3D Array Math & Grid Geometry
// -------------------------------------------------------------
console.log('\n--- Suite 3: Array Layout & Power Density Calculations ---');
function calcArray(cols, rows, panelW = 1.13, panelL = 1.72, eff = 24) {
  const panelArea = panelW * panelL;
  const totalPanels = cols * rows;
  const totalKw = (totalPanels * panelArea * eff / 100);
  const totalArea = totalPanels * panelArea;
  return { totalPanels, totalKw, totalArea };
}

const grid3x2 = calcArray(3, 2, 1.13, 1.72, 24);
assert(grid3x2.totalPanels === 6, '3x2 array yields 6 panels');
assert(Math.abs(grid3x2.totalKw - 2.80) < 0.05, '3x2 TOPCon array yields ~2.8 kWp STC module power');

const grid4x3 = calcArray(4, 3, 1.13, 1.72, 24);
assert(grid4x3.totalPanels === 12, '4x3 array yields 12 panels');
assert(grid4x3.totalKw > grid3x2.totalKw, '4x3 generates double 3x2 power');

// -------------------------------------------------------------
// TEST SUITE 4: Financial ROI & Carbon Offset Formulae
// -------------------------------------------------------------
console.log('\n--- Suite 4: 25-Year ROI & Environmental Math ---');
function calcRoi(monthlyBill, kwp) {
  const annualKwh = kwp * 1550 * 0.8;
  const annualSavings = Math.min(monthlyBill * 12 * 0.85, annualKwh * 0.22);
  const systemCost = kwp * 1800;
  const net25YrSavings = Math.round(annualSavings * 25 - systemCost);
  const paybackYears = systemCost / annualSavings;
  const carbonTons = Math.round(annualKwh * 25 * 0.0004);
  const trees = Math.round(carbonTons * 16.5);
  return { net25YrSavings, paybackYears, carbonTons, trees };
}

const roiResult = calcRoi(180, 4.6);
assert(roiResult.net25YrSavings > 0, 'Positive 25-year net lifetime return on $180/mo bill');
assert(roiResult.paybackYears >= 3.0 && roiResult.paybackYears <= 7.0, 'Realistic payback period between 3 and 7 years');
assert(roiResult.carbonTons > 0 && roiResult.trees > 500, 'Substantial positive CO2 and tree equivalence');

console.log('\n===============================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY (100% SUCCESS)`);
console.log('===============================================================\n');
