// import crypto from 'crypto';
import { createHmac, BinaryLike } from 'crypto';

export function validateTelegramWebAppData(initData, botToken) {
    console.log(botToken);
    
    const params = new URLSearchParams(initData);

    const hash = params.get('hash');
    params.delete('hash');
    params.delete('signature');
    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    console.log(dataCheckString);
    
    const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
    console.log(secretKey);

    const calculatedHash = createHmac('sha256', secretKey as BinaryLike )
        .update(dataCheckString)
        .digest('hex');
    console.log(calculatedHash);

    return calculatedHash === hash;
}