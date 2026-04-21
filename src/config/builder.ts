export interface BuilderConfig {
  builder: {
    name: string;
    portalUrl: string;
    portalName: string;
  };
  user: {
    name: string;
    email: string;
    role: string;
    community: string;
    communityId: string;
    region: string;
    market: string;
  };
  scarStages: string[];
  plans: string[];
  fieldContacts: string[];
  tradePartners: Record<string, string>;
}

export const config: BuilderConfig = {
  builder: {
    name: 'Pulte Homes',
    portalUrl: 'https://pcp.pulte.com/portal/home',
    portalName: 'PCP Portal',
  },
  user: {
    name: '',
    email: '',
    role: 'Construction Manager',
    community: '',
    communityId: '',
    region: '',
    market: '',
  },
  scarStages: ['Start', 'Frame', 'Second', 'Final'],
  plans: ['Hewitt 80080', 'Mesilla 80120', 'Sandalwood 80090', 'Dinero 82230', 'Becket 80060', 'Enloe 82240'],
  fieldContacts: [],
  tradePartners: {
    'Roofing': 'PVR Construction LLC',
    'Gutters': 'South Kodiak LLC',
    'Framing / Siding': 'Southern Framing, LLC',
    'Masonry / Stone': 'Leander 3T, LLC',
    'Stucco / Plastering': 'FE Integrity Plastering, Inc.',
    'Fencing': 'Discount Fence Enterprises USA LLC',
    'Concrete': 'Landreth Construction',
    'Landscaping / Irrigation': 'CTX Proscapes LLC',
    'Painting & Touch-Up': 'Olvin & Fugon Remodeling LLC',
    'Drywall': 'Steadfast Drywall LLC',
    'Trim / Baseboard / Caulk': 'O&V Carpentry & Building Services',
    'Door Hardware': 'Premier Stair and Door LLC',
    'Stairs / Flooring': 'Floors, LLC',
    'Cabinets / Countertops': 'Stonite of Central Texas LLC',
    'Mirrors / Shower Glass': 'Arrow Glass Industries',
    'Electrical': 'In Charge Electrical Services, LLC',
    'Plumbing': 'Victory Plumbing Company',
    'HVAC': 'Casa Mechanical Services HVAC',
    'Insulation': 'Builders Insulation of TX, LLC',
    'Windows': 'FLP Enterprises LLC',
    'Garage Door': 'Eco Garage Door Services',
    'Appliances': 'Whirlpool Corporation',
    'General Cleaning': 'Urban Fundamental LLC',
    'Pest Control': 'Massey Services Inc.',
  },
};
