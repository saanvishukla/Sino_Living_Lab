import { redis } from './db';
import { randomUUID } from 'crypto';

export interface FlaggedEmail {
    id: string;
    subject: string;
    sender: string;
    receivedAt: string;
    htmlContent: string;
    errorMessage: string;
    status: 'pending' | 'resolved' | 'archived';
    createdAt: string;
    resolvedAt?: string;
}

export const saveFlaggedEmail = async (emailData: {
    subject: string;
    sender: string;
    htmlContent: string;
    errorMessage: string;
}): Promise<string> => {
    const emailId = randomUUID();
    const flaggedEmail: FlaggedEmail = {
        id: emailId,
        ...emailData,
        receivedAt: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const key = `flagged_email:${emailId}`;
    await redis.set(key, JSON.stringify(flaggedEmail));
    await redis.sadd('flagged_emails:pending', emailId);
    
    return emailId;
};

export const getFlaggedEmail = async (id: string): Promise<FlaggedEmail | null> => {
    const key = `flagged_email:${id}`;
    const data = await redis.get(key);
    
    if (!data) return null;
    
    return JSON.parse(data);
};

export const getAllFlaggedEmails = async (status?: string): Promise<FlaggedEmail[]> => {
    const pattern = 'flagged_email:*';
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return [];
    
    const emails: FlaggedEmail[] = [];
    
    for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
            const email = JSON.parse(data);
            if (!status || email.status === status) {
                emails.push(email);
            }
        }
    }
    
    return emails.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const resolveFlaggedEmail = async (id: string): Promise<boolean> => {
    const email = await getFlaggedEmail(id);
    if (!email) return false;
    
    email.status = 'resolved';
    email.resolvedAt = new Date().toISOString();
    
    const key = `flagged_email:${id}`;
    await redis.set(key, JSON.stringify(email));
    await redis.srem('flagged_emails:pending', id);
    await redis.sadd('flagged_emails:resolved', id);
    
    return true;
};

export const deleteFlaggedEmail = async (id: string): Promise<boolean> => {
    const email = await getFlaggedEmail(id);
    if (!email) return false;
    
    const key = `flagged_email:${id}`;
    await redis.del(key);
    await redis.srem('flagged_emails:pending', id);
    await redis.srem('flagged_emails:resolved', id);
    
    return true;
};
