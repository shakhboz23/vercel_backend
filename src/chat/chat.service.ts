import { Get, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat } from './models/chat.model';
import { ChatDto } from './dto/chat.dto';
import { FilesService } from '../files/files.service';
import cloudinary from '../../cloudinary.config';
import { User } from '../user/models/user.models';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat) private readonly ChatRepository: typeof Chat,
    private readonly fileService: FilesService,
  ) {}

  async create(chatDto: ChatDto, file: any, user_id: number) {
    try {
      let result: any;
      let filePath: string;
      if (file) {
        file = await this.fileService.createFile(file, 'image');
        if (file != 'error') {
          chatDto.file = file;
        } else {
          return {
            status: HttpStatus.BAD_REQUEST,
            error: 'Error while uploading a file',
          };
        }
      }
      const chat = await this.ChatRepository.create({ ...chatDto, user_id });
      return chat;
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findAll(page: number, chatgroup_id?: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    try {
      const chats = await this.ChatRepository.findAll({
        where: { chatgroup_id },
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
          },
        ],
        offset,
        limit,
      });
      const total_count = await this.ChatRepository.count();
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
      const chats = await this.ChatRepository.findAll({
        where: {
          chatgroup_id,
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
      const total_count = await this.ChatRepository.count();
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
      const chatId = await this.ChatRepository.findAll({
        attributes: ['id'],
      });
      return chatId;
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findById(id: string) {
    try {
      const chats = await this.ChatRepository.findOne({
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

  async update(id: string, chatDto: ChatDto) {
    try {
      const chat = await this.findById(id);
      if (chat.status === 400) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      const updated_info = await this.ChatRepository.update(chatDto, {
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
