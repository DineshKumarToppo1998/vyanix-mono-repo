'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function AccountPage() {
  const { user, isAuthenticated, loading, login, register, logout } = useAuth();
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleLogin = async () => {
    try {
      await login(loginForm);
      toast({ title: 'Welcome back', description: 'You are now signed in.' });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRegister = async () => {
    try {
      await register(registerForm);
      toast({ title: 'Account created', description: 'Your account is ready to use.' });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        {isAuthenticated && user ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="rounded-3xl border bg-white p-8 shadow-sm space-y-4">
              <p className="text-sm uppercase tracking-[0.25em] text-primary">Account</p>
              <h1 className="text-4xl font-bold tracking-tight">{user.firstName} {user.lastName}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">Role: {user.role}</p>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button asChild>
                  <Link href="/account/orders">View orders</Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="outline">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <Button variant="outline" onClick={logout}>Sign out</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto rounded-3xl border bg-white p-8 shadow-sm">
            <div className="space-y-3 mb-8">
              <p className="text-sm uppercase tracking-[0.25em] text-primary">Account</p>
              <h1 className="text-4xl font-bold tracking-tight">Sign in or create an account</h1>
              <p className="text-muted-foreground">
                Your backend account stores cart state, shipping details, and order history.
              </p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-sm mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
                </div>
                <Button onClick={handleLogin} disabled={loading}>Sign in</Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" value={registerForm.firstName} onChange={(event) => setRegisterForm((current) => ({ ...current, firstName: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" value={registerForm.lastName} onChange={(event) => setRegisterForm((current) => ({ ...current, lastName: event.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input id="register-email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Phone</Label>
                  <Input id="register-phone" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input id="register-password" type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} />
                </div>
                <Button onClick={handleRegister} disabled={loading}>Create account</Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
