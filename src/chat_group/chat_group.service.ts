import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatGroup } from './models/chat_group.models';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { ChatGroupDto } from './dto/chat_group.dto';
import { Course } from 'src/course/models/course.models';
import { Chat } from 'src/chat/models/chat.model';

@Injectable()
export class ChatGroupService {
  constructor(
    @InjectModel(ChatGroup) private chatGroupRepository: typeof ChatGroup,
    private readonly jwtService: JwtService,
  ) { }

  async create(chatGroupDto: ChatGroupDto): Promise<object> {
    try {
      const { course_id, group_id, chat_type } = chatGroupDto;
      const exist = await this.chatGroupRepository.findOne({
        where: { course_id, chat_type, group_id },
      });
      if (exist) {
        throw new BadRequestException('Already created');
      }
      const data = await this.chatGroupRepository.create(chatGroupDto);

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAll(): Promise<object> {
    try {
      const chatGroup = await this.chatGroupRepository.findAll({
        // order: [['class_number', 'ASC'], ['name', 'ASC']],
      });
      return {
        statusCode: HttpStatus.OK,
        data: chatGroup,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getByGroupId(group_id: number): Promise<object> {
    try {
      const chatGroup = await this.chatGroupRepository.findOne({
        where: { group_id },
      });
      if (!chatGroup) {
        throw new NotFoundException('Group chat not found');
      }
      return chatGroup;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getMessages(id: number): Promise<object> {
    try {
      const chatGroup = await this.chatGroupRepository.findOne({
        where: { id },
        include: [{ model: Chat }, { model: Course }]
      });
      if (!chatGroup) {
        throw new NotFoundException('Group chat not found');
      }
      return chatGroup;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(group_id: number): Promise<object> {
    try {
      const chatGroup = await this.chatGroupRepository.findAll({
        where: { group_id },
        include: [
          { model: Course }, {
            model: Chat,
            limit: 1,
            required: false,
            order: [['createdAt', 'DESC']],
          },
        ],
      });
      if (!chatGroup) {
        throw new NotFoundException('Chat group not found');
      }
      return chatGroup;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const chatGroup = await this.chatGroupRepository.findAll({ offset, limit });
      const total_count = await this.chatGroupRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: chatGroup,
          pagination: {
            currentPage: page,
            total_pages,
            total_count,
          },
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: number, chatGroupDto: ChatGroupDto): Promise<object> {
    try {
      const chatGroup = await this.chatGroupRepository.findByPk(id);
      if (!chatGroup) {
        throw new NotFoundException('Class not found');
      }
      const update = await this.chatGroupRepository.update(chatGroupDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: {
          class: update[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const chatGroup = await this.chatGroupRepository.findByPk(id);
      if (!chatGroup) {
        throw new NotFoundException('Class not found');
      }
      chatGroup.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
