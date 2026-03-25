export class QueryProductDto {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string; // price_asc, price_desc, popular, newest
  search?: string;
  isHot?: boolean;
  isFeatured?: boolean;
}
