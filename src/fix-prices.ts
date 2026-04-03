import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './module/products/schema/product.schema';

async function fixPrices() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const productModel = app.get<Model<Product>>('ProductModel');

  console.log('🔍 Checking for products with incorrect pricing...\n');

  // Find products where price > originalPrice (incorrect)
  const incorrectProducts = await productModel
    .find({
      isOnSale: true,
      $expr: { $gt: ['$price', '$originalPrice'] },
    })
    .exec();

  console.log(`Found ${incorrectProducts.length} products with incorrect pricing:\n`);

  for (const product of incorrectProducts) {
    console.log(`📦 ${product.name}`);
    console.log(`   Current: price=${product.price}, originalPrice=${product.originalPrice}`);

    // Swap the prices
    const temp = product.price;
    product.price = product.originalPrice;
    product.originalPrice = temp;

    await product.save();

    console.log(`   ✅ Fixed: price=${product.price}, originalPrice=${product.originalPrice}\n`);
  }

  console.log(`\n✨ Fixed ${incorrectProducts.length} products!`);

  await app.close();
}

fixPrices()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
