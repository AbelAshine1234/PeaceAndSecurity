import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
    UseGuards,
    Query,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { MediaService } from "./media.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { successResponse } from "../../common/types/service-response";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";

@ApiTags("Media")
@Controller("media")
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post("upload")
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Upload a single media file (Photo, Video, or Audio)" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
    async uploadSingle(@UploadedFile() file: any, @Query("folder") folder?: string) {
        if (!file) throw new BadRequestException("No file uploaded");
        const asset = await this.mediaService.uploadFile(file, folder || "evidence");
        return successResponse("File uploaded successfully", asset);
    }

    @Post("upload-multiple")
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Upload multiple media files" })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FilesInterceptor("files", 10, { storage: memoryStorage() }))
    async uploadMultiple(@UploadedFiles() files: any[], @Query("folder") folder?: string) {
        if (!files || files.length === 0) throw new BadRequestException("No files uploaded");
        const assets = await this.mediaService.uploadMultiple(files, folder || "evidence");
        return successResponse("Files uploaded successfully", assets);
    }
}
