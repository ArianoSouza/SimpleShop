import pool from './config/db';

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('Iniciando criação das tabelas...');

    // Extensão para UUID se necessário (PostgreSQL >= 9.4)
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Criar Tabela de Usuários

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
        status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        admin_id UUID REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Garantir que a coluna status existe se a tabela já foi criada anteriormente
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shopping_lists' AND column_name='status') THEN
          ALTER TABLE shopping_lists ADD COLUMN status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED'));
        END IF;
      END $$;
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

    // Tabela de Recuperação de Senha
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE
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
