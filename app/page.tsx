import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-col text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">LifeOS</h1>
        <p className="text-xl text-zinc-500 mb-8 max-w-2xl">
          Stop wondering &quot;what should I do today&quot; — let AI plan your day across work, wellness, and growth, then adapt when life happens.
        </p>
        
        <div className="p-8 rounded-xl border border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50 shadow-xl max-w-sm w-full">
          <h2 className="text-2xl font-semibold mb-6">Login</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
