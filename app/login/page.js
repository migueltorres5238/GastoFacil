import AuthForm from "@/components/AuthForm.js";

export const metadata = { title: "Iniciar sesión · GastoFácil" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
