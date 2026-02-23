import { auth } from "@/auth";
import LoginCard from "./LoginCard";

export default async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) return <LoginCard />;
  return <>{children}</>;
}
