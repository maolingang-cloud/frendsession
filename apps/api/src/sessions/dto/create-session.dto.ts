import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSessionDto {
  @IsOptional()
  @IsString({ message: "发起方显示名称必须是字符串。" })
  @MaxLength(32, { message: "发起方显示名称不能超过 32 个字符。" })
  initiatorDisplayName?: string;
}
