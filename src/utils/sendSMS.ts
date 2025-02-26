import { BadRequestException } from '@nestjs/common';

export async function sendSMS(phone: string, message: string) {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    const data = new FormData();
    data.append('mobile_phone', phone);
    data.append('message', message);
    data.append('from', 'florify');
    data.append('callback_url', 'http://0000.uz/test.php');
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://notify.eskiz.uz/api/message/sms/send',
      headers: {
        ...data.getHeaders(),
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTYxODU4NTIsImlhdCI6MTcxMzU5Mzg1Miwicm9sZSI6InRlc3QiLCJzaWduIjoiZGRiNzc5NDM1OGMyNDgzYmFjMWFiYjEzNTkxMDYyMWE2MDJhZTJjMjczZWM3M2U4ZGQ2NjA0OWFiNGE5YWJmNiIsInN1YiI6IjcwODAifQ.81vIEsNdZu1Tkzz15jYwpFww-jsxOvqVvNycmTFNmiM',
      },
      data,
    };
    axios(config)
      .then(function (response: any) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error: any) {
        console.log(error);
      });
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

export function otpCodeSMSSchema(code: string) {
  return 'Sizning kod raqamingiz ' + code;
}

export function orderCompleteSMSSchema(id: number) {
  return 'Sizning buyurtmangiz №' + id;
}

export function notifySalesmanForOrderSMSSchema(id: number) {
  return 'Sizga ushbu order №' + id + ` bo'yicha yangi buyurtma kelib tushdi`;
}
