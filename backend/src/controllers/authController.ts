import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { sendRecoveryEmail } from '../lib/mail';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing');
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    // Verificar se usuário já existe
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Usuário já cadastrado com este e-mail' });
    }

    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Inserir usuário
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Gerar Token
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Buscar usuário
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'E-mail não cadastrado' });
    }

    const user = result.rows[0];

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    // Gerar Token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    // 1. Verificar se usuário existe
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Por segurança, não confirmamos se o e-mail existe ou não
      return res.json({ message: 'Se o e-mail existir em nossa base, um código será enviado.' });
    }

    // 2. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // 3. Salvar no banco
    await pool.query(
      'INSERT INTO password_resets (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );

    // 4. Enviar e-mail real usando Nodemailer
    try {
      await sendRecoveryEmail(email, code);
    } catch (mailError) {
      console.error('Erro ao enviar e-mail:', mailError);
    }

    res.json({ message: 'Código de recuperação enviado para o seu e-mail.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao solicitar recuperação de senha' });
  }
};

export const verifyResetCode = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM password_resets WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()',
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    res.json({ message: 'Código verificado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao verificar código' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  try {
    // 1. Validar código novamente
    const resetResult = await pool.query(
      'SELECT * FROM password_resets WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()',
      [email, code]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ message: 'Sessão de recuperação expirada' });
    }

    // 2. Criptografar nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Atualizar senha do usuário
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    // 4. Marcar código como usado
    await pool.query('UPDATE password_resets SET used = TRUE WHERE email = $1 AND code = $2', [email, code]);

    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};
