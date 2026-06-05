import { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAllLists = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await pool.query(
      `SELECT sl.*, 
              COALESCE(json_agg(si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items
       FROM shopping_lists sl
       LEFT JOIN shopping_items si ON sl.id = si.list_id
       WHERE sl.admin_id = $1
       GROUP BY sl.id
       ORDER BY sl.created_at DESC`,
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
  const { name, description, items, status, created_at } = req.body;
  const userId = req.user?.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const listResult = await client.query(
      'INSERT INTO shopping_lists (name, description, admin_id, status, created_at) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP)) RETURNING *',
      [name || 'Nova Lista', description || '', userId, status || 'OPEN', created_at]
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
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);
    
    // Erro 23503: foreign_key_violation no PostgreSQL
    if (err.code === '23503') {
      return res.status(400).json({ 
        message: 'Erro de integridade: usuário ou lista não existe.',
        detail: err.detail
      });
    }

    res.status(500).json({ message: 'Erro ao criar lista' });
  } finally {
    client.release();
  }
};

export const updateList = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, items, status } = req.body;
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
      'UPDATE shopping_lists SET name = $1, description = $2, status = COALESCE($3, status) WHERE id = $4',
      [name, description, status, id]
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

export const deleteList = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  console.log(`[DELETE_CONTROLLER] Iniciando. ListaID: ${id}, UsuarioID: ${userId}`);

  if (!userId) {
    console.error('[DELETE_CONTROLLER] Erro: userId não encontrado no request');
    return res.status(401).json({ message: 'Não autorizado' });
  }

  const client = await pool.connect();
  try {
    // Busca a lista para conferir se ela existe
    console.log(`[DELETE_CONTROLLER] Buscando lista ${id} no banco...`);
    const findResult = await client.query('SELECT admin_id FROM shopping_lists WHERE id = $1', [id]);
    
    if (findResult.rowCount === 0) {
      console.warn(`[DELETE_CONTROLLER] Lista ${id} não encontrada no banco de dados.`);
      return res.status(404).json({ message: 'Lista não encontrada' });
    }

    const listOwner = findResult.rows[0].admin_id;
    console.log(`[DELETE_CONTROLLER] Lista encontrada. Dono: ${listOwner}, Tentando: ${userId}`);

    if (listOwner !== userId) {
      console.warn(`[DELETE_CONTROLLER] Permissão negada. Dono(${listOwner}) != Tentando(${userId})`);
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta lista' });
    }

    console.log(`[DELETE_CONTROLLER] Executando DELETE físico...`);
    const deleteResult = await client.query('DELETE FROM shopping_lists WHERE id = $1', [id]);
    
    console.log(`[DELETE_CONTROLLER] Sucesso. Linhas afetadas: ${deleteResult.rowCount}`);
    return res.json({ message: 'Lista excluída com sucesso' });

  } catch (err: any) {
    console.error('[DELETE_CONTROLLER] Erro fatal:', err.message);
    return res.status(500).json({ message: 'Erro interno ao processar exclusão' });
  } finally {
    client.release();
  }
};
