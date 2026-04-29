import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      
      async authorize(credentials) {
        // Dummy credentials for now as requested
        if (
          credentials?.username === 'admin' &&
          credentials?.password === 'password'
        ) {
          return { id: '1', name: 'Ty', email: 'ty@lifeos.com' };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/', // Using the root landing page as login
  },
  secret: process.env.NEXTAUTH_SECRET,
};
