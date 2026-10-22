import AuthForm from "@/components/AuthForm.js";

export const metadata = { title: "Crear cuenta · GastoFácil" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
