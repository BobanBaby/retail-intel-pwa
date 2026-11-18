export type StoreType =
  | "Salon / Parlour"
  | "Cosmetic Specialist"
  | "Chemist / Pharmacy"
  | "Supermarket / Modern Trade"
  | "Kirana / General Store"
  | "Wholesale / Distributor";

export interface Store {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  type: StoreType;
  state: string;
  district: string;
  area: string;
  pincode?: string;
  gpsLat?: number;
  gpsLng?: number;
  addedByRep: string;
  createdAt: string;
}

export type ShelfPosition =
  | "Eye Level (Prime)"
  | "Top Shelf"
  | "Middle Shelf"
  | "Bottom Shelf"
  | "Behind / On Counter";

export type TurnoverSpeed =
  | "Fast (>5 units/wk)"
  | "Moderate (2-5 units/wk)"
  | "Slow (<2 units/wk)";

export type UnitType = "ml" | "gm" | "kg" | "litres" | "pcs / sachet";

export interface ProductCategoryConfig {
  id: string;
  name: string;
  unit: UnitType;
  unitStepLabel: string;
  defaultSizes: number[];
  brands: {
    brand: string;
    variants: string[];
    commonSizes: number[];
    typicalMargin: number;
  }[];
}

export interface AuditRecord {
  id: string;
  category: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  state: string;
  district: string;
  area: string;
  repName: string;
  brand: string;
  variant: string;
  packSize: number;
  unit: UnitType;
  mrp: number;
  retailerCost: number;
  retailerMarginPct: number;
  customerPrice: number;
  shelfFacings: number;
  shelfPosition: ShelfPosition;
  turnoverSpeed: TurnoverSpeed;
  photoData?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  synced: boolean;
}

export interface RepSummary {
  repName: string;
  totalAudits: number;
  shopsCovered: number;
  districtsVisited: string[];
  lastActive: string;
}

export const PRODUCT_CATEGORIES: ProductCategoryConfig[] = [
  {
    id: "hair-spray",
    name: "Hair Spray & Styling",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [50, 75, 100, 150, 180, 200, 250, 400],
    brands: [
      {
        brand: "Gatsby",
        variants: ["Set & Keep Super Hard", "Moving Rubber Extreme", "Long Keep Spray"],
        commonSizes: [66, 180, 250],
        typicalMargin: 20,
      },
      {
        brand: "Schwarzkopf / Taft",
        variants: ["Power Cashmere Touch", "Ultimate Hold 5+", "Keratin Ultra Strong"],
        commonSizes: [75, 250],
        typicalMargin: 22,
      },
      {
        brand: "Set Wet",
        variants: ["Spunky Style Spray", "Ultra Hold", "Wet Look Spray"],
        commonSizes: [50, 150, 200],
        typicalMargin: 25,
      },
      {
        brand: "UrbanGabru",
        variants: ["Frozt Extreme Hold", "Zero Gravity", "Matte Finish"],
        commonSizes: [100, 200],
        typicalMargin: 30,
      },
      {
        brand: "L'Oréal Paris",
        variants: ["Elnett Satin Extra Strong", "Professionnel Tecni.Art 6-Fix"],
        commonSizes: [75, 200, 400],
        typicalMargin: 18,
      },
      {
        brand: "Berina",
        variants: ["Super Firm Hold", "Pro Salon Hair Spray"],
        commonSizes: [250, 400],
        typicalMargin: 32,
      },
      {
        brand: "Nova",
        variants: ["Gold Super Firm", "Classic Touch"],
        commonSizes: [250, 400],
        typicalMargin: 35,
      },
    ],
  },
  {
    id: "hair-oil",
    name: "Hair Oil & Serums",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [50, 100, 150, 200, 300, 500],
    brands: [
      {
        brand: "Parachute",
        variants: ["100% Pure Coconut", "Advansed Aloe Vera", "Ayurvedic Gold"],
        commonSizes: [100, 200, 300, 500],
        typicalMargin: 15,
      },
      {
        brand: "Bajaj",
        variants: ["Almond Drops", "Coco Onion"],
        commonSizes: [100, 200, 300],
        typicalMargin: 18,
      },
      {
        brand: "Dabur",
        variants: ["Amla Hair Oil", "Vatika Enriched Coconut", "Badam Tail"],
        commonSizes: [100, 200, 450],
        typicalMargin: 17,
      },
      {
        brand: "Livon",
        variants: ["Damage Protect Serum", "Moroccan Silk"],
        commonSizes: [50, 100],
        typicalMargin: 22,
      },
      {
        brand: "Indulekha",
        variants: ["Bringha Ayurvedic Oil", "Neem Dandruff Oil"],
        commonSizes: [50, 100, 250],
        typicalMargin: 20,
      },
    ],
  },
  {
    id: "shampoo",
    name: "Shampoo & Conditioners",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [80, 180, 340, 650, 1000],
    brands: [
      {
        brand: "Head & Shoulders",
        variants: ["Cool Menthol", "Anti-Hairfall", "Smooth & Silky"],
        commonSizes: [180, 340, 650],
        typicalMargin: 14,
      },
      {
        brand: "Dove",
        variants: ["Intense Repair", "Daily Shine", "Hair Fall Rescue"],
        commonSizes: [180, 340, 650],
        typicalMargin: 15,
      },
      {
        brand: "Clinic Plus",
        variants: ["Strong & Long", "Egg Protein"],
        commonSizes: [80, 175, 340],
        typicalMargin: 12,
      },
      {
        brand: "Tresemme",
        variants: ["Keratin Smooth", "Botanique Nourish", "Hair Fall Defense"],
        commonSizes: [185, 370, 580],
        typicalMargin: 18,
      },
    ],
  },
  {
    id: "skincare-facewash",
    name: "Face Wash & Skincare",
    unit: "gm",
    unitStepLabel: "per 100g",
    defaultSizes: [50, 100, 150, 200],
    brands: [
      {
        brand: "Himalaya",
        variants: ["Purifying Neem", "Clear Complexion", "Oil Clear Lemon"],
        commonSizes: [50, 100, 150, 200],
        typicalMargin: 20,
      },
      {
        brand: "Garnier Men",
        variants: ["TurboBright Anti-Pollution", "AcnoFight", "PowerWhite"],
        commonSizes: [50, 100, 150],
        typicalMargin: 18,
      },
      {
        brand: "Nivea Men",
        variants: ["Dark Spot Reduction", "All-in-1 Charcoal", "Deep Clean"],
        commonSizes: [50, 100],
        typicalMargin: 19,
      },
      {
        brand: "Pond's",
        variants: ["Bright Beauty", "Pure Detox Activated Charcoal"],
        commonSizes: [50, 100, 200],
        typicalMargin: 16,
      },
      {
        brand: "Mamaearth",
        variants: ["Ubtan Face Wash", "Tea Tree Anti-Acne", "Vitamin C"],
        commonSizes: [100, 150],
        typicalMargin: 28,
      },
    ],
  },
  {
    id: "deodorant-perfume",
    name: "Deodorant & Body Spray",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [120, 150, 200, 250],
    brands: [
      {
        brand: "Fogg",
        variants: ["Marco", "Napoleon", "Bleu Ocean", "Scent Xpressio"],
        commonSizes: [120, 150],
        typicalMargin: 22,
      },
      {
        brand: "Denver",
        variants: ["Hamilton", "Caliber", "Imperial", "Sporting Club"],
        commonSizes: [165, 200],
        typicalMargin: 25,
      },
      {
        brand: "Wild Stone",
        variants: ["Edge", "Ultra Sensual", "Forest Spice"],
        commonSizes: [120, 150],
        typicalMargin: 24,
      },
    ],
  },
  {
    id: "general-fmcg",
    name: "Other FMCG / General Product",
    unit: "gm",
    unitStepLabel: "per unit",
    defaultSizes: [50, 100, 250, 500, 1000],
    brands: [],
  },
];
