import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from './models/news.model';
import { NewsDto } from './dto/news.dto';
import { FilesService } from '../files/files.service';
import { User } from '../user/models/user.models';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News) private readonly newsRepository: typeof News,
    private readonly filesService: FilesService,
  ) { }

  async create(newsDto: NewsDto) {
    try {
      const news = await this.newsRepository.create({ ...newsDto });
      return { status: HttpStatus.OK, data: news };
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findAll(page: number) {
    try {
      const news = await this.newsRepository.findAll({
        order: [['createdAt', 'DESC']],
      });
      const res = {
        status: HttpStatus.OK,
        data: news,
      };
      return res;
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async getGroupNews(newsgroup_id: number, page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    try {
      const news = await this.newsRepository.findAll({
        order: [['updatedAt', 'DESC']],
        include: [
          {
            model: User,
          },
        ],
        offset,
        limit,
      });
      const total_count = await this.newsRepository.count();
      const total_pages = Math.ceil(total_count / limit);
      const res = {
        status: HttpStatus.OK,
        data: {
          records: news.reverse(),
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
      const newsId = await this.newsRepository.findAll({
        attributes: ['id'],
      });
      return newsId;
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findById(id: string) {
    try {
      const news = await this.newsRepository.findOne({
        where: { id },
      });
      if (!news) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      return { status: HttpStatus.OK, data: news };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async delete(id: number) {
    try {
      const news = await this.newsRepository.findByPk(id);
      if (news) {
        return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
      }
      await this.filesService.deleteFile(news.source);
      await news.destroy();
      return { status: HttpStatus.OK, data: 'deleted' };
    } catch (error) {
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }
}
