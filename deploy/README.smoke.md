# 阿里云 IP 冒烟测试部署

这套方案用于：

- 域名还没申请完成时
- 先用 ECS 公网 IP 把文字聊天、支付、图片/视频消息等主链路跑通
- 提前验证 GitHub 联动部署、容器编排、MinIO、TURN 端口与服务健康

## 1. 适合做的测试

在 IP 冒烟阶段，建议重点验证：

- 首页登录与模拟验证码
- 创建会话 / 生成二维码 / 扫码加入
- 3 分钟免费文字聊天
- 发起端配置功能与时长
- 接收端模拟支付
- 图片消息 / 视频消息启用与停用
- 功能状态条是否随支付与倒计时变化
- GitHub Actions 到阿里云的自动部署链路

## 2. 先不要当最终验收的部分

由于还没有 HTTPS 与正式域名，以下内容只适合“代码层冒烟”，不适合作最终通过标准：

- 手机浏览器里的摄像头/麦克风权限
- 真正稳定的 WebRTC 音视频通话
- PWA 安装体验
- Caddy 自动 HTTPS 证书

## 3. 服务器准备

推荐目录：

```bash
mkdir -p /opt/frendseesion-staging
```

推荐环境：

- 阿里云 ECS
- Ubuntu 22.04
- Docker Engine
- Docker Compose 插件
- rsync

安全组至少放行：

- `22/tcp`
- `3000/tcp`
- `3301/tcp`
- `3302/tcp`
- `3478/tcp`
- `3478/udp`
- `9000/tcp`
- `9001/tcp`
- `49160-49200/udp`

## 4. 首次生成 smoke 环境文件

同步代码后，在服务器执行：

```bash
cd /opt/frendseesion-staging
cp deploy/.env.smoke.example deploy/.env.smoke
```

然后重点修改：

- `SERVER_IP`
- `POSTGRES_PASSWORD`
- `MINIO_SECRET_KEY`
- `NEXT_PUBLIC_TURN_CREDENTIAL`
- `TURN_PASSWORD`

`SERVER_IP` 现在就填：

```text
218.244.142.6
```

## 5. 手动启动

```bash
APP_DIR=/opt/frendseesion-staging bash deploy/scripts/remote-up-smoke.sh
```

启动后常用入口：

- Web: `http://218.244.142.6:3000`
- API 健康检查: `http://218.244.142.6:3301/health`
- Realtime 健康检查: `http://218.244.142.6:3302/health`
- MinIO Console: `http://218.244.142.6:9001`

## 6. GitHub Actions

仓库里已经补了一个手动触发的 workflow：

- `.github/workflows/deploy-smoke.yml`

它会：

- 校验 web/api/realtime 构建
- 通过 SSH + rsync 同步到阿里云
- 调用 `remote-up-smoke.sh` 更新 smoke 环境

## 7. 从 smoke 切到 staging

等 `APP_DOMAIN` 和 `TURN_DOMAIN` 下来后：

1. 改用 `deploy/.env.staging`
2. 切到 `deploy/compose.staging.yml`
3. 让 GitHub 推 `develop` 自动部署 `staging`
4. 把前端地址改为 HTTPS 域名

这样可以平滑从 IP 冒烟切到正式测试域名环境。
