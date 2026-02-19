import { auth } from '@/auth';
import HomeClient from './HomeClient';

export default async function Home() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  const teacherId = (session?.user as any)?.teacherId;

  return <HomeClient userRole={userRole} teacherId={teacherId} />;
}
