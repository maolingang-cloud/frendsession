import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { User } from "@frendseesion/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { MockAuthGuard } from "../common/mock-auth.guard";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CreatePaymentQuoteDto } from "./dto/create-payment-quote.dto";
import { CreateSessionDto } from "./dto/create-session.dto";
import { JoinSessionDto } from "./dto/join-session.dto";
import { SessionsService } from "./sessions.service";

@Controller("sessions")
export class SessionsController {
  constructor(@Inject(SessionsService) private readonly sessionsService: SessionsService) {}

  @UseGuards(MockAuthGuard)
  @Post()
  createSession(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
    return this.sessionsService.createSession(user, dto);
  }

  @Get("join/:token")
  getJoinPreview(@Param("token") token: string) {
    return this.sessionsService.getJoinPreview(token);
  }

  @Get(":id")
  getSession(@Param("id") sessionId: string) {
    return this.sessionsService.getSessionSummary(sessionId);
  }

  @Post(":id/join")
  joinSession(@Param("id") sessionId: string, @Body() dto: JoinSessionDto) {
    return this.sessionsService.joinSession(sessionId, dto);
  }

  @UseGuards(MockAuthGuard)
  @Post(":id/payment-quotes")
  createPaymentQuote(
    @CurrentUser() user: User,
    @Param("id") sessionId: string,
    @Body() dto: CreatePaymentQuoteDto
  ) {
    return this.sessionsService.createPaymentQuote(user, sessionId, dto);
  }

  @Post(":id/messages")
  createMessage(@Param("id") sessionId: string, @Body() dto: CreateMessageDto) {
    return this.sessionsService.createMessage(sessionId, dto);
  }
}
