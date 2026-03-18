import { Router } from 'express';
import { 
    getAllFlaggedEmails, 
    getFlaggedEmail, 
    resolveFlaggedEmail, 
    deleteFlaggedEmail 
} from '../db/flagged-emails.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const emails = await getAllFlaggedEmails(status as string);
        
        res.json({
            success: true,
            data: emails,
            count: emails.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch flagged emails'
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const email = await getFlaggedEmail(req.params.id);
        
        if (!email) {
            return res.status(404).json({
                success: false,
                error: 'Flagged email not found'
            });
        }
        
        res.json({
            success: true,
            data: email
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch flagged email'
        });
    }
});

router.put('/:id/resolve', async (req, res) => {
    try {
        const success = await resolveFlaggedEmail(req.params.id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Flagged email not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Email resolved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resolve email'
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const success = await deleteFlaggedEmail(req.params.id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Flagged email not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Email deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete email'
        });
    }
});

export default router;
