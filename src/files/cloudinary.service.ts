import { Injectable } from '@nestjs/common';
import { parse } from 'url';
import cloudinary from '../../cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadFile(filePath: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
      });
      return result;
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async deleteFileByUrl(fileUrl: string): Promise<any> {
    try {
      const publicId = this.extractPublicId(fileUrl);
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  private extractPublicId(url: string): string {
    const { pathname } = parse(url);
    // Extract the public ID part of the URL
    const parts = pathname?.split('/');
    const publicId = parts ? parts[parts.length - 1].split('.')[0] : '';
    return publicId;
  }
}
