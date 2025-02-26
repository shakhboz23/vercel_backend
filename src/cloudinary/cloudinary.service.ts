import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: 'dqq3cnpxv',
    api_key: '381131244113522',
    api_secret: 'pawVl12tBDUpJEkVyScyqCzG8r4',
});

@Injectable()
export class CloudinaryService {
  async uploadPrivateVideo(filePath: string) {
    return await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      type: 'authenticated',
    });
  }

  generateVideoSignature(publicId: string) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp },
      cloudinary.config().api_secret
    );

    return { signature, timestamp };
  }
}
