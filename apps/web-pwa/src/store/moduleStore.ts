import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DynamicModuleKey = "import_lc" | "pos" | "crm" | "contractor" | "inventory_advanced";

export type ModuleConfig = {
  key: DynamicModuleKey;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
  descriptionBn: string;
  href: string;
  enabled: boolean;
};

const DEFAULT_MODULES: ModuleConfig[] = [
  {
    key: "import_lc",
    labelEn: "Import / LC",
    labelBn: "ইমপোর্ট / LC",
    descriptionEn: "Supply chain, letter of credit and shipment tracking",
    descriptionBn: "সাপ্লাই চেইন, LC এবং শিপমেন্ট ট্র্যাকিং",
    href: "/dashboard/import",
    enabled: false,
  },
  {
    key: "pos",
    labelEn: "POS",
    labelBn: "পয়েন্ট অব সেল",
    descriptionEn: "Retail point-of-sale catalog, cart and sales",
    descriptionBn: "রিটেইল বিক্রয়, ক্যাটালগ ও কার্ট",
    href: "/dashboard/pos",
    enabled: false,
  },
  {
    key: "crm",
    labelEn: "CRM",
    labelBn: "CRM",
    descriptionEn: "Customer relationship and lead management",
    descriptionBn: "কাস্টমার ও লিড ম্যানেজমেন্ট",
    href: "/dashboard/crm",
    enabled: false,
  },
  {
    key: "contractor",
    labelEn: "Contractor",
    labelBn: "ঠিকাদার",
    descriptionEn: "Contractor profiles, agreements and payments",
    descriptionBn: "ঠিকাদার প্রোফাইল, চুক্তি ও পেমেন্ট",
    href: "/dashboard/contractor",
    enabled: false,
  },
  {
    key: "inventory_advanced",
    labelEn: "Inventory Advanced",
    labelBn: "অ্যাডভান্সড ইনভেন্টরি",
    descriptionEn: "Full inventory with multi-warehouse and barcode support",
    descriptionBn: "মাল্টি-গুদাম ও বারকোড সহ পূর্ণ ইনভেন্টরি",
    href: "/dashboard/inventory",
    enabled: false,
  },
];

type ModuleState = {
  modules: ModuleConfig[];
  toggleModule: (key: DynamicModuleKey) => void;
  isEnabled: (key: DynamicModuleKey) => boolean;
  enabledModules: () => ModuleConfig[];
};

export const useModuleStore = create<ModuleState>()(
  persist(
    (set, get) => ({
      modules: DEFAULT_MODULES,
      toggleModule: (key) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.key === key ? { ...m, enabled: !m.enabled } : m
          ),
        }));
      },
      isEnabled: (key) => {
        return get().modules.find((m) => m.key === key)?.enabled ?? false;
      },
      enabledModules: () => {
        return get().modules.filter((m) => m.enabled);
      },
    }),
    { name: "bdcr7-module-toggles" }
  )
);
