import { FirestoreModel } from './firebase/FirestoreModel';

export interface IReply {
    sender: 'user' | 'admin';
    message: string;
    date: Date;
}

export interface ISupportTicket {
    user: string;
    subject: string;
    message: string;
    status: 'open' | 'closed';
    replies: IReply[];
    createdAt: Date;
}

export class SupportTicket extends FirestoreModel {
    static collectionName = 'supportTickets';

    public user!: string;
    public subject!: string;
    public message!: string;
    public status!: string;
    public replies!: IReply[];

    constructor(data: any) {
        super(data);
    }
}

export default SupportTicket;
