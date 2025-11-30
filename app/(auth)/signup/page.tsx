import SignUpForm from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Sign Up - AutoShorts',
  description: 'Create your AutoShorts account and start your free trial',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">Start your 7-day free trial</p>
        <SignUpForm />
      </div>
    </div>
  );
}

