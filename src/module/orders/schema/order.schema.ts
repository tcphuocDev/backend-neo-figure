import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop()
  customerName: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  address: string;

  @Prop([
    {
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      thumbnail: String,
    },
  ])
  items: any[];

  @Prop()
  totalPrice: number;

  @Prop({ default: 'pending' })
  status: string; // pending | paid | shipped

  createdAt?: Date;
  updatedAt?: Date;
}
export const OrderSchema = SchemaFactory.createForClass(Order)
