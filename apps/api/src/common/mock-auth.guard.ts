import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "@frendseesion/shared";
import { StoreService } from "../store/store.service";

@Injectable()
export class MockAuthGuard implements CanActivate {
  constructor(@Inject(StoreService) private readonly storeService: StoreService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: User;
    }>();

    const authorization = request.headers.authorization ?? request.headers.Authorization;
    if (!authorization?.startsWith("Bearer mock.")) {
      throw new UnauthorizedException("缺少有效的模拟登录凭证。");
    }

    const userId = authorization.replace("Bearer mock.", "").trim();
    const user = this.storeService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException("未找到当前模拟登录用户。");
    }

    request.user = user;
    return true;
  }
}
