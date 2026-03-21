import { MessageType, ParticipantRole } from "@frendseesion/shared";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const ALLOWED_TYPES: MessageType[] = ["text", "image", "video"];
const ALLOWED_ROLES: ParticipantRole[] = ["initiator", "guest"];

export class CreateMessageDto {
  @IsString({ message: "发送者 ID 必须是字符串。" })
  senderId!: string;

  @IsString({ message: "发送者角色必须是字符串。" })
  @IsIn(ALLOWED_ROLES, { message: "发送者角色必须是发起方或接收端。" })
  senderRole!: ParticipantRole;

  @IsString({ message: "消息类型必须是字符串。" })
  @IsIn(ALLOWED_TYPES, { message: "消息类型必须是文字、图片或视频。" })
  type!: MessageType;

  @IsOptional()
  @IsString({ message: "文字内容必须是字符串。" })
  @MaxLength(500, { message: "文字消息不能超过 500 个字符。" })
  text?: string;

  @IsOptional()
  @IsString({ message: "媒体地址必须是字符串。" })
  mediaUrl?: string;

  @IsOptional()
  @IsString({ message: "预览地址必须是字符串。" })
  previewUrl?: string;
}
