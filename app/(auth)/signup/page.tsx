import SignUpForm from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Sign Up - AutoShorts',
  description: 'Create your AutoShorts account and start your free trial',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">Start your 7-day free trial</p>
        <SignUpForm />
      </div>
    </div>
  );
}

