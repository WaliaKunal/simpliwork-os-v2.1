'use client'; import { useAuth } from '@/context/AuthContext'; export default function Home(){const {user,loading}=useAuth();return <pre>{JSON.stringify({user,loading},null,2)}</pre>}
