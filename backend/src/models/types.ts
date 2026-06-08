export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  price?: string;
  checked: boolean;
  list_id: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  description: string;
  status: 'OPEN' | 'COMPLETED';
  created_at: string;
  admin_id: string;
  items?: ShoppingItem[];
}
