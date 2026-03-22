#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/frendseesion-staging}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env.staging}"
COMPOSE_FILE="$APP_DIR/deploy/compose.staging.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker 未安装，请先在服务器上安装 Docker Engine 与 compose 插件。"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/deploy/.env.staging.example" "$ENV_FILE"
  echo "已生成 $ENV_FILE，请先填入域名与密钥后重新执行部署。"
  exit 1
fi

cd "$APP_DIR"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build --remove-orphans
docker image prune -f >/dev/null 2>&1 || true
