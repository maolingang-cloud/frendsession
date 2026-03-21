import { IsString, Length, Matches } from "class-validator";

export class LoginDto {
  @IsString({ message: "手机号必须是字符串。" })
  @Matches(/^1\d{10}$/, { message: "请输入有效的 11 位手机号。" })
  phone!: string;

  @IsString({ message: "验证码必须是字符串。" })
  @Length(4, 6, { message: "验证码长度必须为 4 到 6 位。" })
  code!: string;
}
