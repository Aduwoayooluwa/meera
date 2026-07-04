"use client";

import { useMutation } from "@tanstack/react-query";
import { App, Button, Form, Input, Typography } from "antd";
import { isAxiosError } from "axios";
import { ArrowRight, LockKeyhole, Mail, Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api-client";
import { MeeraLogo } from "@/components/meera-logo";
import { useThemeMode } from "@/components/providers";

const { Text } = Typography;

type AuthMode = "login" | "signup";

type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

export function AuthCard({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { message } = App.useApp();
  const { mode: themeMode, toggleMode } = useThemeMode();
  const isSignup = mode === "signup";

  const authMutation = useMutation({
    mutationFn: async (values: AuthFormValues) => {
      if (isSignup) {
        const response = await apiClient.post("/api/auth/signup", {
          name: values.name ?? "",
          email: values.email,
          password: values.password,
        });

        return response.data;
      }

      const response = await apiClient.post("/api/auth/login", {
        email: values.email,
        password: values.password,
      });

      return response.data;
    },
    onSuccess: () => {
      message.success(isSignup ? "Account created." : "Welcome back.");
      router.replace("/");
      router.refresh();
    },
    onError: (error) => {
      const responseMessage = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : null;

      message.error(
        responseMessage || (error instanceof Error ? error.message : "Auth failed."),
      );
    },
  });

  return (
    <main
      className="app-bg flex min-h-dvh items-center justify-center px-4 py-8 text-[var(--foreground)]"
    >
      <section
        className="mm-panel grid w-full max-w-5xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div
          className="flex min-h-[360px] flex-col justify-between p-6 sm:p-8"
          style={{
            background:
              "linear-gradient(145deg, var(--primary) 0%, #0b4d56 62%, #172033 100%)",
            color: "#ffffff",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MeeraLogo className="mm-auth-logo-mark" size={42} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  Meera
                </div>
                <div style={{ opacity: 0.76, fontSize: "0.8rem" }}>
                  patterns hiding in your own words
                </div>
              </div>
            </div>
            <button
              aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              className="mm-theme-btn"
              onClick={toggleMode}
              style={{
                background: "rgba(255,255,255,0.12)",
                borderColor: "rgba(255,255,255,0.22)",
                color: "#ffffff",
              }}
              type="button"
            >
              {themeMode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          <div>
            <div
              style={{
                fontSize: "clamp(2rem, 6vw, 4.6rem)",
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                maxWidth: "9ch",
              }}
            >
              Your words stay yours.
            </div>
            <p
              style={{
                margin: "20px 0 0",
                maxWidth: "360px",
                color: "rgba(255,255,255,0.78)",
                fontSize: "0.95rem",
                lineHeight: 1.65,
              }}
            >
              Sign in to keep memories, uploads, and mirror conversations tied
              to one private workspace.
            </p>
          </div>

          <div
            className="grid gap-2 sm:grid-cols-3"
            style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.78rem" }}
          >
            <span>Saved memories</span>
            <span>Chat history</span>
            <span>Private workspace</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <div className="mm-kicker mb-2">
              {isSignup ? "Create account" : "Welcome back"}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.9rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
                lineHeight: 1.15,
              }}
            >
              {isSignup ? "Start your mirror." : "Open your mirror."}
            </h1>
            <Text type="secondary" style={{ fontSize: "0.92rem" }}>
              {isSignup
                ? "Create a workspace for your memories and reflections."
                : "Continue where your last reflection stopped."}
            </Text>
          </div>

          <Form
            layout="vertical"
            onFinish={(values) => authMutation.mutate(values as AuthFormValues)}
            requiredMark={false}
          >
            {isSignup ? (
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, min: 2, max: 80 }]}
              >
                <Input
                  autoComplete="name"
                  prefix={<User size={16} />}
                  placeholder="Ayooluwa"
                />
              </Form.Item>
            ) : null}

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input
                autoComplete="email"
                inputMode="email"
                prefix={<Mail size={16} />}
                placeholder="you@example.com"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, min: 8 }]}
            >
              <Input.Password
                autoComplete={isSignup ? "new-password" : "current-password"}
                prefix={<LockKeyhole size={16} />}
                placeholder="At least 8 characters"
              />
            </Form.Item>

            <Button
              block
              htmlType="submit"
              icon={<ArrowRight size={16} />}
              iconPlacement="end"
              loading={authMutation.isPending}
              type="primary"
              style={{
                borderRadius: "var(--radius-sm)",
                fontWeight: 800,
                marginTop: "8px",
              }}
            >
              {isSignup ? "Create account" : "Sign in"}
            </Button>
          </Form>

          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
            style={{ fontSize: "0.86rem" }}
          >
            <Text type="secondary">
              {isSignup ? "Already have an account?" : "New to Meera?"}
            </Text>
            <Link
              href={isSignup ? "/login" : "/signup"}
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              {isSignup ? "Sign in" : "Create one"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
