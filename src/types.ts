export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: 'CPM' | 'Marketplace';
  whatsapp_number: string;
}

export interface CartItem extends Product {
  quantity: number;
}
