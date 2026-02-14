import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import VaultItem from '../models/VaultItem';
import path from 'path';
import fs from 'fs';

// Helper to format file size
const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to determine item type from extension
const getTypeByExtension = (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    const photoExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.bmp'];
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const zipExts = ['.zip', '.rar', '.7z', '.tar', '.gz'];

    if (photoExts.includes(ext)) return 'photo';
    if (videoExts.includes(ext)) return 'video';
    if (zipExts.includes(ext)) return 'zip';
    return 'document';
};

export const getItems = async (req: AuthRequest, res: Response) => {
    try {
        const { type, isDeleted } = req.query;
        const filter: any = {
            user: req.user.id,
            isDeleted: isDeleted === 'true'
        };

        if (type) {
            filter.type = type;
        }

        const items = await VaultItem.find(filter, { createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createItem = async (req: AuthRequest, res: Response) => {
    try {
        const { name, type, size, url, content } = req.body;

        const item = await VaultItem.create({
            user: req.user.id,
            name,
            type: type || getTypeByExtension(name),
            size: size || (content ? `${(content.length / 1024).toFixed(1)} KB` : '0 B'),
            url,
            content,
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const uploadItem = async (req: AuthRequest, res: Response) => {
    try {
        const files = (req as any).files || (req.file ? [req.file] : []);

        if (!files || files.length === 0) {
            console.error('Upload failed: No file in request. Fields received:', Object.keys(req.body));
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const items = [];
        for (const file of files) {
            console.log('Uploading file:', file.originalname, 'Field name:', file.fieldname);
            const type = getTypeByExtension(file.originalname);

            const item = await VaultItem.create({
                user: req.user.id,
                name: file.originalname,
                type,
                size: formatSize(file.size),
                url: `/uploads/${file.filename}`,
            });
            items.push(item);
        }

        res.status(201).json(items.length === 1 ? items[0] : items);
    } catch (error) {
        console.error('Upload error in controller:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateItem = async (req: AuthRequest, res: Response) => {
    try {
        const item = await VaultItem.findById(req.params.id as string);

        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }

        if (item.user.toString() !== req.user.id) {
            res.status(401).json({ message: 'User not authorized' });
            return;
        }

        const { name, content } = req.body;
        if (name) item.name = name;
        if (content !== undefined) {
            item.content = content;
            item.size = `${(content.length / 1024).toFixed(1)} KB`;
        }
        await item.save();

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
    try {
        const item = await VaultItem.findById(req.params.id as string);

        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }

        if (item.user.toString() !== req.user.id) {
            res.status(401).json({ message: 'User not authorized' });
            return;
        }

        const { permanent } = req.query;

        if (permanent === 'true') {
            // Delete file from disk if it exists
            if (item.url) {
                const filePath = path.join(__dirname, '../../uploads', path.basename(item.url));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await item.deleteOne();
            res.status(200).json({ message: 'Item permanently removed' });
        } else {
            // Soft delete
            item.isDeleted = true;
            item.deletedAt = new Date();
            await item.save();
            res.status(200).json({ message: 'Item moved to recycle bin' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const restoreItem = async (req: AuthRequest, res: Response) => {
    try {
        const item = await VaultItem.findById(req.params.id as string);
        if (!item || item.user.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Item not found' });
        }
        item.isDeleted = false;
        item.deletedAt = undefined;
        await item.save();
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const emptyRecycleBin = async (req: AuthRequest, res: Response) => {
    try {
        const items = await VaultItem.find({
            user: req.user.id,
            isDeleted: true
        });

        if (items.length === 0) {
            res.status(200).json({ message: 'Recycle bin is already empty' });
            return;
        }

        // Delete files from disk
        for (const item of items) {
            if (item.url) {
                const filePath = path.join(__dirname, '../../uploads', path.basename(item.url));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Delete from database
        await VaultItem.deleteMany({
            user: req.user.id,
            isDeleted: true
        });

        res.status(200).json({ message: 'Recycle bin emptied successfully' });
    } catch (error) {
        console.error('Empty Recycle Bin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
