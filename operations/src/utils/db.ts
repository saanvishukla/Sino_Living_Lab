import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('error', (err: Error) => console.error('Redis Client Error:', err));
redis.on('connect', () => console.log('Connected to Redis'));

export interface TenantRecord {
    id: string;
    [key: string]: any;
}

export const saveTenant = async (data: Record<string, any>, useUnitAsKey: boolean = false): Promise<string> => {
    let tenantId: string;
    
    // Check if a tenant already exists for this unit
    if (data.unit) {
        const existingId = await redis.get(`unit:${data.unit}:tenant`);
        if (existingId) {
            // Delete the old tenant record before creating a new one
            await deleteTenant(existingId);
            console.log(`Overwriting existing tenant ${existingId} for unit ${data.unit}`);
        }
    }

    if (useUnitAsKey && data.building && data.unit) {
        tenantId = `${data.building}:${data.unit}`;
    } else {
        tenantId = randomUUID();
    }
    
    const tenantRecord: TenantRecord = {
        id: tenantId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const key = `tenant:${tenantId}`;
    await redis.set(key, JSON.stringify(tenantRecord));
    
    if (data.building) {
        await redis.sadd(`building:${data.building}:tenants`, tenantId);
    }
    
    if (data.floor) {
        await redis.sadd(`floor:${data.floor}:tenants`, tenantId);
    }
    
    if (data.unit) {
        await redis.set(`unit:${data.unit}:tenant`, tenantId);
    }
    
    return tenantId;
};

export const getTenant = async (tenantId: string): Promise<TenantRecord | null> => {
    const key = `tenant:${tenantId}`;
    const data = await redis.get(key);
    
    if (!data) return null;
    
    return JSON.parse(data);
};

export const updateTenant = async (tenantId: string, updates: Record<string, any>): Promise<boolean> => {
    const existing = await getTenant(tenantId);
    
    if (!existing) return false;
    
    const updated: TenantRecord = {
        ...existing,
        ...updates,
        id: tenantId,
        updatedAt: new Date().toISOString()
    };
    
    const key = `tenant:${tenantId}`;
    await redis.set(key, JSON.stringify(updated));
    
    return true;
};

export const deleteTenant = async (tenantId: string): Promise<boolean> => {
    const existing = await getTenant(tenantId);
    
    if (!existing) return false;
    
    const key = `tenant:${tenantId}`;
    await redis.del(key);
    
    if (existing.building) {
        await redis.srem(`building:${existing.building}:tenants`, tenantId);
    }
    
    if (existing.floor) {
        await redis.srem(`floor:${existing.floor}:tenants`, tenantId);
    }
    
    if (existing.unit) {
        await redis.del(`unit:${existing.unit}:tenant`);
    }
    
    return true;
};

export const getTenantsByBuilding = async (building: string): Promise<TenantRecord[]> => {
    const tenantIds = await redis.smembers(`building:${building}:tenants`);
    const tenants: TenantRecord[] = [];
    
    for (const id of tenantIds) {
        const tenant = await getTenant(id);
        if (tenant) tenants.push(tenant);
    }
    
    return tenants;
};

export const getTenantsByFloor = async (floor: string): Promise<TenantRecord[]> => {
    const tenantIds = await redis.smembers(`floor:${floor}:tenants`);
    const tenants: TenantRecord[] = [];
    
    for (const id of tenantIds) {
        const tenant = await getTenant(id);
        if (tenant) tenants.push(tenant);
    }
    
    return tenants;
};

export const getTenantByUnit = async (unit: string): Promise<TenantRecord | null> => {
    const tenantId = await redis.get(`unit:${unit}:tenant`);
    
    if (!tenantId) return null;
    
    return getTenant(tenantId);
};

export const getAllTenants = async (): Promise<TenantRecord[]> => {
    const keys = await redis.keys('tenant:*');
    const tenants: TenantRecord[] = [];
    
    for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
            tenants.push(JSON.parse(data));
        }
    }
    
    return tenants;
};

export const closeRedis = async (): Promise<void> => {
    await redis.quit();
};

export default redis;
