import { RoleService } from '../role/role.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Put,
} from '@nestjs/common';
import { Subscription_activityService } from './subscription_activity.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionActivityDto } from './dto/subscription_activity.dto';

@ApiTags('Subscription_activity')
@Controller('subscription_activity')
export class Subscription_activityController {
  constructor(
    private readonly subscription_activityService: Subscription_activityService,
    private readonly roleService: RoleService,
  ) { }

  @ApiOperation({ summary: 'Registration a new subscription_activity' })
  @Post('create')
  async create(
    @Body() subscriptionActivityDto: SubscriptionActivityDto,
  ) {
    const data = await this.subscription_activityService.create(subscriptionActivityDto);
    return data;
  }

  // @Get('activation_link/:activation_link')
  // activate(@Param('activation_link') activation_link: string) {
  //   // return this.subscription_activityService.activateLink(activation_link);
  // }

  @ApiOperation({ summary: 'Get all subscription_activitys' })
  // @UseGuards(AuthGuard)
  @Get('getByRole')
  getAll() {
    return this.subscription_activityService.getAll();
  }

  @ApiOperation({ summary: 'Get subscription_activity by ID' })
  // @UseGuards(AuthGuard)
  @Get(':id')
  getById(@Param('id') id: number) {
    return this.subscription_activityService.getById(id);
  }

  // @ApiOperation({ summary: 'Update subscriptions profile by ID' })
  // // @UseGuards(AuthGuard)
  // @Put('/')
  // update(@Body() subscriptionActivityDto: SubscriptionActivityDto) {
  //   return this.subscription_activityService.update(subscriptionActivityDto);
  // }

  // @ApiOperation({ summary: 'Get subscription_activitys with pagination' })
  // // @UseGuards(AuthGuard)
  // @Get('pagination/:page/:limit')
  // pagination(@Param('page') page: number, @Param('limit') limit: number) {
  //   return this.subscription_activityService.pagination(page, limit);
  // }

  // @ApiOperation({ summary: 'Delete subscription_activity by ID' })
  // // @UseGuards(AuthGuard)
  // @Delete(':id')
  // deleteSubscription_activity(@Param('id') id: string) {
  //   return this.subscription_activityService.deleteSubscription_activity(id);
  // }
}
