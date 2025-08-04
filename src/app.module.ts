import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'path';
import { FilesModule } from './files/files.module';
import { ChatModule } from './chat/chat.module';
import { LessonModule } from './lesson/lesson.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { ChatGroupModule } from './chat_group/chat_group.module';
import { TestsModule } from './test/test.module';
import { UploadedModule } from './uploaded/uploaded.module';
import { NotificationModule } from './notification/notification.module';
import { MessagesModule } from './messages/messages.module';
import { RoleModule } from './role/role.module';
import { ActivityModule } from './activity/activity.module';
import { ReytingModule } from './reyting/reyting.module';
import { NewsModule } from './news/news.module';
import { OtpModule } from './otp/otp.module';
import { UserStepModule } from './user_step/class.module';
import { MailModule } from './mail/mail.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ResetpasswordModule } from './resetpassword/resetpassword.module';
import { CategoryModule } from './category/category.module';
import { CourseModule } from './course/course.module';
import { LikeModule } from './likes/like.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UserService } from './user/user.service';
import { Subscription_activityModule } from './subscription_activity/subscription_activity.module';
import { VideoChatModule } from './video_chat/video_chat.module';
import { Category } from './category/models/category.models';
import { Group } from './group/models/group.models';
import { Course } from './course/models/course.models';
import { Lesson } from './lesson/models/lesson.models';
import { Like } from './likes/models/like.models';
import { Chat } from './chat/models/chat.model';
import { Tests } from './test/models/test.models';
import { User } from './user/models/user.models';
import { ChatGroup } from './chat_group/models/chat_group.models';
import { Uploaded } from './uploaded/models/uploaded.models';
import { Notification } from './notification/models/notification.model';
import { Activity } from './activity/models/activity.models';
import { Role } from './role/models/role.models';
import { Reyting } from './reyting/models/reyting.models';
import { News } from './news/models/news.model';
import { UserStep } from './user_step/models/class.models';
import { SubscriptionActivity } from './subscription_activity/models/subscription_activity.models';
import { Subscriptions } from './subscriptions/models/subscriptions.models';
import { VideoChat } from './video_chat/models/video_chat.model';
import { TelegrafModule } from 'nestjs-telegraf';
// import { BOT_NAME } from './app.constants';
import { BotModule } from './bot/bot.module';
import { WatchedModule } from './watched/watched.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MyService } from './schedules/schedule.service';
import { Comment } from './comment/models/comment.models';
import { CommentModule } from './comment/comment.module';
import { SubCategory } from './subcategory/models/subcategory.models';
import { SubCategoryModule } from './subcategory/subcategory.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentStripe } from './stripe/models/stripe.models';
import { BOT_NAME } from './app.constants';
import { Bot } from './bot/models/bot.model';
@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => {
        return process.env.NODE_ENV !== 'production' ? {
          token: process.env.BOT_TOKEN,
          includes: [BotModule],
          // launchOptions: {
          //   webhook: {
          //     domain: 'https://vercelbackend-production.up.railway.app',
          //     hookPath: '/api/webhook',
          //   }
          // }
        } : {
          token: process.env.BOT_TOKEN,
          // includes: [BotModule],
          launchOptions: {
            webhook: {
              domain: 'https://vercel-backend-bay.vercel.app',
              hookPath: '/api/webhook/bot',
            }
          }
        }
      },
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.PGHOST,
      // port: Number(process.env.PG_PORT),
      username: process.env.PGUSER,
      password: String(process.env.PGPASSWORD),
      database: process.env.PGDATABASE,
      models: [
        Category,
        Group,
        Course,
        Lesson,
        Like,
        Chat,
        Tests,
        User,
        ChatGroup,
        Uploaded,
        Notification,
        Activity,
        Role,
        Reyting,
        News,
        UserStep,
        Subscriptions,
        SubscriptionActivity,
        VideoChat,
        Comment,
        SubCategory,
        PaymentStripe,
        Bot,
      ],
      // autoLoadModels: true,
      logging: true,
      // synchronize: true,
      // sync: { alter: true },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: resolve(__dirname, '..', 'static'),
      serveRoot: '/static',
    }),
    JwtModule.register({ global: true }),
    MailModule,
    FilesModule,
    CategoryModule,
    SubCategoryModule,
    GroupModule,
    CourseModule,
    LessonModule,
    LikeModule,
    // ChatGateway,
    ChatModule,
    TestsModule,
    UserModule,
    ChatGroupModule,
    UploadedModule,
    NotificationModule,
    MessagesModule,
    RoleModule,
    ActivityModule,
    ReytingModule,
    NewsModule,
    OtpModule,
    UserStepModule,
    CloudinaryModule,
    ResetpasswordModule,
    SubscriptionsModule,
    Subscription_activityModule,
    VideoChatModule,
    WatchedModule,
    CommentModule,
    BotModule,
    StripeModule,
  ],
  controllers: [],
  providers: [
    MyService,
  ],
  exports: []
})
export class AppModule implements OnApplicationBootstrap {

  constructor(
    private readonly userService: UserService,
  ) { }

  async onApplicationBootstrap() {
    await this.userService.createDefaultUser();
    // ConsoleUtils.startAutoClear();
  }

}