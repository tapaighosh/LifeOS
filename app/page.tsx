import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

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
          <form method="post" action="/api/auth/signin/credentials" className="flex flex-col gap-4">
            <input name="csrfToken" type="hidden" defaultValue="" />
            
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <input 
                id="username"
                name="username" 
                type="text" 
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:focus:ring-zinc-600"
                placeholder="admin"
              />
            </div>
            
            <div className="flex flex-col gap-2 text-left">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input 
                id="password"
                name="password" 
                type="password" 
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:focus:ring-zinc-600"
                placeholder="password"
              />
            </div>
            
            <button 
              type="submit"
              className="mt-4 h-10 rounded-md bg-zinc-900 px-8 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
