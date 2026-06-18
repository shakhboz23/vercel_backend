// import crypto from 'crypto';
import { createHmac, BinaryLike } from 'crypto';

export function validateTelegramWebAppData(initData, botToken) {
    const params = new URLSearchParams(initData);

    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

    const calculatedHash = createHmac('sha256', secretKey as BinaryLike )
        .update(dataCheckString)
        .digest('hex');

    return calculatedHash === hash;
}