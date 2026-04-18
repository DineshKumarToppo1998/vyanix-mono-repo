'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, LayoutDashboard, Shield } from 'lucide-react';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/api-client';

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
            {/* User Profile Card */}
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

            {/* Change Password Section */}
            <ChangePasswordSection />
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

/* ==================== Change Password Component ==================== */

function ChangePasswordSection() {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  if (!visible) {
    return (
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setVisible(true)}
        >
          <KeyRound className="mr-2 h-4 w-4" />
          Change Password
        </Button>
      </div>
    );
  }

  const handlePasswordChange = async () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must be identical.',
        variant: 'destructive',
      });
      return;
    }

    if (form.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.changePassword(form.oldPassword, form.newPassword);
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully. You will be logged out.',
      });
      setTimeout(() => window.location.href = '/account', 1500);
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Change Password</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={form.oldPassword}
            onChange={(e) => setForm(f => ({ ...f, oldPassword: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handlePasswordChange} disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
          <Button variant="outline" onClick={() => { setVisible(false); setForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
