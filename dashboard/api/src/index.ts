import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tenantsRouter from './routes/tenants.js';
import buildingsRouter from './routes/buildings.js';
import flaggedEmailsRouter from './routes/flagged-emails.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/tenants', tenantsRouter);
app.use('/api/buildings', buildingsRouter);
app.use('/api/flagged-emails', flaggedEmailsRouter);

app.listen(PORT, () => {
    console.log(`Dashboard API server running on http://localhost:${PORT}`);
});
