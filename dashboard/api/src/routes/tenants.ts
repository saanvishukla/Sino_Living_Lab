import express from 'express';
import { getAllTenants, getTenant, saveTenant, updateTenant, deleteTenant, getTenantsByBuilding, getTenantsByFloor, getTenantByUnit } from '../db/redis.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { building, floor, unit } = req.query;
        
        let tenants;
        
        if (building) {
            tenants = await getTenantsByBuilding(building as string);
        } else if (floor) {
            tenants = await getTenantsByFloor(floor as string);
        } else if (unit) {
            const tenant = await getTenantByUnit(unit as string);
            tenants = tenant ? [tenant] : [];
        } else {
            tenants = await getAllTenants();
        }
        
        res.json({ success: true, data: tenants, count: tenants.length });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const tenant = await getTenant(req.params.id);
        
        if (!tenant) {
            return res.status(404).json({ success: false, error: 'Tenant not found' });
        }
        
        res.json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tenant' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { useUnitAsKey = true, ...tenantData } = req.body;
        
        if (!tenantData.name || !tenantData.unit) {
            return res.status(400).json({ success: false, error: 'Name and unit are required' });
        }
        
        const tenantId = await saveTenant(tenantData, useUnitAsKey);
        const tenant = await getTenant(tenantId);
        
        res.status(201).json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create tenant' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const success = await updateTenant(req.params.id, req.body);
        
        if (!success) {
            return res.status(404).json({ success: false, error: 'Tenant not found' });
        }
        
        const tenant = await getTenant(req.params.id);
        res.json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update tenant' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const success = await deleteTenant(req.params.id);
        
        if (!success) {
            return res.status(404).json({ success: false, error: 'Tenant not found' });
        }
        
        res.json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete tenant' });
    }
});

export default router;
