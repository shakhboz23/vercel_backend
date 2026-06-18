import crypto from 'crypto';

export function validateTelegramWebAppData(initData, botToken) {
    // const params = new URLSearchParams(initData);

    const hash = initData.hash;
    delete initData.hash;

    const dataCheckString = [...initData.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    console.log(dataCheckString);

    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
    console.log(secretKey);


    const calculatedHash = crypto
        .createHmac('sha256', secretKey as crypto.BinaryLike)
        .update(dataCheckString)
        .digest('hex');
    console.log(calculatedHash);


    return calculatedHash === hash;
}