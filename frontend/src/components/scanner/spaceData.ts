export interface FixMethod {
  id: string;
  name: string;
  nameTa: string;
  tag: string;
  tagColor: string;
  shortFix: string;
  shortFixTa: string;
  installDifficulty: string;
  steps: string[];
  stepsTa: string[];
  costEstimate: string;
  monthlySavings: string;
  capacityKw: number;
  dailyYieldKwh: number;
  efficiencyBoost: string;
  arVisualType: 'tilt_rack' | 'pergola' | 'balcony_hook' | 'flush_clamp' | 'wall_awning' | 'ground_mount';
}

export interface SpacePreset {
  id: string;
  name: string;
  nameTa: string;
  icon: string;
  description: string;
  lux: number;
  tiltAngle: number;
  heading: string;
  areaSqFt: number;
  maxPanels: number;
  mockBgImage: string;
  fixWays: FixMethod[];
}

export const SPACE_PRESETS: SpacePreset[] = [
  {
    id: 'flat_terrace',
    name: 'Flat Rooftop Terrace',
    nameTa: 'மொட்டை மாடி (Flat Roof)',
    icon: '🏢',
    description: 'High sun exposure, concrete slab with zero shading obstructions.',
    lux: 920,
    tiltAngle: 28,
    heading: '185° S',
    areaSqFt: 350,
    maxPanels: 12,
    mockBgImage: 'linear-gradient(135deg, #132227 0%, #1c333b 50%, #101c20 100%)',
    fixWays: [
      {
        id: 'tilt_ballast',
        name: 'Optimal 28° South Tilt Rack',
        nameTa: 'தெற்கு சாய்வு சட்டகம் (28° Tilt)',
        tag: 'HIGHEST ENERGY',
        tagColor: 'text-amber bg-amber/20 border-amber/40',
        shortFix: 'Galvanized triangular frames held by heavy concrete ballast blocks. Zero roof puncture, zero water leaks!',
        shortFixTa: 'கான்கிரீட் பிளாக் மூலம் துளையிடாமல் எளிதாக வைக்கும் முக்கோண சட்டகம். கூரையில் தண்ணீர் கசியாது!',
        installDifficulty: '2 - 3 Hours',
        steps: [
          'Place triangular ballast blocks facing True South (180°)',
          'Bolt aluminum mounting rails across stands',
          'Fasten 400W solar modules with mid/end clamps & plug MC4'
        ],
        stepsTa: [
          'தெற்கு திசை நோக்கி முக்கோண ஸ்டாண்டுகளை வைக்கவும்',
          'அலுமினிய தண்டவாளங்களை போல்ட் மூலம் இணைக்கவும்',
          'சோலார் பேனல்களை கிளிம்ப் செய்து வயரை இணைக்கவும்'
        ],
        costEstimate: '₹1,25,000',
        monthlySavings: '₹3,400 / mo',
        capacityKw: 3.2,
        dailyYieldKwh: 14.5,
        efficiencyBoost: '+28% Yield',
        arVisualType: 'tilt_rack'
      },
      {
        id: 'solar_pergola',
        name: 'Elevated Solar Pergola (8ft)',
        nameTa: 'மேற்கூரை பந்தல் முறை (Pergola Canopy)',
        tag: '100% USABLE SPACE',
        tagColor: 'text-teal bg-teal/20 border-teal/40',
        shortFix: '8ft tall structural pillars forming a beautiful walk-in gazebo. Sit, walk, dry clothes underneath in cool shade!',
        shortFixTa: '8 அடி உயர தூண்களுடன் கூடிய பந்தல். கீழே மாடியை முழுமையாக பயன்படுத்தலாம்!',
        installDifficulty: '1 Day',
        steps: [
          'Anchor 4 GI corner columns to parapet/terrace beams',
          'Lay overhead waterproof rafter grid',
          'Fit bi-facial glass modules to create a shaded waterproof roof'
        ],
        stepsTa: [
          '4 மூலையிலும் 8 அடி உயர தூண்களை பொருத்தவும்',
          'மேலே நீர்ப்புகா குறுக்கு சட்டங்களை இணைக்கவும்',
          'இருபக்க சோலார் கிளாஸ் அமைத்து நிழல் கூரை உருவாக்கவும்'
        ],
        costEstimate: '₹1,75,000',
        monthlySavings: '₹4,600 / mo',
        capacityKw: 4.5,
        dailyYieldKwh: 19.8,
        efficiencyBoost: '+34% Dual-Use',
        arVisualType: 'pergola'
      },
      {
        id: 'low_profile_flush',
        name: 'Low-Profile Wind Shield Grid',
        nameTa: 'காற்றெதிர்ப்பு தாழ்வு சட்டகம் (Low Profile)',
        tag: 'CYCLONE SAFE',
        tagColor: 'text-blue bg-blue/20 border-blue/40',
        shortFix: 'Aerodynamic low-angle (12°) structure designed to withstand severe cyclone winds up to 180 km/h.',
        shortFixTa: 'புயல் காற்றை தாங்கும் குறைந்த உயர சட்டகம். அதிக பாதுகாப்பு!',
        installDifficulty: '2 Hours',
        steps: [
          'Place low-stance 12° wind-deflector mounts',
          'Lock panels with anti-theft security bolts',
          'Ground all frames to terrace lightning conductor'
        ],
        stepsTa: [
          '12° கோணத்தில் காற்று விலக்கும் ஸ்டாண்டுகளை வைக்கவும்',
          'பாதுகாப்பு போல்ட் மூலம் பேனலை பூட்டவும்',
          'இடிதாங்கி எர்த்திங் வயருடன் இணைக்கவும்'
        ],
        costEstimate: '₹1,10,000',
        monthlySavings: '₹2,950 / mo',
        capacityKw: 2.8,
        dailyYieldKwh: 12.2,
        efficiencyBoost: '180 km/h Wind Safe',
        arVisualType: 'tilt_rack'
      }
    ]
  },
  {
    id: 'balcony',
    name: 'Balcony Railing / Grill',
    nameTa: 'அபார்ட்மெண்ட் பால்கனி (Balcony Grill)',
    icon: '🏢',
    description: 'Perfect for rented flats and apartments with sunny south or west railings.',
    lux: 780,
    tiltAngle: 65,
    heading: '210° SW',
    areaSqFt: 60,
    maxPanels: 2,
    mockBgImage: 'linear-gradient(135deg, #1b242e 0%, #253342 50%, #151d26 100%)',
    fixWays: [
      {
        id: 'balcony_hanging_hook',
        name: 'Balcony Railing Hook & Plug',
        nameTa: 'பால்கனி தொங்கு முறை (Plug & Play)',
        tag: 'ZERO DRILLING • 15 MIN DIY',
        tagColor: 'text-green bg-green/20 border-green/40',
        shortFix: 'Hang directly on balcony railing using stainless steel safety hooks. Plug micro-inverter into standard 16A wall socket!',
        shortFixTa: 'பால்கனி கிரில்லில் கொக்கிகளால் மாட்டி, சாதாரண 16A சுவிட்ச் போர்டில் பிளக் செய்தால் போதும்!',
        installDifficulty: '15 Mins DIY',
        steps: [
          'Loop dual stainless steel carabiner hooks over balcony railing',
          'Tighten anti-sway lower bumper clamps',
          'Plug 800W microinverter cable straight into 16A wall socket!'
        ],
        stepsTa: [
          'பால்கனி கிரில் மீது பாதுகாப்பு கொக்கிகளை மாட்டவும்',
          'கீழ் பக்க கிளிம்புகளை இறுக்கமாக மாட்டவும்',
          'மைக்ரோ இன்வெர்ட்டர் வயரை வீட்டில் உள்ள 16A சாக்கெட்டில் சொருகவும்'
        ],
        costEstimate: '₹34,000',
        monthlySavings: '₹950 / mo',
        capacityKw: 0.8,
        dailyYieldKwh: 3.6,
        efficiencyBoost: 'Plug & Play',
        arVisualType: 'balcony_hook'
      },
      {
        id: 'balcony_tilt_bracket',
        name: 'Adjustable 30°-60° Tilt Arm',
        nameTa: 'கோணம் மாற்றும் சாய்வு கைப்பிடி (Tilt Arm)',
        tag: '+22% WINTER SUN',
        tagColor: 'text-amber bg-amber/20 border-amber/40',
        shortFix: 'Telescopic arm lets you tilt panel outward for summer noon sun or pull flush to avoid rain.',
        shortFixTa: 'வெயிலுக்கு ஏற்ப வெளியே தள்ளவோ உள்ளே மடிக்கவோ முடியும் வசதியான ஆர்ம்!',
        installDifficulty: '30 Mins',
        steps: [
          'Attach top pivot hinge to railing rail',
          'Adjust bottom telescope strut to 45° angle',
          'Tighten hand-knob locks'
        ],
        stepsTa: [
          'ரெயிலிங்கில் மேல் கீல் இணைப்பை மாட்டவும்',
          'கீழ் உள்ள ராடை 45° கோணத்தில் நீட்டவும்',
          'கைப்பிடி நட்டை கையால் இறுக்கவும்'
        ],
        costEstimate: '₹38,000',
        monthlySavings: '₹1,150 / mo',
        capacityKw: 0.9,
        dailyYieldKwh: 4.1,
        efficiencyBoost: '+22% Sun Capture',
        arVisualType: 'balcony_hook'
      }
    ]
  },
  {
    id: 'sloped_roof',
    name: 'Sloped Tile / Tin Roof',
    nameTa: 'சாய்வு கூரை (Sloped Roof)',
    icon: '🏠',
    description: 'Existing pitch naturally provides water drainage and optimal solar angle.',
    lux: 890,
    tiltAngle: 22,
    heading: '175° S',
    areaSqFt: 280,
    maxPanels: 10,
    mockBgImage: 'linear-gradient(135deg, #2b1f1a 0%, #3d2b24 50%, #201713 100%)',
    fixWays: [
      {
        id: 'flush_ridge_clamp',
        name: 'Flush Seam Clamp (Zero Penetration)',
        nameTa: 'நேரடி கிளிம்ப் முறை (Flush Clamp)',
        tag: 'ZERO LEAKAGE RISK',
        tagColor: 'text-teal bg-teal/20 border-teal/40',
        shortFix: 'Direct clamp onto metal standing seams or under tile brackets. No holes drilled through your roof sheets!',
        shortFixTa: 'கூரை தகட்டில் துளையிடாமல் விளிம்பில் கிளிம்ப் செய்யும் முறை. லீக்கேஜ் பயமே இல்லை!',
        installDifficulty: '2 - 3 Hours',
        steps: [
          'Torque standing-seam clamps onto sheet ribs',
          'Mount lightweight aluminum rail runners',
          'Drop panels flush; creates low-profile architectural look'
        ],
        stepsTa: [
          'கூரை விளிம்புகளில் பிரத்யேக கிளிம்புகளை பொருத்தவும்',
          'மெல்லிய அலுமினிய தண்டவாளங்களை இணைக்கவும்',
          'பேனல்களை நேர்த்தியாக அடுக்கி கிளிம்ப் செய்யவும்'
        ],
        costEstimate: '₹1,05,000',
        monthlySavings: '₹2,800 / mo',
        capacityKw: 2.6,
        dailyYieldKwh: 11.8,
        efficiencyBoost: 'Zero Roof Holes',
        arVisualType: 'flush_clamp'
      },
      {
        id: 'counter_tilt_strut',
        name: 'Counter-Tilt Orientation Strut',
        nameTa: 'திசை திருப்பு சட்டகம் (Counter-Tilt)',
        tag: 'FIXES WRONG ROOF FACING',
        tagColor: 'text-amber bg-amber/20 border-amber/40',
        shortFix: 'If your roof slopes East/West, this elevated strut lifts panels toward South for 35% higher energy yield.',
        shortFixTa: 'கூரை கிழக்கு/மேற்கு இருந்தால், தெற்கு நோக்கி உயர்த்தி வைத்து 35% கூடுதல் மின்சாரம் எடுக்கலாம்!',
        installDifficulty: '4 Hours',
        steps: [
          'Attach variable-height rear strut posts to roof purlins',
          'Align panel face exactly toward True South (180°)',
          'Secure high-tensile cross-bracing against winds'
        ],
        stepsTa: [
          'உயரத்தை கூட்டும் பின் தூண்களை கூரை பீமில் இணைக்கவும்',
          'பேனலை துல்லியமாக தெற்கு திசை நோக்கி திருப்பவும்',
          'காற்று அசைக்காமல் குறுக்கு கம்பிகளை இணைக்கவும்'
        ],
        costEstimate: '₹1,20,000',
        monthlySavings: '₹3,200 / mo',
        capacityKw: 3.0,
        dailyYieldKwh: 13.5,
        efficiencyBoost: '+35% Azimuth Gain',
        arVisualType: 'tilt_rack'
      }
    ]
  },
  {
    id: 'car_porch',
    name: 'Car Porch / Parking Shed',
    nameTa: 'கார் பார்க்கிங் ஷெட் (Car Porch)',
    icon: '🚗',
    description: 'Shade your vehicle from intense heat while turning your driveway into a power station.',
    lux: 860,
    tiltAngle: 15,
    heading: '190° S',
    areaSqFt: 220,
    maxPanels: 8,
    mockBgImage: 'linear-gradient(135deg, #1c2725 0%, #263835 50%, #15201e 100%)',
    fixWays: [
      {
        id: 'solar_carport_canopy',
        name: 'Cantilever Solar Carport',
        nameTa: 'சோலார் கார் ஷெட் பந்தல் (Solar Carport)',
        tag: 'CAR SHADE + EV CHARGING',
        tagColor: 'text-green bg-green/20 border-green/40',
        shortFix: 'Cantilever arch columns that shelter 1-2 cars. Generates clean power directly into your home or EV charger!',
        shortFixTa: 'காரை வெயிலில் இருந்து பாதுகாக்கும் அழகான கூரை + வீட்டிற்கும் மின்சாரம்!',
        installDifficulty: '1 Day',
        steps: [
          'Erect dual arched heavy-duty steel columns',
          'Fit rubber gasket waterproof interlocking rails',
          'Mount 8 bi-facial glass panels for overhead roof + 15A EV plug'
        ],
        stepsTa: [
          'வளைந்த பலமான எஃகு தூண்களை பொருத்தவும்',
          'நீர்ப்புகா ரப்பர் கேஸ்கெட் தண்டவாளங்களை அமைக்கவும்',
          '8 கிளாஸ் பேனல்களை கூரையாக அமைத்து EV சார்ஜருடன் இணைக்கவும்'
        ],
        costEstimate: '₹1,50,000',
        monthlySavings: '₹3,900 / mo',
        capacityKw: 3.6,
        dailyYieldKwh: 16.2,
        efficiencyBoost: 'Car Cools by 12°C',
        arVisualType: 'pergola'
      }
    ]
  },
  {
    id: 'window_ledge',
    name: 'Window Sill / Sunshade Ledge',
    nameTa: 'ஜன்னல் சன்ஷேட் (Window Ledge)',
    icon: '🪟',
    description: 'Compact vertical or awning installations for sunny south and west room walls.',
    lux: 750,
    tiltAngle: 45,
    heading: '225° SW',
    areaSqFt: 40,
    maxPanels: 2,
    mockBgImage: 'linear-gradient(135deg, #22222a 0%, #2d2d38 50%, #17171d 100%)',
    fixWays: [
      {
        id: 'window_awning_shade',
        name: 'Window Solar Awning Canopy',
        nameTa: 'ஜன்னல் சூரிய நிழற்கூரை (Solar Awning)',
        tag: 'CUTS ROOM AC BILL BY 30%',
        tagColor: 'text-amber bg-amber/20 border-amber/40',
        shortFix: 'Mounted at 45° angle over windows. Blocks harsh afternoon sun heat into the bedroom while powering room appliances!',
        shortFixTa: 'ஜன்னலுக்கு மேல் 45° நிழற்கூரையாக அமைப்பது. அறை சூடாவதை தடுத்து மின்சாரம் தரும்!',
        installDifficulty: '1 Hour',
        steps: [
          'Anchor triangular heavy brackets into lintel beam with M10 expansion bolts',
          'Bolt 1 or 2 high-efficiency 400W panels as an awning roof',
          'Route DC wire through AC conduit to indoor microinverter'
        ],
        stepsTa: [
          'ஜன்னல் லிண்டல் பீமில் பலமான ஆங்கர் போல்ட் மூலம் பிராக்கெட்டை பொருத்தவும்',
          '400W பேனலை சாய்வாக நிழற்கூரையாக இணைக்கவும்',
          'வயரை வீட்டிற்குள் கொண்டு சென்று பிளக் செய்யவும்'
        ],
        costEstimate: '₹38,000',
        monthlySavings: '₹1,100 / mo',
        capacityKw: 0.8,
        dailyYieldKwh: 3.5,
        efficiencyBoost: '-4°C Room Cooling',
        arVisualType: 'wall_awning'
      }
    ]
  },
  {
    id: 'open_ground',
    name: 'Open Lawn / Garden Ground',
    nameTa: 'திறந்த வெளி / தோட்டம் (Open Ground)',
    icon: '🌿',
    description: 'Abundant open area with unrestricted sun path from sunrise to sunset.',
    lux: 950,
    tiltAngle: 25,
    heading: '180° S',
    areaSqFt: 500,
    maxPanels: 16,
    mockBgImage: 'linear-gradient(135deg, #182618 0%, #223822 50%, #121c12 100%)',
    fixWays: [
      {
        id: 'ground_rammed_post',
        name: 'Ground Screw Foundation Mount',
        nameTa: 'தரை ஆங்கர் சட்டகம் (Ground Mount)',
        tag: 'EASY EXPANSION • MAX AIRFLOW',
        tagColor: 'text-green bg-green/20 border-green/40',
        shortFix: 'Heavy ground screws driven into soil. Cool grass underneath keeps panels 8°C cooler for +6% extra efficiency!',
        shortFixTa: 'தரையில் திருகி இறக்கும் ஆங்கர் போல்ட்கள். புல்வெளி குளிர்ச்சி கூடுதல் மின்சாரம் தரும்!',
        installDifficulty: '3 Hours',
        steps: [
          'Drive helical ground screws 1m into soil using hand wrench',
          'Bolt horizontal purlin tubes at 25° South tilt',
          'Install panels with quick-snap clamps'
        ],
        stepsTa: [
          'தரையில் 1 மீட்டர் ஆழத்தில் ஹெலிகல் ஸ்க்ரூவை பொருத்தவும்',
          '25° தெற்கு கோணத்தில் சட்டகத்தை இணைக்கவும்',
          'பேனல்களை லாக் செய்து முடிக்கவும்'
        ],
        costEstimate: '₹1,40,000',
        monthlySavings: '₹4,100 / mo',
        capacityKw: 4.0,
        dailyYieldKwh: 18.5,
        efficiencyBoost: '+6% Natural Cooling',
        arVisualType: 'ground_mount'
      }
    ]
  }
];
