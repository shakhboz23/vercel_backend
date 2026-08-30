import { BadRequestException } from '@nestjs/common';

export async function newTokenForSMS() {
  try {
    const axios = require('axios');
    const FormData = require('form-data');
    const data = new FormData();
    data.append('email', 'shahbozmamatkarimov2303@gmail.com');
    data.append('password', 'rhU2fVYJvzx7qm75sGfBNcTgGwt0vwUthrdv3jBG');
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'notify.eskiz.uz/api/auth/login',
      headers: {
        ...data.getHeaders(),
      },
      data,
    };
    axios(config)
      .then(function (response: any) {})
      .catch(function (error: any) {
        console.log(error);
      });
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}
