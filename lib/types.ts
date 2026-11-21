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
  city?: string;
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

export interface CompetitorBrandConfig {
  brand: string;
  variants: string[];
  commonSizes: number[];
  typicalMargin: number;
  priority?: number;
  defaultProduct?: string;
}

export interface ProductCategoryConfig {
  id: string;
  name: string;
  unit: UnitType;
  unitStepLabel: string;
  defaultSizes: number[];
  brands: CompetitorBrandConfig[];
}

export interface CustomBrandEntry {
  brand: string;
  category: string; // Category Name or Category ID
  variants: string[];
  commonSizes: number[];
  typicalMargin: number;
  priority?: number;
  defaultProduct?: string;
  unit?: UnitType;
  addedByRep?: string;
  createdAt?: string;
}

export interface CustomCategoryEntry {
  id: string;
  name: string;
  unit: UnitType;
  unitStepLabel?: string;
  defaultSizes?: number[];
  addedByRep?: string;
  createdAt?: string;
}

export interface AuditRecord {
  id: string;
  category: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  state: string;
  district: string;
  city?: string;
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
    id: "hair-elixir-women",
    name: "Hair Elixir for Women",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [50, 100, 200],
    brands: [
      {
        brand: "Indulekha",
        priority: 1,
        defaultProduct: "Bringha Hair Oil",
        variants: ["Bringha Hair Oil"],
        commonSizes: [50, 100, 250],
        typicalMargin: 18,
      },
      {
        brand: "Kesh King",
        priority: 2,
        defaultProduct: "Ayurvedic Hair Oil",
        variants: ["Ayurvedic Hair Oil"],
        commonSizes: [100, 200, 300],
        typicalMargin: 20,
      },
      {
        brand: "Mamaearth",
        priority: 3,
        defaultProduct: "Onion Hair Oil",
        variants: ["Onion Hair Oil"],
        commonSizes: [100, 150, 250],
        typicalMargin: 22,
      },
      {
        brand: "WOW Skin Science",
        priority: 4,
        defaultProduct: "Onion Black Seed Hair Oil",
        variants: ["Onion Black Seed Hair Oil"],
        commonSizes: [100, 200],
        typicalMargin: 25,
      },
      {
        brand: "Soulflower",
        priority: 5,
        defaultProduct: "Rosemary Lavender Hair Oil",
        variants: ["Rosemary Lavender Hair Oil"],
        commonSizes: [120, 225],
        typicalMargin: 24,
      },
      {
        brand: "Parachute Advansed",
        priority: 6,
        defaultProduct: "Ayurvedic Hot Oil",
        variants: ["Ayurvedic Hot Oil"],
        commonSizes: [90, 190, 300],
        typicalMargin: 16,
      },
    ],
  },
  {
    id: "hair-elixir-men",
    name: "Hair Elixir for Men",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [50, 60, 100],
    brands: [
      {
        brand: "Indulekha",
        priority: 1,
        defaultProduct: "Bringha Hair Oil",
        variants: ["Bringha Hair Oil"],
        commonSizes: [50, 100],
        typicalMargin: 18,
      },
      {
        brand: "Ustraa",
        priority: 2,
        defaultProduct: "Hair Growth Vitalizer",
        variants: ["Hair Growth Vitalizer"],
        commonSizes: [100],
        typicalMargin: 25,
      },
      {
        brand: "Beardo",
        priority: 3,
        defaultProduct: "Hair Growth Oil",
        variants: ["Hair Growth Oil"],
        commonSizes: [50],
        typicalMargin: 25,
      },
      {
        brand: "Kesh King",
        priority: 4,
        defaultProduct: "Ayurvedic Hair Oil",
        variants: ["Ayurvedic Hair Oil"],
        commonSizes: [100, 200],
        typicalMargin: 20,
      },
      {
        brand: "Man Matters",
        priority: 5,
        defaultProduct: "Hair Growth Serum",
        variants: ["Hair Growth Serum"],
        commonSizes: [60],
        typicalMargin: 28,
      },
    ],
  },
  {
    id: "liceqit-oil",
    name: "LiceQit Oil",
    unit: "ml",
    unitStepLabel: "per 50ml",
    defaultSizes: [25, 50, 100],
    brands: [
      {
        brand: "Mediker",
        priority: 1,
        defaultProduct: "Anti Lice Treatment Hair Oil",
        variants: ["Anti Lice Treatment Hair Oil"],
        commonSizes: [50, 100],
        typicalMargin: 20,
      },
      {
        brand: "Licel",
        priority: 2,
        defaultProduct: "Lice Killer Herbal Oil",
        variants: ["Lice Killer Herbal Oil"],
        commonSizes: [25, 50],
        typicalMargin: 25,
      },
      {
        brand: "Coco Crush",
        priority: 3,
        defaultProduct: "Ayurvedic Lice Remover Hair Oil",
        variants: ["Ayurvedic Lice Remover Hair Oil"],
        commonSizes: [50, 100],
        typicalMargin: 25,
      },
      {
        brand: "Himalaya",
        priority: 4,
        defaultProduct: "Anti Lice Hair Oil",
        variants: ["Anti Lice Hair Oil"],
        commonSizes: [100],
        typicalMargin: 20,
      },
      {
        brand: "Licefree",
        priority: 5,
        defaultProduct: "Anti Lice Oil",
        variants: ["Anti Lice Oil"],
        commonSizes: [50],
        typicalMargin: 25,
      },
    ],
  },
  {
    id: "dandroqit-oil",
    name: "DandroQit Oil",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [50, 100, 200],
    brands: [
      {
        brand: "Indulekha",
        priority: 1,
        defaultProduct: "Svetakutaja Dandruff Treatment Scalp Serum",
        variants: ["Svetakutaja Dandruff Treatment Scalp Serum"],
        commonSizes: [100],
        typicalMargin: 20,
      },
      {
        brand: "Trichup",
        priority: 2,
        defaultProduct: "Anti Dandruff Oil",
        variants: ["Anti Dandruff Oil"],
        commonSizes: [100, 200],
        typicalMargin: 22,
      },
      {
        brand: "Himalaya",
        priority: 3,
        defaultProduct: "Anti Dandruff Hair Oil",
        variants: ["Anti Dandruff Hair Oil"],
        commonSizes: [100, 200],
        typicalMargin: 20,
      },
      {
        brand: "Biotique",
        priority: 4,
        defaultProduct: "Bio Neem Anti Dandruff Oil",
        variants: ["Bio Neem Anti Dandruff Oil"],
        commonSizes: [120, 200],
        typicalMargin: 24,
      },
      {
        brand: "Khadi Natural",
        priority: 5,
        defaultProduct: "Neem Hair Oil",
        variants: ["Neem Hair Oil"],
        commonSizes: [210],
        typicalMargin: 25,
      },
    ],
  },
  {
    id: "nectar-cleanser",
    name: "Nectar Cleanser",
    unit: "ml",
    unitStepLabel: "per 200ml",
    defaultSizes: [100, 200, 400],
    brands: [
      {
        brand: "Patanjali",
        priority: 1,
        defaultProduct: "Kesh Kanti Aloe Vera Hair Cleanser",
        variants: ["Kesh Kanti Aloe Vera Hair Cleanser"],
        commonSizes: [200, 450],
        typicalMargin: 15,
      },
      {
        brand: "Himalaya",
        priority: 2,
        defaultProduct: "Gentle Daily Care Protein Shampoo",
        variants: ["Gentle Daily Care Protein Shampoo"],
        commonSizes: [100, 200, 400, 650],
        typicalMargin: 18,
      },
      {
        brand: "Biotique",
        priority: 3,
        defaultProduct: "Green Apple Shampoo",
        variants: ["Green Apple Shampoo"],
        commonSizes: [120, 190],
        typicalMargin: 22,
      },
      {
        brand: "Mamaearth",
        priority: 4,
        defaultProduct: "Aloe Vera Shampoo",
        variants: ["Aloe Vera Shampoo"],
        commonSizes: [250, 400],
        typicalMargin: 22,
      },
      {
        brand: "Khadi Natural",
        priority: 5,
        defaultProduct: "Amla Bhringraj Shampoo",
        variants: ["Amla Bhringraj Shampoo"],
        commonSizes: [210],
        typicalMargin: 25,
      },
    ],
  },
  {
    id: "color-protect-shampoo",
    name: "Color Protect Shampoo",
    unit: "ml",
    unitStepLabel: "per 200ml",
    defaultSizes: [175, 200, 250, 300, 340],
    brands: [
      {
        brand: "L’Oréal Paris",
        priority: 1,
        defaultProduct: "Colour Protect Shampoo",
        variants: ["Colour Protect Shampoo"],
        commonSizes: [175, 340, 650],
        typicalMargin: 18,
      },
      {
        brand: "TRESemmé",
        priority: 2,
        defaultProduct: "Pro Protect Sulphate Free Shampoo",
        variants: ["Pro Protect Sulphate Free Shampoo"],
        commonSizes: [185, 370, 580],
        typicalMargin: 20,
      },
      {
        brand: "Schwarzkopf Professional",
        priority: 3,
        defaultProduct: "BC Color Freeze Shampoo",
        variants: ["BC Color Freeze Shampoo"],
        commonSizes: [250, 1000],
        typicalMargin: 25,
      },
      {
        brand: "Wella Professionals",
        priority: 4,
        defaultProduct: "Invigo Color Brilliance Shampoo",
        variants: ["Invigo Color Brilliance Shampoo"],
        commonSizes: [250, 1000],
        typicalMargin: 25,
      },
      {
        brand: "Matrix",
        priority: 5,
        defaultProduct: "Color Obsessed Shampoo",
        variants: ["Color Obsessed Shampoo"],
        commonSizes: [200, 300, 1000],
        typicalMargin: 24,
      },
    ],
  },
  {
    id: "nectar-junior",
    name: "Nectar Junior",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [50, 100, 200, 400],
    brands: [
      {
        brand: "Johnson’s",
        priority: 1,
        defaultProduct: "Active Kids Shiny Drops Shampoo",
        variants: ["Active Kids Shiny Drops Shampoo"],
        commonSizes: [100, 200],
        typicalMargin: 16,
      },
      {
        brand: "Himalaya",
        priority: 2,
        defaultProduct: "Gentle Baby Shampoo",
        variants: ["Gentle Baby Shampoo"],
        commonSizes: [100, 200, 400],
        typicalMargin: 18,
      },
      {
        brand: "Mamaearth",
        priority: 3,
        defaultProduct: "Milky Soft Shampoo",
        variants: ["Milky Soft Shampoo"],
        commonSizes: [200, 400],
        typicalMargin: 22,
      },
      {
        brand: "Chicco",
        priority: 4,
        defaultProduct: "Baby Moments Shampoo",
        variants: ["Baby Moments Shampoo"],
        commonSizes: [100, 200, 500],
        typicalMargin: 22,
      },
      {
        brand: "Sebamed",
        priority: 5,
        defaultProduct: "Children’s Shampoo",
        variants: ["Children’s Shampoo"],
        commonSizes: [150, 500],
        typicalMargin: 20,
      },
    ],
  },
  {
    id: "beard-wash",
    name: "Beard Wash",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [60, 100, 120],
    brands: [
      {
        brand: "Ustraa",
        priority: 1,
        defaultProduct: "Beard Wash Woody",
        variants: ["Beard Wash Woody"],
        commonSizes: [60, 100],
        typicalMargin: 25,
      },
      {
        brand: "Beardo",
        priority: 2,
        defaultProduct: "Godfather Beard Wash",
        variants: ["Godfather Beard Wash"],
        commonSizes: [100],
        typicalMargin: 25,
      },
      {
        brand: "The Man Company",
        priority: 3,
        defaultProduct: "Beard Wash",
        variants: ["Beard Wash"],
        commonSizes: [100],
        typicalMargin: 25,
      },
      {
        brand: "Bombay Shaving Company",
        priority: 4,
        defaultProduct: "Beard Wash",
        variants: ["Beard Wash"],
        commonSizes: [100],
        typicalMargin: 25,
      },
      {
        brand: "UrbanGabru",
        priority: 5,
        defaultProduct: "Beard Wash",
        variants: ["Beard Wash"],
        commonSizes: [100],
        typicalMargin: 28,
      },
    ],
  },
  {
    id: "beard-oil",
    name: "Beard Oil",
    unit: "ml",
    unitStepLabel: "per 30ml",
    defaultSizes: [30, 35, 50],
    brands: [
      {
        brand: "Ustraa",
        priority: 1,
        defaultProduct: "Beard Growth Oil",
        variants: ["Beard Growth Oil"],
        commonSizes: [35],
        typicalMargin: 25,
      },
      {
        brand: "Beardo",
        priority: 2,
        defaultProduct: "Godfather Beard Oil",
        variants: ["Godfather Beard Oil"],
        commonSizes: [30],
        typicalMargin: 25,
      },
      {
        brand: "The Man Company",
        priority: 3,
        defaultProduct: "Argan and Geranium Beard Oil",
        variants: ["Argan and Geranium Beard Oil"],
        commonSizes: [30, 50],
        typicalMargin: 25,
      },
      {
        brand: "Bombay Shaving Company",
        priority: 4,
        defaultProduct: "Beard Growth Oil",
        variants: ["Beard Growth Oil"],
        commonSizes: [30],
        typicalMargin: 25,
      },
      {
        brand: "UrbanGabru",
        priority: 5,
        defaultProduct: "Beard Growth Oil",
        variants: ["Beard Growth Oil"],
        commonSizes: [30, 50],
        typicalMargin: 28,
      },
    ],
  },
  {
    id: "beard-serum",
    name: "Beard Serum",
    unit: "ml",
    unitStepLabel: "per 30ml",
    defaultSizes: [30, 50],
    brands: [
      {
        brand: "Beardo",
        priority: 1,
        defaultProduct: "Daily Shine Beard Serum",
        variants: ["Daily Shine Beard Serum"],
        commonSizes: [50],
        typicalMargin: 25,
      },
      {
        brand: "Ustraa",
        priority: 2,
        defaultProduct: "Beard Growth Oil Advanced",
        variants: ["Beard Growth Oil Advanced"],
        commonSizes: [35, 50],
        typicalMargin: 25,
      },
      {
        brand: "The Man Company",
        priority: 3,
        defaultProduct: "Beard Serum",
        variants: ["Beard Serum"],
        commonSizes: [30, 50],
        typicalMargin: 25,
      },
      {
        brand: "UrbanGabru",
        priority: 4,
        defaultProduct: "Beard Growth Serum",
        variants: ["Beard Growth Serum"],
        commonSizes: [30],
        typicalMargin: 28,
      },
      {
        brand: "Man Matters",
        priority: 5,
        defaultProduct: "Beard Growth Serum",
        variants: ["Beard Growth Serum"],
        commonSizes: [30, 50],
        typicalMargin: 28,
      },
    ],
  },
  {
    id: "hair-mist",
    name: "Hair Mist",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [100, 150, 200],
    brands: [
      {
        brand: "Fix My Curls",
        priority: 1,
        defaultProduct: "Hair Mist",
        variants: ["Hair Mist"],
        commonSizes: [100, 150],
        typicalMargin: 25,
      },
      {
        brand: "Arata",
        priority: 2,
        defaultProduct: "Curl Refresh Spray",
        variants: ["Curl Refresh Spray"],
        commonSizes: [150],
        typicalMargin: 25,
      },
      {
        brand: "Ashba Botanics",
        priority: 3,
        defaultProduct: "Curl Refresh Spray",
        variants: ["Curl Refresh Spray"],
        commonSizes: [100, 200],
        typicalMargin: 25,
      },
      {
        brand: "BBlunt",
        priority: 4,
        defaultProduct: "Hair Mist",
        variants: ["Hair Mist"],
        commonSizes: [100],
        typicalMargin: 22,
      },
      {
        brand: "Love Beauty & Planet",
        priority: 5,
        defaultProduct: "Hair Mist",
        variants: ["Hair Mist"],
        commonSizes: [150],
        typicalMargin: 22,
      },
    ],
  },
  {
    id: "hair-regrowth-serum",
    name: "Hair Regrowth Serum",
    unit: "ml",
    unitStepLabel: "per 50ml",
    defaultSizes: [30, 50, 60],
    brands: [
      {
        brand: "Minimalist",
        priority: 1,
        defaultProduct: "Hair Growth Actives 18% Serum",
        variants: ["Hair Growth Actives 18% Serum"],
        commonSizes: [30, 50],
        typicalMargin: 22,
      },
      {
        brand: "WishCare",
        priority: 2,
        defaultProduct: "Hair Growth Serum Concentrate",
        variants: ["Hair Growth Serum Concentrate"],
        commonSizes: [30],
        typicalMargin: 25,
      },
      {
        brand: "Pilgrim",
        priority: 3,
        defaultProduct: "Advanced Hair Growth Serum",
        variants: ["Advanced Hair Growth Serum"],
        commonSizes: [50],
        typicalMargin: 25,
      },
      {
        brand: "Indulekha",
        priority: 4,
        defaultProduct: "Bringha Hair Growth Treatment Scalp Serum",
        variants: ["Bringha Hair Growth Treatment Scalp Serum"],
        commonSizes: [50, 100],
        typicalMargin: 20,
      },
      {
        brand: "The Ordinary",
        priority: 5,
        defaultProduct: "Multi-Peptide Serum for Hair Density",
        variants: ["Multi-Peptide Serum for Hair Density"],
        commonSizes: [60],
        typicalMargin: 20,
      },
      {
        brand: "Man Matters",
        priority: 6,
        defaultProduct: "Hair Growth Serum",
        variants: ["Hair Growth Serum"],
        commonSizes: [60],
        typicalMargin: 28,
      },
    ],
  },
  {
    id: "leave-on-bio-conditioner",
    name: "Leave-On Bio Conditioner",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [100, 150, 200, 250, 340],
    brands: [
      {
        brand: "Fix My Curls",
        priority: 1,
        defaultProduct: "Leave In Cream",
        variants: ["Leave In Cream"],
        commonSizes: [100, 200],
        typicalMargin: 25,
      },
      {
        brand: "Arata",
        priority: 2,
        defaultProduct: "Leave-In Conditioner",
        variants: ["Leave-In Conditioner"],
        commonSizes: [150, 200],
        typicalMargin: 25,
      },
      {
        brand: "Ashba Botanics",
        priority: 3,
        defaultProduct: "Leave-In Conditioner",
        variants: ["Leave-In Conditioner"],
        commonSizes: [100, 200],
        typicalMargin: 25,
      },
      {
        brand: "Cantu",
        priority: 4,
        defaultProduct: "Shea Butter Leave-In Conditioning Repair Cream",
        variants: ["Shea Butter Leave-In Conditioning Repair Cream"],
        commonSizes: [340, 453],
        typicalMargin: 22,
      },
      {
        brand: "Curl Up",
        priority: 5,
        defaultProduct: "Curl Defining Cream",
        variants: ["Curl Defining Cream"],
        commonSizes: [150],
        typicalMargin: 25,
      },
    ],
  },
  {
    id: "hair-refresh-milk",
    name: "Hair Refresh Milk",
    unit: "ml",
    unitStepLabel: "per 100ml",
    defaultSizes: [100, 150, 200],
    brands: [
      {
        brand: "Love Beauty & Planet",
        priority: 1,
        defaultProduct: "Rice Water Leave-In Conditioner",
        variants: ["Rice Water Leave-In Conditioner"],
        commonSizes: [150],
        typicalMargin: 22,
      },
      {
        brand: "Fix My Curls",
        priority: 2,
        defaultProduct: "Curl Quenching Hair Butter",
        variants: ["Curl Quenching Hair Butter"],
        commonSizes: [100, 200],
        typicalMargin: 25,
      },
      {
        brand: "Arata",
        priority: 3,
        defaultProduct: "Leave In Conditioner",
        variants: ["Leave In Conditioner"],
        commonSizes: [150],
        typicalMargin: 25,
      },
      {
        brand: "L’Oréal Professionnel",
        priority: 4,
        defaultProduct: "Curl Expression Drying Accelerator",
        variants: ["Curl Expression Drying Accelerator"],
        commonSizes: [150],
        typicalMargin: 20,
      },
      {
        brand: "BBlunt",
        priority: 5,
        defaultProduct: "Climate Control Leave In Cream",
        variants: ["Climate Control Leave In Cream"],
        commonSizes: [150],
        typicalMargin: 24,
      },
    ],
  },
  {
    id: "other-fmcg",
    name: "Other Category / Custom Product Line",
    unit: "ml",
    unitStepLabel: "per unit",
    defaultSizes: [50, 100, 200, 500],
    brands: [],
  },
];
