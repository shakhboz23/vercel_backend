import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VideoChat } from './models/video_chat.model';
import { FilesService } from '../files/files.service';
import { User } from '../user/models/user.models';
import { VideoChatDto } from './dto/video_chat.dto';

@Injectable()
export class VideoChatService {
  constructor(
    @InjectModel(VideoChat)
    private readonly VideoChatRepository: typeof VideoChat,
    private readonly fileService: FilesService,
  ) {}

  async create(videoChatDto: VideoChatDto, headers: { 'user-agent': string }) {
    try {
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
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async getGroupChats(chatgroup_id: number, page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    try {
      const chats = await this.VideoChatRepository.findAll({
        where: {},
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
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

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
