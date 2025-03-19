import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { News } from './models/news.model';
import { NewsDto } from './dto/news.dto';
import { FilesService } from '../files/files.service';
import { User } from '../user/models/user.models';
// import * as DeviceDetector from 'device-detector-js';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News) private readonly newsRepository: typeof News,
    private readonly filesService: FilesService,
  ) { }
  // private readonly deviceDetector = new DeviceDetector();

  async create(newsDto: NewsDto) {
    try {
      const news = await this.newsRepository.create({ ...newsDto });
      return { status: HttpStatus.OK, data: news };
    } catch (error) {
      return { status: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async findAll(page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    console.log(offset);
    try {
      const news = await this.newsRepository.findAll({
        order: [['createdAt', 'DESC']],
        // offset,
        // limit,
      });
      // const total_count = await this.newsRepository.count();
      // const total_pages = Math.ceil(total_count / limit);
      const res = {
        status: HttpStatus.OK,
        data: news,
        // data: {
        //   records: news.reverse(),
        //   pagination: {
        //     currentPage: page,
        //     // total_pages,
        //     // total_count,
        //   },
        // },
      };
      return res;
    } catch (error) {
      console.log(error);
      return { status: HttpStatus.NOT_FOUND, error: error.message };
    }
  }

  async getGroupNews(newsgroup_id: number, page: number) {
    const limit = 10;
    const offset = (page - 1) * limit;
    console.log(offset);
    try {
      const news = await this.newsRepository.findAll({
        where: {
          // newsgroup_id,
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
  //       `CAST("News"."id" AS TEXT) ILIKE '%${search}%'`,
  //     );
  //   } else {
  //     where[`${searchType}`] = { [Op.iLike]: `%${search}%` };
  //   }
  //   const limit = 10;
  //   const offset = (page - 1) * limit;
  //   console.log(where);
  //   try {
  //     const news = await this.newsRepository.findAll({
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
  //     const total_count = await this.newsRepository.count({
  //       where,
  //     });
  //     const total_pages = Math.ceil(total_count / limit);
  //     const res = {
  //       status: HttpStatus.OK,
  //       data: {
  //         records: news,
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

  // async update(id: string, newsDto: NewsDto) {
  //   try {
  //     const news = await this.findById(id);
  //     if (news.status === 400) {
  //       return { status: HttpStatus.NOT_FOUND, error: 'Not found' };
  //     }
  //     const updated_info = await this.newsRepository.update(newsDto, {
  //       where: { id: news.data.id },
  //       returning: true,
  //     });
  //     return {
  //       status: HttpStatus.OK,
  //       data: updated_info[1][0],
  //     };
  //   } catch (error) {
  //     return { status: HttpStatus.NOT_FOUND, error: error.message };
  //   }
  // }

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
