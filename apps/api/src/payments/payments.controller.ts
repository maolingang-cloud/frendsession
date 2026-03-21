import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ConfirmMockPaymentDto } from "./dto/confirm-mock-payment.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments/mock")
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Post("confirm")
  confirmMockPayment(@Body() dto: ConfirmMockPaymentDto) {
    return this.paymentsService.confirmMockPayment(dto.sessionId, dto.quoteId);
  }
}
