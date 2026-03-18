import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tenantsRouter from './routes/tenants.js';
import buildingsRouter from './routes/buildings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Dashboard API is running' });
});

app.use('/api/tenants', tenantsRouter);
app.use('/api/buildings', buildingsRouter);

app.listen(PORT, () => {
    console.log(`Dashboard API server running on http://localhost:${PORT}`);
});
