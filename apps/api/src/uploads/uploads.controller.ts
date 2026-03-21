import { Body, Controller, Inject, Post } from "@nestjs/common";
import { IsString } from "class-validator";
import { UploadsService } from "./uploads.service";

class SignUploadDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;
}

@Controller("uploads")
export class UploadsController {
  constructor(@Inject(UploadsService) private readonly uploadsService: UploadsService) {}

  @Post("sign")
  signUpload(@Body() dto: SignUploadDto) {
    return this.uploadsService.signUpload(dto.fileName, dto.mimeType);
  }
}
