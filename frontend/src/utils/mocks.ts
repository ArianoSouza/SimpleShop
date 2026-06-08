/**
 * Definições de Tipos conforme GEMINI.md:
 * - Decimais (quantidade/preço) chegam como Strings.
 * - UUIDs como Strings.
 * - Datas como ISO 8601 Strings.
 */

export interface ShoppingItem {
  id: string; // UUID String
  name: string;
  quantity: string; // DecimalField (Django) -> String no Front
  price?: string;   // DecimalField (Django) -> String no Front
  checked: boolean;
}

export interface ShoppingList {
  id: string; // UUID String
  name: string;
  description: string;
  status: 'OPEN' | 'COMPLETED';
  created_at: string; // ISO 8601 String
  admin: string;
  items: ShoppingItem[];
}

// Transformamos em um let para permitir mutação local CONTROLADA via imutabilidade
export let MOCK_LISTS: ShoppingList[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'LISTA 1',
    description: 'Lista de compras principal da casa.',
    status: 'OPEN',
    created_at: '2026-11-01T10:30:00Z',
    admin: 'Jéssica',
    items: [
      { id: 'uuid-1', name: 'Arroz branco', quantity: '2.00', checked: false },
      { id: 'uuid-2', name: 'Feijão preto', quantity: '1.00', checked: false },
    ],
  },
];

/**
 * Adição seguindo a Regra de Imutabilidade (GEMINI.md Rule #1):
 * NUNCA modifique arrays originais. Use [...array].
 */
export const addMockList = (newList: ShoppingList) => {
  MOCK_LISTS = [newList, ...MOCK_LISTS];
};

export const updateMockList = (updatedList: ShoppingList) => {
  MOCK_LISTS = MOCK_LISTS.map(list => 
    list.id === updatedList.id ? updatedList : list
  );
};
