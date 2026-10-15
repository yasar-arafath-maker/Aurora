/**
 * AI Solar Decision Engine — Multi-Criteria Decision Analysis (MCDA) & Explainable AI (XAI)
 * Evaluates real-time meteorological, spatial, thermal, and surface conditions to determine
 * the mathematically optimal solar panel technology and configuration.
 */

export class AISolarDecisionEngine {
  constructor(customConfig = {}) {
    this.config = Object.assign({
      standardTestConditionTemp: 25, // °C
      stcIrradiance: 1000,          // W/m²
      defaultRoofArea: 38.5,        // m²
      nominalCellTemp: 45,          // °C NOCT
      albedoMap: {
        concrete: 0.20,             // Grey concrete rooftop
        white_membrane: 0.78,       // High-albedo cool roof (TPO / PVC)
        gravel: 0.25,               // Ballasted gravel
        metal_zinc: 0.35,           // Corrugated metal
        green_roof: 0.12            // Vegetated green roof
      }
    }, customConfig);
  }

  /**
   * Evaluates and ranks panel modules based on multi-factor physics & utility scoring
   * @param {Array} panelCatalogue - List of panel module definitions
   * @param {Object} environmentContext - Current environment, roof, and solar state
   * @returns {Object} Ranked recommendation, scores, and natural language reasoning
   */
  evaluate(panelCatalogue, environmentContext = {}) {
    const {
      surface = 'concrete',
      ambientTemp = 25,         // °C
      irradiance = 850,          // W/m² (DNI / GHI)
      diffuseRadiation = 120,    // W/m²
      cloudCover = 15,           // 0 - 100 %
      roofArea = 38.5,           // m²
      arrayKwTarget = 4.5,       // Target capacity (kWp)
      latitude = 37.77           // Degrees North
    } = environmentContext;

    const albedo = this.config.albedoMap[surface] || 0.20;
    const diffuseRatio = irradiance > 0 ? (diffuseRadiation / (irradiance + diffuseRadiation)) : 0.5;

    // Technical specifications database for each panel technology
    const techSpecs = {
      mono: {
        tempCoeff: -0.37,        // % / °C
        lowLightPerf: 0.92,      // Low-light relative response
        bifacialFactor: 0.00,    // Monofacial
        degradationAnnual: 0.50, // % / year
        costIndex: 1.00          // Baseline reference cost
      },
      poly: {
        tempCoeff: -0.42,        // % / °C (High thermal loss)
        lowLightPerf: 0.82,
        bifacialFactor: 0.00,
        degradationAnnual: 0.70,
        costIndex: 0.75,
        legacyTech: true
      },
      thin: {
        tempCoeff: -0.21,        // % / °C (Excellent thermal resilience)
        lowLightPerf: 0.98,      // Outstanding diffuse/low-light response
        bifacialFactor: 0.00,
        degradationAnnual: 0.60,
        costIndex: 0.85
      },
      perc: {
        tempCoeff: -0.35,        // % / °C
        lowLightPerf: 0.94,
        bifacialFactor: 0.00,
        degradationAnnual: 0.45,
        costIndex: 1.10
      },
      topcon: {
        tempCoeff: -0.30,        // % / °C (Low temperature coefficient)
        lowLightPerf: 0.97,      // N-type high spectral efficiency
        bifacialFactor: 0.00,
        degradationAnnual: 0.35,
        costIndex: 1.22
      },
      bifi: {
        tempCoeff: -0.32,        // % / °C
        lowLightPerf: 0.95,
        bifacialFactor: 0.80,    // 80% rear bifaciality factor
        degradationAnnual: 0.40,
        costIndex: 1.25
      }
    };

    // Estimated cell operating temperature
    const cellTemp = ambientTemp + (this.config.nominalCellTemp - 20) * (irradiance / 800);

    const scoredPanels = panelCatalogue.map((panel, index) => {
      const spec = techSpecs[panel.id] || techSpecs.mono;

      // 1. Efficiency & Space Density Score (0 - 100)
      const efficiencyScore = (panel.eff / 24.0) * 100;

      // 2. Thermal Derating Score
      const deltaTemp = Math.max(0, cellTemp - this.config.standardTestConditionTemp);
      const thermalLossPercent = Math.abs(spec.tempCoeff) * deltaTemp;
      const thermalScore = Math.max(0, 100 - thermalLossPercent * 6.5);

      // 3. Surface Albedo & Bifaciality Synergy Score
      let albedoScore = 50;
      let rearGainPercent = 0;
      if (spec.bifacialFactor > 0) {
        rearGainPercent = albedo * spec.bifacialFactor * 30; // Max ~24% boost on high albedo
        if (albedo < 0.25) {
          // Low albedo (concrete / asphalt) gives very poor rear yield
          albedoScore = 32;
        } else if (albedo >= 0.60) {
          // High albedo (white TPO / cool roof) gives tremendous advantage
          albedoScore = 98;
        } else {
          albedoScore = 65;
        }
      } else {
        // Monofacial panels are unaffected by surface darkness
        albedoScore = 85;
      }

      // 4. Low-Light & Diffuse Radiation Score
      const lowLightScore = (spec.lowLightPerf * 0.7 + (1 - cloudCover / 100) * 0.3) * 100;

      // 5. Longevity & Technology Modernity Penalty
      let modernityScore = 95;
      if (spec.legacyTech) modernityScore = 35; // Obsolete / phased out
      if (panel.id === 'topcon' || panel.id === 'perc') modernityScore = 100;

      // Weighted Multi-Criteria Utility Synthesis (Weights sum to 1.0)
      const weights = {
        efficiency: 0.32,
        thermal: 0.22,
        surfaceSynergy: 0.20,
        diffuseLight: 0.14,
        modernity: 0.12
      };

      const compositeScore = (
        efficiencyScore * weights.efficiency +
        thermalScore * weights.thermal +
        albedoScore * weights.surfaceSynergy +
        lowLightScore * weights.diffuseLight +
        modernityScore * weights.modernity
      );

      // Final match rating normalized to 0 - 100
      const matchRating = Math.round(clamp(compositeScore, 10, 99));

      // Natural language reasoning generation
      const reasons = this._generateExplanation(panel, spec, {
        surface, albedo, cellTemp, thermalLoss: parseFloat(thermalLossPercent.toFixed(1)), rearGain: parseFloat(rearGainPercent.toFixed(1)), cloudCover
      });

      return {
        id: panel.id,
        name: panel.name,
        index,
        matchRating,
        compositeScore: parseFloat(compositeScore.toFixed(1)),
        breakdown: {
          efficiencyScore: Math.round(efficiencyScore),
          thermalScore: Math.round(thermalScore),
          surfaceSynergyScore: Math.round(albedoScore),
          lowLightScore: Math.round(lowLightScore),
          modernityScore: Math.round(modernityScore)
        },
        thermalLoss: parseFloat(thermalLossPercent.toFixed(1)),
        rearGain: parseFloat(rearGainPercent.toFixed(1)),
        reasons
      };
    });

    // Sort descending by composite score
    scoredPanels.sort((a, b) => b.compositeScore - a.compositeScore);

    const topRecommendation = scoredPanels[0];

    // Compute optimal physical orientation recommendation
    const optimalAzimuth = latitude >= 0 ? 180 : 0; // True South in Northern hemisphere, True North in Southern
    const optimalTilt = Math.round(clamp(Math.abs(latitude) * 0.87, 10, 35)); // Rule of thumb tilt

    return {
      timestamp: new Date().toISOString(),
      surface,
      albedo,
      cellTemp: parseFloat(cellTemp.toFixed(1)),
      topRecommendation,
      rankedPanels: scoredPanels,
      optimalGeometry: {
        azimuth: optimalAzimuth,
        tilt: optimalTilt,
        cardinalDirection: latitude >= 0 ? 'True South' : 'True North'
      }
    };
  }

  /**
   * Generates explainable natural language rationale for a given panel option
   * @private
   */
  _generateExplanation(panel, spec, ctx) {
    const lines = [];

    if (panel.id === 'topcon') {
      lines.push(`High 24% N-type efficiency maximizes limited rooftop area.`);
      lines.push(`Low thermal coefficient (${spec.tempCoeff}%/°C) mitigates hot rooftop degradation (loss ≈ -${ctx.thermalLoss}% at ${Math.round(ctx.cellTemp)}°C cell temp).`);
    } else if (panel.id === 'bifi') {
      if (ctx.albedo < 0.25) {
        lines.push(`Sub-optimal on ${ctx.surface}: Grey concrete albedo (~${Math.round(ctx.albedo*100)}%) yields minimal rear reflection (+${ctx.rearGain}% gain).`);
      } else {
        lines.push(`Excellent on reflective surface: High albedo (~${Math.round(ctx.albedo*100)}%) delivers strong +${ctx.rearGain}% backside energy harvest.`);
      }
    } else if (panel.id === 'poly') {
      lines.push(`Discontinued legacy multi-crystal silicon: High degradation and low 16% efficiency.`);
    } else if (panel.id === 'thin') {
      lines.push(`Thin-film offers superior low-temperature loss (${spec.tempCoeff}%/°C) and diffuse light capture, but requires ~2× roof area.`);
    } else if (panel.id === 'perc') {
      lines.push(`High reliability PERC architecture with balanced 22.5% efficiency and passivated rear layer.`);
    } else if (panel.id === 'mono') {
      lines.push(`Proven single-crystal standard with 21% efficiency for predictable commercial generation.`);
    }

    return lines;
  }
}

function clamp(val, min = 0, max = 1) {
  return Math.min(max, Math.max(min, val));
}
