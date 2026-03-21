import { IsString, Matches } from "class-validator";

export class RequestCodeDto {
  @IsString({ message: "手机号必须是字符串。" })
  @Matches(/^1\d{10}$/, { message: "请输入有效的 11 位手机号。" })
  phone!: string;
}
