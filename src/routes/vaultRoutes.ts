import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getItems, createItem, deleteItem, uploadItem, updateItem, restoreItem, emptyRecycleBin } from '../controllers/vaultController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// Debug middleware to log incoming fields
router.post('/upload', protect, (req, res, next) => {
    console.log('--- Incoming Upload Request ---');
    console.log('Headers:', req.headers['content-type']);
    next();
});

// IMPORTANT: /upload MUST come BEFORE /:id to avoid being caught as a param
router.post('/upload', protect, upload.any(), (req: Request, res: Response, next: NextFunction) => {
    uploadItem(req, res).catch(next);
});

router.route('/').get(protect, getItems).post(protect, createItem);
router.delete('/empty-bin', protect, emptyRecycleBin);
router.post('/:id/restore', protect, restoreItem);
router.route('/:id').delete(protect, deleteItem).put(protect, updateItem);

// Multer error handler
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.code, err.message, 'Field:', err.field);
        res.status(400).json({ message: `Upload error: ${err.message}${err.field ? ' (Field: ' + err.field + ')' : ''}` });
    } else if (err) {
        console.error('General Upload error:', err.message);
        res.status(400).json({ message: err.message });
    } else {
        next();
    }
});

export default router;
