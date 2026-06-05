import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import listRoutes from './routes/listRoutes';
import authRoutes from './routes/authRoutes';
import initDb from './initDb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logger de Requisições
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Inicializar Banco de Dados
initDb();

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/shopping-lists', listRoutes);

app.get('/', (req, res) => {
  res.send('API Lista de Compras SimpleShop está rodando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
