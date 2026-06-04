import pool from './config/db';

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Iniciando criação das tabelas...');

    // Extensão para UUID se necessário (PostgreSQL >= 9.4)
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Tabela de Usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Listas de Compras
    await client.query(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        admin_id UUID REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Tabela de Itens das Listas
    await client.query(`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        price TEXT,
        checked BOOLEAN DEFAULT FALSE,
        list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE
      );
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
  } finally {
    client.release();
  }
};

export default initDb;
