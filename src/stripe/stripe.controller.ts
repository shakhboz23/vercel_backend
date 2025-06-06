// stripe/stripe.controller.ts
import { Controller, Post, Body, Req, Res, Headers, RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StripeDto } from './dto/stripe.dto';
import { Request } from 'express';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(
        private readonly stripeService: StripeService,
    ) { }


    @ApiOperation({ summary: 'Create a new checkoutSession' })
    @Post('/checkout')
    async createCheckout(@Body() stripeDto: StripeDto) {
        return this.stripeService.createCheckoutSession(stripeDto);
    }

    @ApiOperation({ summary: 'Create a new checkoutSession' })
    @Post('/webhook/stripe')
    async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
        return this.stripeService.handleStripeWebhook(req);
    }
}
