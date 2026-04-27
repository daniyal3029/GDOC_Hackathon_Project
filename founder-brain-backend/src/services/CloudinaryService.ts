import { v2 as cloudinary } from 'cloudinary';
import { ILogger } from '../interfaces/ILogger';

export class CloudinaryService {
  constructor(private logger: ILogger) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbaxkc39t',
      api_key: process.env.CLOUDINARY_API_KEY || '727284185218555',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'DB5uypNvdwVExUAP4XEbbtSWMnY',
    });
  }

  async uploadImage(fileBuffer: Buffer, folder: string = 'founder-brain'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', { error });
            return reject(new Error('Image upload failed'));
          }
          resolve(result!.secure_url);
        }
      );

      uploadStream.end(fileBuffer);
    });
  }
}
