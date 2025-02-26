import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './models/notification.model';
import { NotificationDto } from './dto/notification.dto';
// import { Op } from 'sequelize';
import { User } from '../user/models/user.models';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification)
    private readonly notificationRepository: typeof Notification,
  ) {}

  async create(notificationDto: NotificationDto) {
    try {
      const notification =
        await this.notificationRepository.create(notificationDto);
      return { status: HttpStatus.OK, data: notification };
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findAll(page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    console.log(offset);
    try {
      const notifications = await this.notificationRepository.findAll({
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
          },
        ],
        offset,
        limit,
      });
      const total_count = await this.notificationRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const res = {
        status: HttpStatus.OK,
        data: {
          records: notifications.reverse(),
          pagination: {
            currentPage: page,
            total_pages,
            total_count,
          },
        },
      };
      return res;
    } catch (error) {
      console.log(error);
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  // async getGroupNotifications(notificationgroup_id: number, page: number) {
  //   const limit = 10;
  //   const offset = (page - 1) * limit;
  //   console.log(offset);
  //   try {
  //     const notifications = await this.notificationRepository.findAll({
  //       where: {
  //         notificationgroup_id,
  //       },
  //       order: [['updatedAt', 'DESC']],
  //       include: [
  //         {
  //           model: User,
  //         },
  //       ],
  //       offset,
  //       limit,
  //     });
  //     const total_count = await this.notificationRepository.count();
  //     const total_pages = Math.ceil(total_count / limit);
  //     const res = {
  //       status: HttpStatus.OK,
  //       data: {
  //         records: notifications.reverse(),
  //         pagination: {
  //           currentPage: page,
  //           total_pages,
  //           total_count,
  //         },
  //       },
  //     };
  //     return res;
  //   } catch (error) {
  //     console.log(error);
  //     return { status: HttpStatus.NOT_FOUND, error: error.message };
  //   }
  // }

  // async findAll(page: number, data: SearchDto, filter: any) {
  //   const { search, searchType } = data;
  //   let where = {};
  //   for (let i of Object.keys(filter)) {
  //     if (filter[i] != null) {
  //       if (i == 'subject_id') {
  //         where[`${i}`] = Sequelize.literal(
  //           `CAST(${i} AS TEXT) ILIKE '%${filter[i]}%'`,
  //         );
  //       } else if (i == 'weeks' || i == 'startTime') {
  //         where[`${i}`] = { [Op.iLike]: `%${filter[i]}%` };
  //       } else if (i == 'teacher_id') {
  //         where['teacher_id'] = { [Op.or]: filter[i] };
  //       } else {
  //         where[`${i}`] = { [Op.gte]: new Date(filter[i]) };
  //       }
  //     }
  //   }

  //   if (!search) {
  //     where = filter ? where : null;
  //   } else if (searchType == 'id') {
  //     console.log(search);
  //     where['id'] = Sequelize.literal(
  //       `CAST("Notification"."id" AS TEXT) ILIKE '%${search}%'`,
  //     );
  //   } else {
  //     where[`${searchType}`] = { [Op.iLike]: `%${search}%` };
  //   }
  //   const limit = 10;
  //   const offset = (page - 1) * limit;
  //   console.log(where);
  //   try {
  //     const notifications = await this.notificationRepository.findAll({
  //       where,
  //       order: [['id', 'DESC']],
  //       include: [
  //         // {
  //         //   model: Test,
  //         //   order: [['id', 'DESC']],
  //         //   limit: 1,
  //         // },
  //         // { model: Subject, order: [['id', 'DESC']] },
  //         // { model: Teacher, attributes: ['username'] },
  //       ],
  //       offset,
  //       limit,
  //     });
  //     const total_count = await this.notificationRepository.count({
  //       where,
  //     });
  //     const total_pages = Math.ceil(total_count / limit);
  //     const res = {
  //       status: HttpStatus.OK,
  //       data: {
  //         records: notifications,
  //         pagination: {
  //           currentPage: page,
  //           total_pages,
  //           total_count,
  //         },
  //       },
  //     };
  //     return res;
  //   } catch (error) {
  //     console.log(error);
  //     return { status: HttpStatus.NOT_FOUND, error: error.message };
  //   }
  // }

  async findAllId() {
    try {
      const notificationId = await this.notificationRepository.findAll({
        attributes: ['id'],
      });
      return notificationId;
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findById(id: string) {
    try {
      const notifications = await this.notificationRepository.findOne({
        where: { id },
      });
      if (!notifications) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      return { status: HttpStatus.OK, data: notifications };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async update(id: string, notificationDto: NotificationDto) {
    try {
      const notification = await this.findById(id);
      if (notification.status === 400) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      const updated_info = await this.notificationRepository.update(
        notificationDto,
        {
          where: { id: notification.data.id },
          returning: true,
        },
      );
      return {
        status: HttpStatus.OK,
        data: updated_info[1][0],
      };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async delete(id: string) {
    try {
      const notification = await this.findById(id);
      if (notification.status === 400) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      await notification.data.destroy();
      return { status: HttpStatus.OK, data: 'deleted' };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }
}
