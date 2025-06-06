import { Module, forwardRef } from '@nestjs/common';
import { WatchedService } from './watched.service';
import { WatchedController } from './watched.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Watched } from './models/watched.models';
import { FilesModule } from '../files/files.module'; // Verify import path
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { LikeModule } from 'src/likes/like.module';

@Module({
  imports: [SequelizeModule.forFeature([Watched]), JwtModule, LikeModule],
  controllers: [WatchedController],
  providers: [WatchedService],
  exports: [WatchedService],
})
export class WatchedModule {}
