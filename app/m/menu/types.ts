export interface MobileOption {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  maxQuantity: number;
  order: number;
}

export interface MobileOptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  order: number;
  options: MobileOption[];
}

export interface MobileProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isPopular: boolean;
  isRecommended: boolean;
  isCombo: boolean;
  preparationTime: number | null;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  optionGroups: MobileOptionGroup[];
}

export interface MobileCategory {
  id: string;
  name: string;
  order: number;
}
