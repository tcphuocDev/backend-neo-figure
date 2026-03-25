import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {

  // ===== Basic Info =====
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string; // url friendly

  @Prop({ required: true })
  sku: string;

  // ===== Pricing =====
  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice: number; // giá gốc nếu sale

  @Prop({ default: false })
  isOnSale: boolean;

  // ===== Images =====
  @Prop({ required: true })
  thumbnail: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  // ===== Category =====
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  // ===== Stock =====
  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: true })
  inStock: boolean;

  // ===== Ratings =====
  @Prop({ default: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  soldCount: number;

  // ===== Detail Specs =====
  @Prop()
  brand: string; // Bandai, GoodSmile

  @Prop()
  series: string; // Gundam, Marvel

  @Prop()
  character: string; // Tamamo Cross

  @Prop()
  material: string; // PVC

  @Prop()
  height: string; // 20cm

  @Prop()
  scale: string; // 1/7

  // ===== Description =====
  @Prop()
  shortDescription: string;

  @Prop()
  description: string;

  // ===== Tags =====
  @Prop({ type: [String], default: [] })
  tags: string[];

  // ===== Flags =====
  @Prop({ default: false })
  isHot: boolean;

  @Prop({ default: false })
  isFeatured: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);