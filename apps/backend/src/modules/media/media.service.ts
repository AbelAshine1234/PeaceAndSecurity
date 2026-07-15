import { Injectable, BadRequestException } from "@nestjs/common";
import { processUploads, MulterFile } from "../../common/utils/file-upload.util";

@Injectable()
export class MediaService {
    async uploadFile(file: MulterFile, folder = "evidence") {
        if (!file) throw new BadRequestException("No file provided");

        const mime = file.mimetype.toLowerCase();
        const size = file.size; // in bytes

        // Validation based on type
        if (mime.startsWith("image/")) {
            // Photo: JPEG/PNG (processUploads handles more, but we can restrict if needed)
            // Max 10MB
            if (size > 10 * 1024 * 1024) throw new BadRequestException("Image exceeds 10MB limit");
            if (!mime.includes("jpeg") && !mime.includes("png") && !mime.includes("jpg")) {
                throw new BadRequestException("Only JPEG and PNG images are allowed");
            }
        } else if (mime.startsWith("video/")) {
            // Video: MP4
            // Max 50MB
            if (size > 50 * 1024 * 1024) throw new BadRequestException("Video exceeds 50MB limit");
            if (!mime.includes("mp4")) throw new BadRequestException("Only MP4 videos are allowed");
        } else if (mime.startsWith("audio/")) {
            // Audio: MP3
            // Max 5MB
            if (size > 5 * 1024 * 1024) throw new BadRequestException("Audio exceeds 5MB limit");
            if (!mime.includes("mpeg") && !mime.includes("mp3")) throw new BadRequestException("Only MP3 audio is allowed");
        } else {
            throw new BadRequestException("Unsupported file type");
        }

        const [asset] = await processUploads(file, {
            baseDir: "uploads",
            publicBase: "/",
            makeThumb: mime.startsWith("image/"),
            quality: 85,
        }, folder);

        return asset;
    }

    async uploadMultiple(files: MulterFile[], folder = "evidence") {
        const results = [];
        for (const file of files) {
            results.push(await this.uploadFile(file, folder));
        }
        return results;
    }
}
