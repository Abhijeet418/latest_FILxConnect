'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, KeyRound, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary from '@/components/ErrorBoundary';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        <div className="bg-primary/10 p-3 rounded-xl animate-pulse-slow">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center space-y-2 animate-slide-up">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            We've sent you a password reset link. Please check your email.
          </p>
        </div>
        <Button className="w-full h-11 animate-slide-up hover-scale" style={{ animationDelay: '0.2s' }} asChild>
          <Link href="/login">Return to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <div className="bg-primary/10 p-3 rounded-xl animate-pulse-slow">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight animate-slide-up">Forgot password?</h1>
        <p className="text-sm text-muted-foreground max-w-sm text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4 animate-slide-up">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="m@example.com"
                    required
                    disabled={isLoading}
                    className="h-11 hover-scale"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            className="w-full h-11 hover-scale transition-all" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
                Sending reset link...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <span className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium transition-all hover:text-primary/80">
            Sign in
          </Link>
        </span>
      </div>
    </ErrorBoundary>
  );
}