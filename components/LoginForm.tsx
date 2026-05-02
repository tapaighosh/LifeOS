"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials");
      } else if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      
      <div className="flex flex-col gap-2 text-left">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <input 
          id="username"
          name="username" 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:focus:ring-zinc-600"
          placeholder="password"
        />
      </div>
      
      <button 
        type="submit"
        disabled={loading}
        className="mt-4 h-10 rounded-md bg-zinc-900 px-8 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
