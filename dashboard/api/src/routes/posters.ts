import { Router } from 'express';
import redis from '../db/redis.js';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const posterIds = await redis.smembers('posters');
        
        const posters = [];
        for (const id of posterIds) {
            const data = await redis.get(`poster:${id}`);
            if (data) {
                posters.push(JSON.parse(data));
            }
        }
        
        posters.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        res.json({
            success: true,
            data: posters,
            count: posters.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch posters'
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const data = await redis.get(`poster:${req.params.id}`);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Poster not found'
            });
        }
        
        res.json({
            success: true,
            data: JSON.parse(data)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch poster'
        });
    }
});

router.get('/:id/image', async (req, res) => {
    try {
        const data = await redis.get(`poster:${req.params.id}`);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Poster not found'
            });
        }
        
        const poster = JSON.parse(data);
        const imagePath = poster.filepath;
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                error: 'Image file not found'
            });
        }
        
        res.sendFile(imagePath);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch image'
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleted = await redis.del(`poster:${req.params.id}`);
        await redis.srem('posters', req.params.id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Poster not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Poster deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete poster'
        });
    }
});

export default router;
