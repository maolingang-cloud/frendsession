import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { LoginResponse } from "@frendseesion/shared";
import { StoreService } from "../store/store.service";

@Injectable()
export class AuthService {
  constructor(@Inject(StoreService) private readonly storeService: StoreService) {}

  requestCode(phone: string) {
    const mockCode = this.storeService.issueAuthCode(phone);
    return {
      ok: true,
      phone,
      mockCode,
      expiresInSeconds: 300
    };
  }

  login(phone: string, code: string): LoginResponse {
    if (!this.storeService.verifyAuthCode(phone, code)) {
      throw new UnauthorizedException("模拟验证码无效。");
    }

    const user = this.storeService.upsertUser(phone);
    return {
      token: `mock.${user.id}`,
      user,
      mockCode: code
    };
  }
}
