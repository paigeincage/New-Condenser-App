// ═══════════════════════════════════════════════
// THE CONDENSER — Trade Taxonomy (Single Source of Truth)
// Every classification (vision, keyword, AI) uses this file.
// ═══════════════════════════════════════════════

export const TRADES = [
  'Painting & Touch-Up',
  'Trim / Baseboard / Caulk',
  'Stairs / Flooring',
  'Plumbing',
  'HVAC',
  'Door Hardware',
  'Drywall',
  'Concrete',
  'Framing / Siding',
  'Windows',
  'Garage',
  'Garage Door',
  'General Cleaning',
  'Landscaping / Irrigation',
  'Gutters',
  'Electrical',
  'Roofing',
  'Insulation',
  'Appliances',
  'Cabinets / Countertops',
  'Masonry / Stone',
  'Mirrors / Shower Glass',
  'Stucco / Plastering',
  'Fencing',
  'Pest Control',
] as const;

export type Trade = (typeof TRADES)[number] | 'Uncategorized';

export const TRADE_KEYWORDS: Record<string, string[]> = {
  'Painting & Touch-Up': [
    'paint', 'stain', 'touch up', 'touchup', 'primer', 'repaint', 'overspray',
    'roller marks', 'brush marks', 'color match', 'not fully painted', 'texture flaws',
    'painting', 'sheetrock texture', 'scuff marks', 'paint patch',
  ],
  'Trim / Baseboard / Caulk': [
    'trim', 'baseboard', 'caulk', 'caulking', 'molding', 'shoe mold', 'crown',
    'wainscot', 'chair rail', 'escutcheon', 'sealant', 'casing', 'not fully caulked',
    're-caulk', 'nail holes', 'shoe molding', 'skirt board',
  ],
  'Stairs / Flooring': [
    'flooring', 'tile floor', 'stair', 'baluster', 'railing', 'vinyl plank',
    'hardwood', 'grout', 'carpet', 'laminate', 'tread', 'riser', 'newel',
    'handrail', 'transition strip', 'newel post', 'staircase', 'stairway',
    'tile punch', 'backsplash grout', 'cracked tile', 'grout gap',
  ],
  'Plumbing': [
    'plumb', 'faucet', 'drain', 'pipe', 'leak', 'shower', 'tub', 'toilet',
    'sink', 'water heater', 'disposal', 'supply line', 'shut-off', 'p-trap',
    'water pressure', 'pr valve', 'shower diverter', 'shower hardware',
    'toilet tank', 'bathtub faucet', 'tankless', 'drain line', 'flue',
    'psi', 'plumbing supply',
  ],
  'HVAC': [
    'hvac', 'air condition', 'ductwork', 'air vent', 'furnace', 'air filter',
    'thermostat', 'refrigerant', 'evaporator', 'return air', 'register cover',
    'condenser unit', 'refrigerant lines', 'vent registers', 'air leaks',
    'evaporator coil', 'cooling system', 'heating', 'delta-t', 'venthood',
  ],
  'Door Hardware': [
    'door', 'hinge', 'knob', 'lock', 'handle', 'jamb', 'threshold', 'deadbolt',
    'weatherstrip', 'strike plate', 'latch', 'bifold', 'door stop', 'dead bolt',
    'attic access door', 'rear entry door', 'garage entry door', 'weather stripping',
    'door does not latch', 'door rubbing',
  ],
  'Drywall': [
    'drywall', 'nail pop', 'nail pops', 'ceiling nail', 'joint compound',
    'skim coat', 'corner bead', 'non-structural cracking', 'drywall crack',
    'sheetrock punch', 'sheetrock', 'interior wall crack',
  ],
  'Concrete': [
    'concrete', 'slab', 'sidewalk', 'driveway', 'flatwork', 'expansion joint',
    'control joint', 'foundation', 'stress cracks', 'support posts', 'column post',
    'porch post', 'porch slab', 'corner pop',
  ],
  'Framing / Siding': [
    'framing', 'siding', 'sheathing', 'soffit', 'fascia', 'wall flashing',
    'house wrap', 'siding panel', 'corner trim board', 'gap in siding',
    'kick-out flashing', 'attic ladder', 'joist', 'truss',
    'cornice', 'decking', 'wall panel',
  ],
  'Windows': [
    'window', 'glass', 'screen', 'sash', 'glazing', 'weep hole', 'mullion',
    'sill drain', 'flappers', 'window lock', 'window screen',
  ],
  'Garage': [
    'garage floor', 'garage wall', 'garage ceiling', 'garage opener',
    'fire separation', 'dwelling-garage', 'improper material on garage',
  ],
  'Garage Door': [
    'garage door', 'garage seal', 'garage track', 'garage spring',
    'garage door operator', 'bottom seal', 'force settings',
  ],
  'General Cleaning': [
    'clean', 'trash', 'debris', 'sweep', 'dust', 'wipe', 'vacuum', 'mop',
    'sticker', 'label', 'final clean', 'window clean', 'remove debris',
    'pressure wash', 'pressure clean',
  ],
  'Landscaping / Irrigation': [
    'landscape', 'sprinkler', 'irrigation', 'grading', 'sod', 'mulch',
    'erosion', 'retaining wall', 'freeze sensor',
    'sprinkler system', 'downspout discharge', 'storm water',
  ],
  'Gutters': [
    'gutter', 'downspout', 'splash block', 'gutter guard', 'gutter discharge',
  ],
  'Electrical': [
    'electric', 'outlet', 'switch', 'light fixture', 'light switch', 'wire',
    'breaker', 'gfci', 'arc fault', 'receptacle', 'junction box', 'bulb',
    'grounding', 'service panel', 'floor receptacle', 'low voltage',
    'copper wiring', 'conduit', 'oven trips', 'breaker trips',
  ],
  'Roofing': [
    'roof', 'shingle', 'ridge', 'valley', 'eave', 'drip edge',
    'starter strip', 'starter course', 'kick-out', 'roof covering',
    'composition shingles', 'roof structure', 'dry-in',
  ],
  'Insulation': [
    'insulation', 'r-value', 'blown-in', 'batt', 'foam', 'vapor barrier',
    'weather seal', 'radiant barrier', 'blown insulation', 'poly',
    'insulated cover', 'attic insulation',
  ],
  'Appliances': [
    'appliance', 'dishwasher', 'microwave', 'range', 'oven', 'refrigerator',
    'washer', 'dryer', 'dryer vent', 'dryer exhaust', 'vent pipe',
  ],
  'Cabinets / Countertops': [
    'cabinet', 'countertop', 'drawer', 'shelf', 'lazy susan', 'pull-out',
    'soft close', 'granite', 'quartz', 'cabinet panel', 'cabinet drawer',
    'rear panel', 'lower cabinets', 'stone counter',
  ],
  'Masonry / Stone': [
    'masonry', 'brick', 'weep holes', 'masonry veneer', 'wall ties',
    'mortar', 'stone veneer', 'stone labor',
  ],
  'Mirrors / Shower Glass': [
    'mirror', 'shower door', 'shower glass', 'shower enclosure',
    'mirror frame',
  ],
  'Stucco / Plastering': [
    'stucco', 'plastering', 'underpinning',
  ],
  'Fencing': [
    'fence', 'fencing', 'gate',
  ],
  'Pest Control': [
    'termite', 'pest defense', 'pest control',
  ],
};

export const PRIORITY_KEYWORDS: Record<string, 'hot' | 'elevated'> = {
  'urgent': 'hot',
  'asap': 'hot',
  'immediately': 'hot',
  'safety hazard': 'hot',
  'safety concern': 'hot',
  'water damage': 'hot',
  'mold': 'hot',
  'code violation': 'hot',
  'not to code': 'hot',
  'active leak': 'elevated',
  'active water': 'elevated',
  'moisture intrusion': 'elevated',
};

/** L0 keyword classification — instant, free */
export function classifyByKeyword(text: string): { trade: string; confidence: number } | null {
  const lower = text.toLowerCase();
  let bestTrade: string | null = null;
  let bestKeywordLength = 0;
  let bestMatchCount = 0;

  for (const [trade, keywords] of Object.entries(TRADE_KEYWORDS)) {
    const matches = keywords.filter((kw) => lower.includes(kw));
    if (matches.length === 0) continue;
    const longestMatch = Math.max(...matches.map((m) => m.length));
    if (longestMatch > bestKeywordLength) {
      bestKeywordLength = longestMatch;
      bestTrade = trade;
      bestMatchCount = matches.length;
    }
  }

  if (bestTrade) {
    return { trade: bestTrade, confidence: Math.min(0.6 + bestMatchCount * 0.1, 0.85) };
  }
  return null;
}

/** Detect priority from text */
export function detectPriority(text: string): 'normal' | 'elevated' | 'hot' {
  const lower = text.toLowerCase();
  for (const [keyword, priority] of Object.entries(PRIORITY_KEYWORDS)) {
    if (lower.includes(keyword)) return priority;
  }
  return 'normal';
}

/** Build the trade list string for AI prompts */
export function tradeListForPrompt(): string {
  return TRADES.map((t) => `- ${t}`).join('\n');
}

/** Classification rules for AI prompts */
export const CLASSIFICATION_RULES = `
- If an item mentions multiple trades, pick the PRIMARY trade responsible for the fix
- "Garage door" is its own trade, separate from "Garage"
- Caulk/sealant at tubs or showers = "Trim / Baseboard / Caulk" NOT "Plumbing"
- Nail pops = "Drywall" even if they need paint after
- Floor transitions = "Stairs / Flooring"
- Grout = "Stairs / Flooring"
- Weatherstrip = "Door Hardware"
- Weep holes = "Masonry / Stone"
- Mirror frame damage = "Mirrors / Shower Glass"
- Siding panel / corner trim / gap in siding = "Framing / Siding"
- Sprinkler / freeze sensor / irrigation = "Landscaping / Irrigation"
- Breaker trips / grounding / receptacle = "Electrical"
- Starter course / kick-out flashing / shingles = "Roofing"
- Toilet / shower diverter / water pressure = "Plumbing"
- Stress cracks in porch support posts = "Concrete"
- Cabinet panel damage / drawer handles = "Cabinets / Countertops"
- Fire separation at garage ceiling = "Garage"`.trim();
