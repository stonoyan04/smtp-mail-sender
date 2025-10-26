import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      fromAddress: string | null
    }
  }

  interface User {
    id: string
    email: string
    role: string
    fromAddress: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    fromAddress: string | null
  }
}
