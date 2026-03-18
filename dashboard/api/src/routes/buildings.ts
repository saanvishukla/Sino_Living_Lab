import express from 'express';
import { getAllBuildings, getTenantsByBuilding } from '../db/redis.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const buildings = await getAllBuildings();
        res.json({ success: true, data: buildings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch buildings' });
    }
});

router.get('/:building/tenants', async (req, res) => {
    try {
        const tenants = await getTenantsByBuilding(req.params.building);
        res.json({ success: true, data: tenants, count: tenants.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch building tenants' });
    }
});

export default router;
