import { FirestoreModel, IFirestoreDocument } from './firebase/FirestoreModel';

export interface IUser extends IFirestoreDocument {
    email: string;
    password?: string;
    googleId?: string;
    name: string;
    createdAt?: Date;
    resetOtp?: string;
    resetOtpExpire?: Date;
    calculatorPassword?: string;
    recoveryKey?: string;
    role: 'user' | 'admin';
    subscriptionStatus: 'free' | 'pro';
    subscriptionExpiry?: Date;
}

export class User extends FirestoreModel {
    static collectionName = 'users';

    public email!: string;
    public password?: string;
    public googleId?: string;
    public name!: string;
    public resetOtp?: string;
    public resetOtpExpire?: Date;
    public calculatorPassword?: string;
    public recoveryKey?: string;
    public role!: 'user' | 'admin';
    public subscriptionStatus!: 'free' | 'pro';
    public subscriptionExpiry?: Date;

    constructor(data: any) {
        super(data);
    }

    static async findByEmail(email: string): Promise<User | null> {
        const usersRef = this.getCollection();
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return new User({ _id: doc.id, ...doc.data() });
    }
}

export default User;
