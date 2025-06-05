// stripe/stripe.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StripeDto } from './dto/stripe.dto';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    @ApiOperation({ summary: 'Create a new checkoutSession' })
    @Post('/checkout')
    async createCheckout(@Body() stripeDto: StripeDto) {
        return this.stripeService.createCheckoutSession(stripeDto);
    }
}
