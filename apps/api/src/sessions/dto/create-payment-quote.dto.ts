import { SESSION_CAPABILITIES, SUPPORTED_PAID_DURATIONS, SessionCapability } from "@frendseesion/shared";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsString, MaxLength } from "class-validator";

export class CreatePaymentQuoteDto {
  @IsString({ message: "支付标题必须是字符串。" })
  @MaxLength(64, { message: "支付标题不能超过 64 个字符。" })
  title = "媒体权限解锁";

  @IsArray({ message: "能力列表必须是数组。" })
  @ArrayMinSize(1, { message: "至少需要选择一种媒体能力。" })
  @ArrayMaxSize(4, { message: "最多只能选择四种媒体能力。" })
  @IsIn(SESSION_CAPABILITIES.filter((value) => value !== "text"), {
    each: true,
    message: "能力选项必须是图片消息、视频消息、音频通话或视频通话。"
  })
  capabilities!: SessionCapability[];

  @IsInt({ message: "时长必须是整数分钟。" })
  @IsIn([...SUPPORTED_PAID_DURATIONS], {
    message: `时长仅支持 ${SUPPORTED_PAID_DURATIONS.join("、")} 分钟。`
  })
  durationMinutes!: number;
}
