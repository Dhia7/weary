import { GoogleAuthWrapper } from '@/components/GoogleAuthWrapper';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <GoogleAuthWrapper>{children}</GoogleAuthWrapper>;
}
