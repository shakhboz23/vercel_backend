import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('/webhook')
export class WebhookController {
    @Post()
    async handleUpdate(@Req() req: Request) {
        // Telegram updates will be sent here
        console.log(req.body, 'webhook');
    }
}
