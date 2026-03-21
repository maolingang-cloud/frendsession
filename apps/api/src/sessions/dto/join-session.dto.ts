import { IsString, MaxLength } from "class-validator";

export class JoinSessionDto {
  @IsString({ message: "接收端显示名称必须是字符串。" })
  @MaxLength(32, { message: "接收端显示名称不能超过 32 个字符。" })
  displayName!: string;
}
