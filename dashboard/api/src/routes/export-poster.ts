import { Router } from 'express';
import redis from '../db/redis.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const router = Router();

router.post('/pdf/:id', async (req, res) => {
    try {
        const posterData = await redis.get(`poster:${req.params.id}`);
        
        if (!posterData) {
            return res.status(404).json({
                success: false,
                error: 'Poster not found'
            });
        }
        
        const poster = JSON.parse(posterData);
        const imagePath = poster.filepath;
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                error: 'Poster image file not found'
            });
        }
        
        const pdfPath = imagePath.replace('.png', '.pdf');
        const pythonScript = `
from PIL import Image
img = Image.open("${imagePath}")
img.save("${pdfPath}", "PDF", resolution=100.0)
`;
        
        const scriptPath = '/tmp/convert_to_pdf.py';
        fs.writeFileSync(scriptPath, pythonScript);
        
        await execAsync(`python3 ${scriptPath}`);
        
        if (!fs.existsSync(pdfPath)) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate PDF'
            });
        }
        
        res.download(pdfPath, `poster_${req.params.id}.pdf`, (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
            }
            fs.unlinkSync(pdfPath);
            fs.unlinkSync(scriptPath);
        });
        
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export PDF'
        });
    }
});

export default router;
