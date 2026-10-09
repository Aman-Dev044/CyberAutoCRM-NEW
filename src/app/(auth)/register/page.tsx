import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a CyberAutoSuite customer account to book and track services.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
