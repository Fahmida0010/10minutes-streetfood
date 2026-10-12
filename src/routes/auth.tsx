import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — 10MinitesStreetfood" },
      { name: "description", content: "Sign in to add a street food place or write reviews." },
      { property: "og:title", content: "Sign in — 10MinitesStreetfood" },
      { property: "og:description", content: "Sign in to add a street food place or write reviews." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(6).max(100) });

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse({ email, password });
    if (!p.success) { toast.error("Enter a valid email and a password of 6+ characters"); return; }
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({
        ...p.data,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email to confirm your account");
    } else {
      const { error } = await supabase.auth.signInWithPassword(p.data);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      nav({ to: "/dashboard" });
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { toast.error("Google sign-in failed"); return; }
    if (res.redirected) { return; }
    nav({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-muted-foreground">Owners can add and update their place. Visitors can write reviews.</p>
      <Button variant="outline" size="lg" className="mt-6 w-full rounded-full" onClick={google}>
        Continue with Google
      </Button>
      <div className="my-6 text-center text-sm text-muted-foreground">or</div>
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
          {mode === "in" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <button className="mt-4 text-sm text-primary underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </main>
  );
}
