import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Uploaded } from './models/uploaded.models';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { UploadedDto } from './dto/uploaded.dto';
import { Op } from 'sequelize';
import { FilesService } from '../files/files.service';
import { UpdateDto } from './dto/update';
import axios from 'axios';

@Injectable()
export class UploadedService {
  constructor(
    @InjectModel(Uploaded) private uploadedRepository: typeof Uploaded,
    private readonly jwtService: JwtService,
    private readonly fileService: FilesService,
  ) { }

  async getVideoDuration(youtube: string) {
    const apiKey = process.env.Youtube_key;
    const youtube_id = this.extractYoutubeId(youtube);
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?id=${youtube_id}&part=contentDetails&key=${apiKey}`,
      );
      let duration = response.data.items[0].contentDetails.duration;
      return this.parseDuration(duration);
    } catch (error) {
      console.error('Error fetching video details:', error);
    }
  }

  extractYoutubeId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] || matches[2] : null;
  }

  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    const seconds = parseInt(match[3], 10) || 0;
    // return `${hours}h ${minutes}m ${seconds}s`;
    return hours * 3600 + minutes * 60 + seconds;
  }

  // async create(file: any, file_type: string) {
  //   try {
  //     let file_data: any;
  //     let data: any;
  //     if (file_type != 'youtube') {
  //       file_data = await this.fileService.createFile(
  //         file,
  //         file_type,
  //       );
  //       data = await this.uploadedRepository.create({
  //         duration: Math.floor(file_data.duration) || null,
  //         file_type,
  //         url: file_data.url,
  //       });
  //     } else {
  //       data = await this.uploadedRepository.create({
  //         duration: Math.floor(file_data.duration) || null,
  //         file_type,
  //         url: file_data.url,
  //       });
  //     }
  //     return file_data.url;
  //   } catch (error) {
  //     console.log(error.message);
  //     return { statusCode: HttpStatus.BAD_REQUEST, error: error.message };
  //   }
  // }


  async create(file: any, file_type: string) {
    try {
      let file_data: any;
      if (file_type != 'youtube') {
        file_data = await this.fileService.createFile(
          file,
          file_type,
        );
      }
      console.log(file_data);
      let data = await this.uploadedRepository.create({
        duration: Math.floor(file_data.duration) || null,
        file_type,
        url: file_data.secure_url,
      });
      console.log(data);
      return file_data.secure_url;
    } catch (error) {
      console.log(error.message);
      return { statusCode: HttpStatus.BAD_REQUEST, error: error.message };
    }
  }

  async upload(uploadedDto: UploadedDto, file: any) {
    // try {
    //   const file_data: any = await this.fileService.createFile(
    //     file,
    //     uploadedDto.file_type,
    //   );
    //   const data = await this.uploadedRepository.create({
    //     public_id: '1',
    //     duration: file_data.duration,
    //     url: file_data.url,
    //     file_type: uploadedDto.file_type,
    //   });
    //   return {
    //     statusCode: HttpStatus.OK,
    //     message: 'Created successfully',
    //     data,
    //   };
    // } catch (error) {
    //   return { statusCode: HttpStatus.BAD_REQUEST, error: error.message };
    // }
  }

  async getAll(): Promise<object> {
    try {
      const uploaded = await this.uploadedRepository.findAll();
      return {
        statusCode: HttpStatus.OK,
        data: uploaded,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getById(public_id: number) {
    // try {
    //   const uploaded = await this.uploadedRepository.findOne({
    //     where: { public_id },
    //   });
    //   if (!uploaded) {
    //     throw new NotFoundException('Uploaded not found');
    //   }
    //   return {
    //     statusCode: HttpStatus.OK,
    //     data: uploaded,
    //   };
    // } catch (error) {
    //   throw new BadRequestException(error.message);
    // }
  }

  async pagination(page: number): Promise<object> {
    try {
      const offset = (page - 1) * 10;
      const limit = 10;
      const classs = await this.uploadedRepository.findAll({ offset, limit });
      const total_count = await this.uploadedRepository.count();
      const total_pages = Math.ceil(total_count / 10);
      const response = {
        statusCode: HttpStatus.OK,
        data: {
          records: classs,
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

  async update(id: number, updateDto: UpdateDto): Promise<object> {
    try {
      const uploaded = await this.uploadedRepository.findByPk(id);
      if (!uploaded) {
        throw new NotFoundException('Uploaded not found');
      }
      const update = await this.uploadedRepository.update(updateDto, {
        where: { id },
        returning: true,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async delete(id: number): Promise<object> {
    try {
      const uploaded = await this.uploadedRepository.findByPk(id);
      if (!uploaded) {
        throw new NotFoundException('Uploaded not found');
      }
      uploaded.destroy();
      return {
        statusCode: HttpStatus.OK,
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
