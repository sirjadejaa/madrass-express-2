export type KioskOption = {
  id: string;
  name: string;
  price: number;
  maxQuantity: number;
};

export type KioskOptionGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  options: KioskOption[];
};

export type KioskProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVegetarian: boolean;
  isPopular: boolean;
  isAvailable: boolean;
  categoryId: string;
  image: { url: string } | null;
  model3D: { 
    url: string; 
    enabled: boolean;
    autoRotate: boolean;
    rotationSpeed: number;
  } | null;
  optionGroups: KioskOptionGroup[];
  isCombo?: boolean;
  recommendations?: { id: string, name: string, price: number, image: { url: string } | null }[];
};
