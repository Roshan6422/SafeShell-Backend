import { FirestoreModel } from './firebase/FirestoreModel';

export interface IPayment {
    user: string;
    amount: number;
    currency: string;
    status: string;
    date: Date;
    transactionId?: string;
    paymentMethod?: string;
    plan?: string;
    orderId?: string;
}

export class Payment extends FirestoreModel {
    static collectionName = 'payments';

    public user!: string;
    public amount!: number;
    public currency!: string;
    public status!: string;
    public date!: Date;
    public transactionId?: string;
    public paymentMethod?: string;
    public plan?: string;
    public orderId?: string;

    constructor(data: any) {
        super(data);
    }
}

export default Payment;
