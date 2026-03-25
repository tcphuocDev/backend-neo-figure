import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
  },
};

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class CloudinaryModule {}
