import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAllLists = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await pool.query(
      'SELECT * FROM shopping_lists WHERE admin_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar listas' });
  }
};

export const getListById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const listResult = await pool.query(
      'SELECT * FROM shopping_lists WHERE id = $1 AND admin_id = $2',
      [id, userId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    const itemResult = await pool.query(
      'SELECT * FROM shopping_items WHERE list_id = $1',
      [id]
    );

    const list = listResult.rows[0];
    list.items = itemResult.rows;

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar lista' });
  }
};

export const createList = async (req: AuthRequest, res: Response) => {
  const { name, description, items } = req.body;
  const userId = req.user?.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const listResult = await client.query(
      'INSERT INTO shopping_lists (name, description, admin_id) VALUES ($1, $2, $3) RETURNING *',
      [name || 'Nova Lista', description || '', userId]
    );

    const newList = listResult.rows[0];

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          'INSERT INTO shopping_items (name, quantity, price, checked, list_id) VALUES ($1, $2, $3, $4, $5)',
          [item.name, item.quantity, item.price, item.checked || false, newList.id]
        );
      }
    }

    await client.query('COMMIT');
    
    // Buscar lista completa com itens para retornar
    const finalItems = await client.query('SELECT * FROM shopping_items WHERE list_id = $1', [newList.id]);
    newList.items = finalItems.rows;

    res.status(201).json(newList);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar lista' });
  } finally {
    client.release();
  }
};

export const updateList = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, items } = req.body;
  const userId = req.user?.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar se a lista pertence ao usuário
    const checkResult = await client.query(
      'SELECT * FROM shopping_lists WHERE id = $1 AND admin_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    // Atualizar dados básicos da lista
    await client.query(
      'UPDATE shopping_lists SET name = $1, description = $2 WHERE id = $3',
      [name, description, id]
    );

    // Simplificação: Deletar itens antigos e inserir novos (ou poderia fazer um sync mais complexo)
    if (items && Array.isArray(items)) {
      await client.query('DELETE FROM shopping_items WHERE list_id = $1', [id]);
      for (const item of items) {
        await client.query(
          'INSERT INTO shopping_items (name, quantity, price, checked, list_id) VALUES ($1, $2, $3, $4, $5)',
          [item.name, item.quantity, item.price, item.checked || false, id]
        );
      }
    }

    await client.query('COMMIT');

    const updatedListResult = await client.query('SELECT * FROM shopping_lists WHERE id = $1', [id]);
    const updatedItemsResult = await client.query('SELECT * FROM shopping_items WHERE list_id = $1', [id]);
    
    const updatedList = updatedListResult.rows[0];
    updatedList.items = updatedItemsResult.rows;

    res.json(updatedList);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar lista' });
  } finally {
    client.release();
  }
};
