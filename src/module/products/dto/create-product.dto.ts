export class CreateProductDto {
  name: string;
  slug: string;
  sku: string;
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  thumbnail: string;
  images?: string[];
  categoryId: string;
  stock?: number;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  brand?: string;
  series?: string;
  character?: string;
  material?: string;
  height?: string;
  scale?: string;
  shortDescription?: string;
  description?: string;
  tags?: string[];
  isHot?: boolean;
  isFeatured?: boolean;
}
