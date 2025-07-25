// stripe/stripe.module.ts
import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PaymentStripe } from './models/stripe.models';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { CourseModule } from 'src/course/course.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Module({
  imports: [
    SequelizeModule.forFeature([PaymentStripe]),
    JwtModule,
    CourseModule,
    SubscriptionsModule,
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],

})
export class StripeModule { }

// import { DynamicModule, Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { StripeController } from './stripe.controller'; 
// import { StripeService } from './stripe.service';
 
// @Module({})
// export class StripeModule {

//   static forRootAsync(): DynamicModule {
//     return {
//       module: StripeModule,
//       controllers: [StripeController],
//       imports: [ConfigModule.forRoot()],
//       providers: [
//         StripeService,
//         {
//           provide: process.env.STRIPE_API_KEY,
//           useFactory: async (configService: ConfigService) =>
//             configService.get(process.env.STRIPE_API_KEY),
//           inject: [ConfigService],
//         },
//       ],
//     };
//   }
// }