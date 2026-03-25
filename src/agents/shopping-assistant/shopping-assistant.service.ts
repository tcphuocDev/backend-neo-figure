import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../module/products/schema/product.schema';
import { Order } from '../../module/orders/schema/order.schema';
import { Category } from '../../module/categories/schema/category.schema';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ConversationContext {
  userId?: string;
  sessionId: string;
  messages: ChatMessage[];
  currentIntent?: string;
  extractedData?: any;
}

@Injectable()
export class ShoppingAssistantService {
  private readonly logger = new Logger(ShoppingAssistantService.name);
  private conversations = new Map<string, ConversationContext>();

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  /**
   * Main chat handler - processes user messages and returns assistant response
   */
  async chat(
    sessionId: string,
    userMessage: string,
    userId?: string,
  ): Promise<ChatMessage> {
    this.logger.log(
      `Processing message for session ${sessionId}: ${userMessage}`,
    );

    // Get or create conversation context
    let context = this.conversations.get(sessionId);
    if (!context) {
      context = {
        sessionId,
        userId,
        messages: [],
      };
      this.conversations.set(sessionId, context);
    }

    // Add user message to context
    context.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Detect intent
    const intent = await this.detectIntent(userMessage, context);
    context.currentIntent = intent;

    // Generate response based on intent
    const response = await this.generateResponse(intent, userMessage, context);

    // Add assistant response to context
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    context.messages.push(assistantMessage);

    return assistantMessage;
  }

  /**
   * Detect user intent from message
   */
  private async detectIntent(
    message: string,
    context: ConversationContext,
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Product search intents
    if (
      lowerMessage.includes('tìm') ||
      lowerMessage.includes('search') ||
      lowerMessage.includes('có') ||
      lowerMessage.includes('bán')
    ) {
      return 'PRODUCT_SEARCH';
    }

    // Product comparison
    if (lowerMessage.includes('so sánh') || lowerMessage.includes('compare')) {
      return 'PRODUCT_COMPARE';
    }

    // Price inquiry
    if (
      lowerMessage.includes('giá') ||
      lowerMessage.includes('price') ||
      lowerMessage.includes('bao nhiêu')
    ) {
      return 'PRICE_INQUIRY';
    }

    // Order tracking
    if (
      lowerMessage.includes('đơn hàng') ||
      lowerMessage.includes('order') ||
      lowerMessage.includes('tracking')
    ) {
      return 'ORDER_TRACKING';
    }

    // Checkout help
    if (
      lowerMessage.includes('checkout') ||
      lowerMessage.includes('thanh toán') ||
      lowerMessage.includes('mua')
    ) {
      return 'CHECKOUT_HELP';
    }

    // Product information
    if (
      lowerMessage.includes('thông tin') ||
      lowerMessage.includes('chi tiết') ||
      lowerMessage.includes('detail')
    ) {
      return 'PRODUCT_INFO';
    }

    // General greeting
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('xin chào')
    ) {
      return 'GREETING';
    }

    return 'GENERAL';
  }

  /**
   * Generate response based on detected intent
   */
  private async generateResponse(
    intent: string,
    message: string,
    context: ConversationContext,
  ): Promise<string> {
    switch (intent) {
      case 'GREETING':
        return this.handleGreeting();

      case 'PRODUCT_SEARCH':
        return this.handleProductSearch(message);

      case 'PRODUCT_COMPARE':
        return this.handleProductCompare(message);

      case 'PRICE_INQUIRY':
        return this.handlePriceInquiry(message);

      case 'ORDER_TRACKING':
        return this.handleOrderTracking(message, context);

      case 'CHECKOUT_HELP':
        return this.handleCheckoutHelp();

      case 'PRODUCT_INFO':
        return this.handleProductInfo(message);

      default:
        return this.handleGeneral();
    }
  }

  private handleGreeting(): string {
    return `Xin chào! 👋 Tôi là trợ lý mua sắm của NEO FIGURE.

Tôi có thể giúp bạn:
🔍 Tìm kiếm sản phẩm (mô hình anime, gundam, collectibles)
💰 Kiểm tra giá và khuyến mãi
📦 Theo dõi đơn hàng
🛒 Hỗ trợ thanh toán
ℹ️ Tư vấn sản phẩm

Bạn đang tìm kiếm gì hôm nay?`;
  }

  private async handleProductSearch(message: string): Promise<string> {
    try {
      // Extract keywords from message
      const keywords = this.extractKeywords(message);

      // Search products
      const products = await this.productModel
        .find({
          $or: [
            { name: { $regex: keywords, $options: 'i' } },
            { character: { $regex: keywords, $options: 'i' } },
            { series: { $regex: keywords, $options: 'i' } },
            { tags: { $regex: keywords, $options: 'i' } },
          ],
        })
        .limit(5)
        .populate('categoryId', 'name')
        .exec();

      if (products.length === 0) {
        return `Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với "${keywords}".

Bạn có thể thử:
- Tìm theo danh mục: Gundam, Anime Figure, Gaming
- Tìm theo thương hiệu: Bandai, Good Smile Company
- Hoặc xem các sản phẩm HOT đang giảm giá? 🔥`;
      }

      let response = `Tôi tìm thấy ${products.length} sản phẩm cho "${keywords}":\n\n`;

      products.forEach((p, index) => {
        const discount =
          p.isOnSale && p.originalPrice
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;

        response += `${index + 1}. ${p.name}\n`;
        response += `   💰 ${this.formatPrice(p.price)}`;
        if (discount > 0) {
          response += ` (Giảm ${discount}% từ ${this.formatPrice(p.originalPrice)}) 🔥`;
        }
        response += `\n   ⭐ ${p.rating}/5 (${p.reviewCount} đánh giá)`;
        response += `\n   📦 Đã bán: ${p.soldCount}\n\n`;
      });

      response += `Bạn muốn xem chi tiết sản phẩm nào?`;

      return response;
    } catch (error) {
      this.logger.error(`Error in product search: ${error.message}`);
      return 'Xin lỗi, có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại!';
    }
  }

  private async handleProductCompare(message: string): Promise<string> {
    return `Để so sánh sản phẩm, vui lòng cho tôi biết:
1. Tên 2-3 sản phẩm bạn muốn so sánh
2. Hoặc danh mục sản phẩm (VD: "So sánh các mô hình Gundam giá dưới 1 triệu")

Tôi sẽ so sánh về giá, chất lượng, đánh giá và tính năng! 📊`;
  }

  private async handlePriceInquiry(message: string): Promise<string> {
    const keywords = this.extractKeywords(message);

    try {
      const product = await this.productModel
        .findOne({
          $or: [
            { name: { $regex: keywords, $options: 'i' } },
            { slug: { $regex: keywords, $options: 'i' } },
          ],
        })
        .exec();

      if (!product) {
        return `Tôi không tìm thấy sản phẩm "${keywords}". Bạn có thể cho tôi biết rõ hơn tên sản phẩm không?`;
      }

      let response = `💰 Thông tin giá cho ${product.name}:\n\n`;
      response += `Giá hiện tại: ${this.formatPrice(product.price)}\n`;

      if (product.isOnSale && product.originalPrice) {
        const discount = Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        );
        response += `Giá gốc: ${this.formatPrice(product.originalPrice)}\n`;
        response += `🔥 Tiết kiệm: ${discount}% (${this.formatPrice(product.originalPrice - product.price)})\n`;
      }

      response += `\n📦 Tình trạng: ${product.inStock ? 'Còn hàng' : 'Hết hàng'}\n`;
      response += `⭐ Đánh giá: ${product.rating}/5 (${product.reviewCount} reviews)\n`;

      if (product.isHot) {
        response += `\n🔥 Sản phẩm HOT - Đang giảm giá đặc biệt!`;
      }

      return response;
    } catch (error) {
      return 'Có lỗi khi kiểm tra giá. Vui lòng thử lại!';
    }
  }

  private async handleOrderTracking(
    message: string,
    context: ConversationContext,
  ): Promise<string> {
    if (!context.userId) {
      return `Để theo dõi đơn hàng, bạn cần đăng nhập vào tài khoản.

Hoặc bạn có thể cung cấp:
- Mã đơn hàng
- Email hoặc số điện thoại đặt hàng

Tôi sẽ giúp bạn kiểm tra ngay! 📦`;
    }

    try {
      // For demo, show recent orders
      const recentOrders = await this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()
        .exec();

      if (recentOrders.length === 0) {
        return 'Bạn chưa có đơn hàng nào. Hãy mua sắm ngay! 🛒';
      }

      let response = `📦 Đơn hàng gần đây:\n\n`;

      recentOrders.forEach((order: any, index) => {
        response += `${index + 1}. Đơn #${order._id.toString().slice(-6)}\n`;
        response += `   Tổng: ${this.formatPrice(order.totalPrice)}\n`;
        response += `   Trạng thái: ${this.getOrderStatusText(order.status)}\n`;
        const createdDate = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString('vi-VN')
          : 'N/A';
        response += `   Ngày đặt: ${createdDate}\n\n`;
      });

      return response;
    } catch (error) {
      return 'Có lỗi khi kiểm tra đơn hàng. Vui lòng thử lại!';
    }
  }

  private handleCheckoutHelp(): string {
    return `🛒 Hướng dẫn thanh toán:

1️⃣ Thêm sản phẩm vào giỏ hàng
2️⃣ Xem giỏ hàng và kiểm tra
3️⃣ Điền thông tin giao hàng:
   - Họ tên
   - Số điện thoại (10 số)
   - Địa chỉ nhận hàng
   - Email (không bắt buộc)
4️⃣ Xác nhận đơn hàng
5️⃣ Chờ xác nhận từ shop (1-2 giờ)

💳 Hình thức thanh toán: COD (thanh toán khi nhận hàng)

Bạn cần giúp gì thêm không?`;
  }

  private async handleProductInfo(message: string): Promise<string> {
    return `ℹ️ Tôi có thể cung cấp thông tin về:

📦 Sản phẩm:
- Mô hình Gundam (Bandai, Master Grade, etc)
- Figure Anime (Good Smile, Kotobukiya)
- Gaming collectibles

🏷️ Thông tin sản phẩm bao gồm:
- Quy cách, kích thước
- Chất liệu
- Thương hiệu
- Hướng dẫn lắp ráp (nếu có)

Bạn muốn biết thông tin sản phẩm cụ thể nào?`;
  }

  private handleGeneral(): string {
    return `Tôi là trợ lý mua sắm NEO FIGURE!

Tôi có thể giúp bạn:
- 🔍 Tìm kiếm sản phẩm
- 💰 Kiểm tra giá
- 📊 So sánh sản phẩm
- 📦 Theo dõi đơn hàng
- 🛒 Hỗ trợ thanh toán

Bạn cần giúp gì?`;
  }

  /**
   * Utility functions
   */
  private extractKeywords(message: string): string {
    // Remove common words and extract main keywords
    const stopWords = [
      'tìm',
      'có',
      'bán',
      'không',
      'cho',
      'tôi',
      'mình',
      'được',
      'the',
      'is',
      'are',
      'do',
      'you',
      'have',
    ];

    const words = message.toLowerCase().split(/\s+/);
    const keywords = words.filter(
      (word) => !stopWords.includes(word) && word.length > 2,
    );

    return keywords.join(' ') || message;
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  private getOrderStatusText(status: string): string {
    const statusMap = {
      pending: '⏳ Chờ xác nhận',
      paid: '✅ Đã thanh toán',
      shipped: '🚚 Đang giao hàng',
      delivered: '✅ Đã giao',
      cancelled: '❌ Đã hủy',
    };
    return statusMap[status] || status;
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): ConversationContext | undefined {
    return this.conversations.get(sessionId);
  }

  /**
   * Clear conversation (for privacy)
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get FAQ responses
   */
  async getFAQ(): Promise<any> {
    return [
      {
        question: 'Tôi có thể thanh toán như thế nào?',
        answer:
          'Hiện tại chúng tôi hỗ trợ thanh toán COD (thanh toán khi nhận hàng).',
      },
      {
        question: 'Thời gian giao hàng bao lâu?',
        answer: 'Thời gian giao hàng từ 2-5 ngày tùy khu vực.',
      },
      {
        question: 'Có chính sách đổi trả không?',
        answer: 'Có, đổi trả trong 7 ngày nếu sản phẩm lỗi từ nhà sản xuất.',
      },
      {
        question: 'Sản phẩm có chính hãng không?',
        answer: '100% sản phẩm chính hãng, có tem và hộp đầy đủ.',
      },
    ];
  }
}
