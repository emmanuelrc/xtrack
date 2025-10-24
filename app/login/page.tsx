// app/login/page.tsx
// Keep this route simple: the layout handles the framing and wordmark.
// Just render the LoginForm here.

import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
