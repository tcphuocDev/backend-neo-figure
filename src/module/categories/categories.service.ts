import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schema/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(@InjectModel(Category.name) private model: Model<Category>) {}

  create(data: CreateCategoryDto) {
    return this.model.create(data);
  }

  findAll() {
    return this.model.find().exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }
}
