import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Payment from '../models/Payment';
import md5 from 'crypto-js/md5';

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1228956';
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || 'your_merchant_secret';
const PAYHERE_NOTIFY_URL = process.env.PAYHERE_NOTIFY_URL || 'http://localhost:5000/api/payment/notify';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: format amount to 2 decimal places (no commas)
function formatAmount(amount: number): string {
    return parseFloat(amount.toString()).toLocaleString('en-us', { minimumFractionDigits: 2 }).replace(/,/g, '');
}

// Helper: generate PayHere MD5 hash
function generatePayHereHash(merchantId: string, orderId: string, amount: number, currency: string, merchantSecret: string): string {
    const hashedSecret = md5(merchantSecret).toString().toUpperCase();
    const amountFormatted = formatAmount(amount);
    const hash = md5(merchantId + orderId + amountFormatted + currency + hashedSecret).toString().toUpperCase();
    return hash;
}

// @desc    Generate hash for PayHere checkout
// @route   POST /api/payment/generate-hash
// @access  Private
export const generateHash = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const amount = 2990.00; // LKR price for Pro Monthly
        const currency = 'LKR';
        const orderId = `SAFESHELL-${userId}-${Date.now()}`;

        // Create pending payment record
        const payment = await Payment.create({
            user: userId,
            amount: amount,
            currency: currency,
            status: 'pending',
            date: new Date(),
            plan: 'Pro Monthly',
            orderId: orderId,
            paymentMethod: 'payhere'
        });

        // Generate hash (must be done server-side to protect merchant_secret)
        const hash = generatePayHereHash(MERCHANT_ID, orderId, amount, currency, MERCHANT_SECRET);

        // Split name for PayHere
        const nameParts = (user.name || 'User').split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';

        res.json({
            merchant_id: MERCHANT_ID,
            return_url: `${FRONTEND_URL}/payment-success`,
            cancel_url: `${FRONTEND_URL}/payment`,
            notify_url: PAYHERE_NOTIFY_URL,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            phone: '0000000000',
            address: 'N/A',
            city: 'N/A',
            country: 'Sri Lanka',
            order_id: orderId,
            items: 'SafeShell Pro Monthly Subscription',
            currency: currency,
            amount: formatAmount(amount),
            hash: hash,
            sandbox: true, // Set to false for production
        });

    } catch (error) {
        console.error('Hash Generation Error:', error);
        res.status(500).json({ message: 'Server error generating payment hash' });
    }
};

// @desc    PayHere payment notification webhook
// @route   POST /api/payment/notify
// @access  Public (called by PayHere server)
export const payhereNotify = async (req: Request, res: Response) => {
    try {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig,
            payment_id,
            method
        } = req.body;

        // Verify the md5sig
        const hashedSecret = md5(MERCHANT_SECRET).toString().toUpperCase();
        const localSig = md5(
            merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret
        ).toString().toUpperCase();

        if (localSig !== md5sig) {
            console.error('PayHere signature mismatch!');
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Find the payment by orderId
        const payment = await Payment.findOne({ orderId: order_id });
        if (!payment) {
            console.error('Payment not found for order:', order_id);
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Status code 2 = success
        if (parseInt(status_code) === 2) {
            payment.status = 'completed';
            payment.transactionId = payment_id;
            payment.paymentMethod = method || 'payhere';
            await payment.save();

            // Upgrade user subscription
            const user = await User.findById(payment.user);
            if (user) {
                user.subscriptionStatus = 'pro';
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                user.subscriptionExpiry = nextMonth;
                await user.save();
                console.log(`User ${user.email} upgraded to Pro via PayHere`);
            }
        } else if (parseInt(status_code) === 0) {
            payment.status = 'pending';
            payment.transactionId = payment_id;
            await payment.save();
        } else {
            // -1 canceled, -2 failed, -3 chargedback
            payment.status = 'failed';
            payment.transactionId = payment_id;
            await payment.save();
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('PayHere Notify Error:', error);
        res.status(500).json({ message: 'Server error processing notification' });
    }
};

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private
export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
    try {
        const payments = await Payment.find({ user: req.user.id }, { date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payment/all
// @access  Private/Admin
export const getAllPayments = async (req: AuthRequest, res: Response) => {
    try {
        const payments = await Payment.find({}, { date: -1 });

        // Manual population
        const populatedPayments = await Promise.all(payments.map(async (p: any) => {
            const user = await User.findById(p.user);
            return {
                ...p,
                user: user ? { _id: user._id, name: user.name, email: user.email } : null
            };
        }));

        res.json(populatedPayments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching payments' });
    }
};
