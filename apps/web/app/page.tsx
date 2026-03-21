"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiHealth, login, requestCode } from "../lib/api";
import { readAuth, writeAuth } from "../lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("13800138000");
  const [code, setCode] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serviceReady, setServiceReady] = useState(false);

  useEffect(() => {
    const auth = readAuth();
    if (auth) {
      router.replace("/create");
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    void getApiHealth()
      .then(() => {
        if (!cancelled) {
          setServiceReady(true);
          setStatus(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setServiceReady(false);
          setStatus(error instanceof Error ? error.message : "本地服务连接失败。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page-shell flex items-center justify-center">
      <section className="glass-card w-full max-w-md rounded-[32px] p-6">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Frendseesion</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">发起方登录</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          当前版本使用手机号验证码模拟登录。登录后即可生成二维码邀请链接，等待接收端扫码进入聊天。
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">手机号</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">验证码</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none"
            />
          </label>
        </div>

        {mockCode ? (
          <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-50">
            模拟验证码：<span className="font-semibold">{mockCode}</span>
          </div>
        ) : null}
        {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy || !serviceReady}
            onClick={async () => {
              setBusy(true);
              setStatus("正在获取模拟验证码...");
              try {
                const response = await requestCode(phone);
                setMockCode(response.mockCode);
                setCode(response.mockCode);
                setStatus("模拟验证码已生成，并已自动填入。");
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "获取验证码失败。");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            获取验证码
          </button>

          <button
            type="button"
            disabled={busy || !code || !serviceReady}
            onClick={async () => {
              setBusy(true);
              setStatus("正在登录...");
              try {
                const response = await login({ phone, code });
                writeAuth({ token: response.token, user: response.user });
                router.push("/create");
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "登录失败。");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-2xl bg-[#8dde61] px-4 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            登录
          </button>
        </div>
      </section>
    </main>
  );
}
