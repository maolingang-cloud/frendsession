# 阿里云测试环境部署

这套测试环境面向 GitHub 联动部署，目标是：

- 推送 `develop` 分支后自动更新阿里云测试机
- Web、API、Realtime、MinIO、coturn 用 Docker Compose 一次拉起
- 用 Caddy 自动申请 HTTPS 证书

## 1. 服务器准备

推荐环境：

- 阿里云 ECS
- Ubuntu 22.04 LTS
- 2 vCPU / 4 GB RAM 起步
- 一块公网 IP
- 一个测试子域名，例如 `staging.example.com`
- 一个 TURN 子域名，例如 `turn.staging.example.com`

安全组至少放行：

- `80/tcp`
- `443/tcp`
- `443/udp`
- `3478/tcp`
- `3478/udp`
- `49160-49200/udp`

## 2. 服务器安装软件

至少安装：

- Docker Engine
- Docker Compose 插件
- `rsync`

如果是 Ubuntu，可参考：

```bash
sudo apt update
sudo apt install -y rsync ca-certificates curl gnupg
```

Docker 安装建议按官方文档执行：

- https://docs.docker.com/engine/install/ubuntu/

## 3. 首次准备目录

在服务器上创建目录：

```bash
sudo mkdir -p /opt/frendseesion-staging
sudo chown -R $USER:$USER /opt/frendseesion-staging
```

GitHub Actions 首次同步后，复制环境文件：

```bash
cd /opt/frendseesion-staging
cp deploy/.env.staging.example deploy/.env.staging
```

然后填写：

- `APP_DOMAIN`
- `TURN_DOMAIN`
- `POSTGRES_PASSWORD`
- `MINIO_SECRET_KEY`
- `NEXT_PUBLIC_TURN_CREDENTIAL`
- `TURN_PASSWORD`
- `TURN_EXTERNAL_IP`

`TURN_EXTERNAL_IP` 在阿里云通常填 ECS 公网 IP。

如果服务器绑定了 EIP，就填 EIP；如果是直接公网实例，就填实例公网 IP。

## 4. GitHub Secrets

在 GitHub 仓库中配置这些 Secrets：

- `STAGING_SSH_HOST`
- `STAGING_SSH_PORT`
- `STAGING_SSH_USER`
- `STAGING_SSH_KEY`
- `STAGING_APP_DIR`

推荐：

- `STAGING_SSH_PORT=22`
- `STAGING_APP_DIR=/opt/frendseesion-staging`

## 5. 部署触发

默认规则：

- 推送到 `develop` 时自动部署
- 也可以在 GitHub Actions 页面手动点 `Deploy Staging`

## 6. 当前已知限制

这套测试环境已经能做公网联调，但还不是正式生产环境，主要限制有：

- API 会话和消息仍然是内存存储，服务重启会丢数据
- MinIO 目前是“公开桶 + mock signed URL”，正式生产要改成真实鉴权签名
- coturn 账号密码仍是静态配置，正式环境建议改成动态临时凭证

## 7. 建议的下一步

测试环境稳定后，优先做这三件事：

1. 把 `StoreService` 从内存切到 Postgres/Redis
2. 把上传签名从 mock 改成真实 S3/OSS 签名
3. 把短信登录、支付回调、TURN 凭证改成真实服务
