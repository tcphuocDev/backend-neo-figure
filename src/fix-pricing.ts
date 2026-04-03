import { connect, connection } from 'mongoose';
import { config } from 'dotenv';
import * as readline from 'readline';

config();

/**
 * Script to automatically fix products with swapped pricing
 * (Swaps price and originalPrice when price > originalPrice and isOnSale = true)
 *
 * Run: npx ts-node src/fix-pricing.ts
 */

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  isOnSale: boolean;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function fixPricing() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neofigure');
    console.log('✅ Connected successfully\n');

    const Product = connection.model('Product');

    // Find all products where isOnSale = true AND price >= originalPrice
    const invalidProducts = await Product.find({
      isOnSale: true,
      $expr: { $gte: ['$price', '$originalPrice'] },
    });

    if (invalidProducts.length === 0) {
      console.log('🎉 No products found with pricing issues!');
      return;
    }

    console.log(`⚠️  Found ${invalidProducts.length} product(s) with invalid pricing:\n`);

    invalidProducts.forEach((product: Product, index: number) => {
      console.log(`${index + 1}. ${product.name} (${product.sku})`);
      console.log(`   Current: Price = ${product.price.toLocaleString()}₫ | Original = ${product.originalPrice?.toLocaleString() || 'N/A'}₫`);
      console.log(`   After fix: Price = ${product.originalPrice?.toLocaleString() || 'N/A'}₫ | Original = ${product.price.toLocaleString()}₫`);
      console.log('');
    });

    const answer = await askQuestion('❓ Do you want to swap price values for these products? (yes/no): ');

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Operation cancelled.');
      return;
    }

    console.log('\n🔄 Fixing pricing...\n');

    let fixedCount = 0;
    for (const product of invalidProducts) {
      const oldPrice = product.price;
      const oldOriginalPrice = product.originalPrice;

      // Swap values
      await Product.findByIdAndUpdate(product._id, {
        price: oldOriginalPrice,
        originalPrice: oldPrice,
      });

      console.log(`✅ Fixed: ${product.name}`);
      console.log(`   ${oldPrice.toLocaleString()}₫ ↔ ${oldOriginalPrice?.toLocaleString()}₫\n`);
      fixedCount++;
    }

    console.log('='.repeat(60));
    console.log(`🎉 Successfully fixed ${fixedCount} product(s)!`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    await connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixPricing();
