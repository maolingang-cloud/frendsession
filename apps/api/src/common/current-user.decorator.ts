import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@frendseesion/shared";

export const CurrentUser = createParamDecorator((_: undefined, context: ExecutionContext): User => {
  const request = context.switchToHttp().getRequest<{ user: User }>();
  return request.user;
});
