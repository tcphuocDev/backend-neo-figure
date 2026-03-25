import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: null })
  phone?: string;

  @Prop({ default: null })
  address?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
