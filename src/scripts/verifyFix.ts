
import VaultItem from '../models/VaultItem';
import path from 'path';
import fs from 'fs';

async function verify() {
    console.log('--- Starting Verification ---');
    console.log('Current Work Dir:', process.cwd());

    // 1. Check if model can create item with isDeleted: false
    try {
        const testItem = await VaultItem.create({
            user: 'test_user_id',
            name: 'test_photo.jpg',
            type: 'photo',
            size: '100 KB',
            url: '/uploads/test_photo.jpg',
            isDeleted: false
        });
        console.log('✅ Created test item:', testItem._id);

        // 2. Check if we can find it with same query as controller
        const items = await VaultItem.find({
            user: 'test_user_id',
            isDeleted: false,
            type: 'photo'
        });

        const found = items.find(i => i._id === testItem._id);
        if (found) {
            console.log('✅ Successfully retrieved test item with isDeleted: false filter');
        } else {
            console.error('❌ Failed to retrieve test item - still hidden?');
        }

        // 3. Test the "undefined as false" logic
        console.log('3. Testing "undefined as false" logic...');
        const legacyItem = await VaultItem.create({
            user: 'test_user_id',
            name: 'legacy_photo.jpg',
            type: 'photo',
            size: '50 KB',
            url: '/uploads/legacy_photo.jpg'
            // isDeleted is missing (undefined)
        });

        const results = await VaultItem.find({
            user: 'test_user_id',
            isDeleted: false,
            type: 'photo'
        });

        const foundLegacy = results.find(i => i._id === legacyItem._id);
        if (foundLegacy) {
            console.log('✅ Successfully retrieved legacy item (isDeleted: undefined) using isDeleted: false search');
        } else {
            console.error('❌ Failed to retrieve legacy item - filter is still too strict!');
        }

        console.log('--- Verification Complete ---');
    } catch (e) {
        console.error('❌ Verification failed with error:', e);
    }
}

verify();
