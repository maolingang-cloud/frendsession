import { IsString } from "class-validator";

export class ConfirmMockPaymentDto {
  @IsString({ message: "会话 ID 必须是字符串。" })
  sessionId!: string;

  @IsString({ message: "报价 ID 必须是字符串。" })
  quoteId!: string;
}
