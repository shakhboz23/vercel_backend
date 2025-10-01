import { Module, forwardRef } from '@nestjs/common';
import { ReytingService } from './reyting.service';
import { ReytingController } from './reyting.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Reyting } from './models/reyting.models';
import { JwtModule } from '@nestjs/jwt';
import { TestsModule } from 'src/test/test.module';

@Module({
  imports: [SequelizeModule.forFeature([Reyting]), JwtModule, forwardRef(()=> TestsModule),],
  controllers: [ReytingController],
  providers: [ReytingService],
  exports: [ReytingService],
})
export class ReytingModule {}
