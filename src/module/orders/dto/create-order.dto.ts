export class CreateOrderDto {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    thumbnail: string;
  }>;
  totalPrice: number;
  status?: string;
}
