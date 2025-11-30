import SignInForm from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In - AutoShorts',
  description: 'Sign in to your AutoShorts account',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold text-black mb-2">Sign In</h1>
        <p className="text-gray-600 mb-6">Welcome back to AutoShorts</p>
        <SignInForm />
      </div>
    </div>
  );
}

