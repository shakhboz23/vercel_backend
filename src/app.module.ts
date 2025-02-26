// import { Module, OnApplicationBootstrap } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ConfigModule } from '@nestjs/config';
// import { SequelizeModule } from '@nestjs/sequelize';
// import { JwtModule } from '@nestjs/jwt';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { resolve } from 'path';
// import { FilesModule } from './files/files.module';
// import { ChatModule } from './chat/chat.module';
// import { LessonModule } from './lesson/lesson.module';
// import { UserModule } from './user/user.module';
// import { GroupModule } from './group/group.module';
// import { ChatGroupModule } from './chat_group/chat_group.module';
// import { TestsModule } from './test/test.module';
// import { UploadedModule } from './uploaded/uploaded.module';
// import { NotificationModule } from './notification/notification.module';
// import { MessagesModule } from './messages/messages.module';
// import { RoleModule } from './role/role.module';
// import { ActivityModule } from './activity/activity.module';
// import { ReytingModule } from './reyting/reyting.module';
// import { NewsModule } from './news/news.module';
// import { OtpModule } from './otp/otp.module';
// import { UserStepModule } from './user_step/class.module';
// import { MailModule } from './mail/mail.module';
// import { CloudinaryModule } from './cloudinary/cloudinary.module';
// import { ResetpasswordModule } from './resetpassword/resetpassword.module';
// import { CategoryModule } from './category/category.module';
// import { CourseModule } from './course/course.module';
// import { LikeModule } from './likes/like.module';
// import { SubscriptionsModule } from './subscriptions/subscriptions.module';
// import { UserService } from './user/user.service';
// import { Subscription_activityModule } from './subscription_activity/subscription_activity.module';
// import { VideoChatModule } from './video_chat/video_chat.module';
// import { BotModule } from './bot/bot.module';
// import { TelegrafModule } from 'nestjs-telegraf';
// import { BOT_NAME } from './app.constants';

// @Module({
//   imports: [
//     TelegrafModule.forRootAsync({
//       botName: BOT_NAME,
//       useFactory: () => ({
//         token: process.env.BOT_TOKEN,
//         middlewares: [],
//         includes: [BotModule],
//         launchOptions: {
//           webhook: {
//             domain: 'https://starfish-app-ueywh.ondigitalocean.app/api',
//             hookPath: '/webhook',
//           }
//         }
//       }),
//     }),
//     ConfigModule.forRoot({
//       envFilePath: '.env',
//       isGlobal: true,
//     }),
//     SequelizeModule.forRoot({
//       dialect: 'postgres',
//       host: process.env.PG_HOST,
//       port: Number(process.env.PG_PORT),
//       username: process.env.PG_USER,
//       password: String(process.env.PG_PASS),
//       database: process.env.PG_DB,
//       // models: [
//       // Category,
//       // Group,
//       // Course,
//       // Lesson,
//       // Like,
//       // Chat,
//       // Tests,
//       // User,
//       // ChatGroup,
//       // Uploaded,
//       // Notification,
//       // Message,
//       // Role,
//       // Activity,
//       // Reyting,
//       // News,
//       // Otp,
//       // UserStep,
//       // Subscriptions,
//       // SubscriptionActivity,
//       // VideoChat,
//       // Bot,
//       // ],
//       autoLoadModels: true,
//       logging: true,
//       dialectOptions:
//         process.env.NODE_ENV === 'production'
//           ? {
//             ssl: {
//               require: true,
//               rejectUnauthorized: false,
//             },
//           }
//           : {},
//     }),
//     ServeStaticModule.forRoot({
//       rootPath: resolve(__dirname, '..', 'static'),
//     }),
//     JwtModule.register({ global: true }),
//     MailModule,
//     FilesModule,
//     CategoryModule,
//     GroupModule,
//     CourseModule,
//     LessonModule,
//     LikeModule,
//     // ChatGateway,
//     ChatModule,
//     TestsModule,
//     UserModule,
//     ChatGroupModule,
//     UploadedModule,
//     NotificationModule,
//     MessagesModule,
//     RoleModule,
//     ActivityModule,
//     ReytingModule,
//     NewsModule,
//     OtpModule,
//     UserStepModule,
//     CloudinaryModule,
//     ResetpasswordModule,
//     SubscriptionsModule,
//     Subscription_activityModule,
//     VideoChatModule,
//     BotModule,
//   ],
//   controllers: [AppController],
//   providers: [AppService],
//   exports: []
// })
// // export class AppModule {}
// export class AppModule implements OnApplicationBootstrap {

//   constructor(
//     private readonly userService: UserService,
//   ) { }

//   async onApplicationBootstrap() {
//     await this.userService.createDefaultUser();
//     // ConsoleUtils.startAutoClear();
//   }

// }


import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}