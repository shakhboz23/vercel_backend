// stripe/stripe.controller.ts
import { Controller, Post, Body, Req, Res, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StripeDto } from './dto/stripe.dto';
import { Request, Response } from 'express';

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
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        return this.stripeService.handleStripeWebhook(req, res, signature);
    }
}
