import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <SignUp forceRedirectUrl="/overview" />
    </main>
  );
}

