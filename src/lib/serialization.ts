
// Helper to make any object serializable
export function makeSerializable<T>(obj: any): T {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => makeSerializable(item)) as any;
    }

    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const serializableObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value && typeof value.toDate === 'function') {
                serializableObj[key] = value.toDate().toISOString();
            } else if (typeof value === 'object' && value !== null) {
                serializableObj[key] = makeSerializable(value);
            } else {
                serializableObj[key] = value;
            }
        }
    }
    return serializableObj as T;
}
