// stripe/stripe.controller.ts
import { Controller, Post, Body, Req, Res, Headers, RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StripeDto } from './dto/stripe.dto';
import { Request } from 'express';
import { extractUserIdFromToken } from 'src/utils/token';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly jwtService: JwtService,
    ) { }


    @ApiOperation({ summary: 'Create a new checkoutSession' })
    @Post('/checkout')
    async createCheckout(
        @Body() stripeDto: StripeDto,
        @Headers() headers?: string
    ) {
        const user_id = extractUserIdFromToken(headers, this.jwtService, true);
        return this.stripeService.createCheckoutSession(user_id, stripeDto);
    }

    @ApiOperation({ summary: 'Create a new checkoutSession' })
    @Post('/webhook/stripe')
    async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
        return this.stripeService.handleStripeWebhook(req);
    }
}
