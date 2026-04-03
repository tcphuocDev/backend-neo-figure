import { connect, connection } from 'mongoose';
import { config } from 'dotenv';

config();

/**
 * Script to check and report products with invalid pricing (price >= originalPrice when on sale)
 *
 * Run: npx ts-node src/check-pricing.ts
 */

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  isOnSale: boolean;
}

async function checkPricing() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neofigure');
    console.log('✅ Connected successfully\n');

    const Product = connection.model('Product');

    // Find all products where isOnSale = true
    const onSaleProducts = await Product.find({ isOnSale: true });
    console.log(`📦 Found ${onSaleProducts.length} products marked as "On Sale"\n`);

    // Check for invalid pricing
    const invalidProducts: Product[] = [];
    const validProducts: Product[] = [];

    for (const product of onSaleProducts) {
      if (!product.originalPrice) {
        console.log(`⚠️  ${product.name} (${product.sku})`);
        console.log(`   → Missing originalPrice (should have one when on sale)`);
        console.log(`   → Current price: ${product.price.toLocaleString()}₫\n`);
        invalidProducts.push(product);
      } else if (product.price >= product.originalPrice) {
        console.log(`❌ ${product.name} (${product.sku})`);
        console.log(`   → INVALID: Selling price (${product.price.toLocaleString()}₫) >= Original price (${product.originalPrice.toLocaleString()}₫)`);
        console.log(`   → Should be: Selling price < Original price`);
        console.log(`   → Suggestion: Swap the values or fix manually\n`);
        invalidProducts.push(product);
      } else {
        validProducts.push(product);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Valid products: ${validProducts.length}`);
    console.log(`❌ Invalid products: ${invalidProducts.length}`);

    if (invalidProducts.length > 0) {
      console.log('\n💡 To fix invalid products:');
      console.log('   1. Go to Admin Panel → Products → Edit');
      console.log('   2. Ensure: Selling Price < Original Price');
      console.log('   3. Example: Sale = 800,000₫ | Original = 1,000,000₫');
      console.log('\n   Or run a fix script to swap values automatically.');
    } else {
      console.log('\n🎉 All products have valid pricing!');
    }

    console.log('\n📋 PRICING RULES:');
    console.log('   • Selling Price = Price shown LARGE & BOLD (current price after discount)');
    console.log('   • Original Price = Price shown SMALL & STRIKETHROUGH (before discount)');
    console.log('   • When On Sale: Original Price must be > Selling Price');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkPricing();
