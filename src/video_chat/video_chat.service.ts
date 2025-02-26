import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VideoChat } from './models/video_chat.model';
import { FilesService } from '../files/files.service';
import { User } from '../user/models/user.models';
import { VideoChatDto } from './dto/video_chat.dto';

@Injectable()
export class VideoChatService {
  constructor(
    @InjectModel(VideoChat) private readonly VideoChatRepository: typeof VideoChat,
    private readonly fileService: FilesService,
  ) { }

  async create(videoChatDto: VideoChatDto, headers: { 'user-agent': string }) {
    try {
      console.log(videoChatDto.room, '++++++++++++++++');
      const userAgent = headers['user-agent'];
      let result: any;
      let filePath: string;
      const chat = await this.VideoChatRepository.create({ ...videoChatDto });
      return { status: HttpStatus.OK, data: chat };
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async joinRoom(room: string) {
    console.log(room);
    try {
      const chats = await this.VideoChatRepository.findOne({
        where: { room },
      }); 
      if (!chats) {
        new NotFoundException('Not found');
      }
      return chats.room;
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async findAll(page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    console.log(offset);
    try {
      const chats = await this.VideoChatRepository.findAll({
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
          },
        ],
        offset,
        limit,
      });
      const total_count = await this.VideoChatRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const res = {
        status: HttpStatus.OK,
        data: {
          records: chats.reverse(),
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

  async getGroupChats(chatgroup_id: number, page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    console.log(offset);
    try {
      const chats = await this.VideoChatRepository.findAll({
        where: {
        },
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
          },
        ],
        offset,
        limit,
      });
      const total_count = await this.VideoChatRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const res = {
        status: HttpStatus.OK,
        data: {
          records: chats.reverse(),
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
  //       `CAST("Chat"."id" AS TEXT) ILIKE '%${search}%'`,
  //     );
  //   } else {
  //     where[`${searchType}`] = { [Op.iLike]: `%${search}%` };
  //   }
  //   const limit = 10;
  //   const offset = (page - 1) * limit;
  //   console.log(where);
  //   try {
  //     const chats = await this.VideoChatRepository.findAll({
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
  //     const total_count = await this.VideoChatRepository.count({
  //       where,
  //     });
  //     const total_pages = Math.ceil(total_count / limit);
  //     const res = {
  //       status: HttpStatus.OK,
  //       data: {
  //         records: chats,
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
      const chatId = await this.VideoChatRepository.findAll({
        attributes: ['id'],
      });
      return chatId;
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findById(id: string) {
    try {
      const chats = await this.VideoChatRepository.findOne({
        where: { id },
      });
      if (!chats) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      return { status: HttpStatus.OK, data: chats };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async update(id: string, videoChatDto: VideoChatDto) {
    try {
      const chat = await this.findById(id);
      if (chat.status === 400) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      const updated_info = await this.VideoChatRepository.update(videoChatDto, {
        where: { id: chat.data.id },
        returning: true,
      });
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
      const chat = await this.findById(id);
      if (chat.status === 400) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      await chat.data.destroy();
      return { status: HttpStatus.OK, data: 'deleted' };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }
}
