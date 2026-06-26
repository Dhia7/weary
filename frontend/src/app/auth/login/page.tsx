'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const hasGoogleSignIn = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [verifyGateEmail, setVerifyGateEmail] = useState<string | null>(null);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [logoutTitle, setLogoutTitle] = useState('');
  const [logoutBody, setLogoutBody] = useState('');
  const { login, resendVerificationEmail, loginWithGoogle } = useAuth();
  const { isFrench } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      const sent = params.get('emailSent');
      setInfoMessage(
        sent === '0'
          ? 'Account created. We could not send the verification email yet (check server mail settings). After mail is configured, use “Resend verification” below with your email.'
          : 'Account created. Check your email for a verification link, then sign in here.'
      );
    }

    if (params.get('loggedOut') === '1') {
      const userName = params.get('userName');
      setLogoutTitle(
        userName
          ? (isFrench ? `À bientôt, ${userName} !` : `See you soon, ${userName}!`)
          : (isFrench ? 'Déconnexion réussie' : 'Signed out successfully')
      );
      setLogoutBody(
        isFrench
          ? 'Votre session est terminée et votre compte est sécurisé. Reconnectez-vous à tout moment pour accéder à vos commandes, votre liste de souhaits et vos préférences enregistrées.'
          : 'Your session has ended and your account is secure. Sign in again anytime to access your orders, wishlist, and saved preferences.'
      );

      const url = new URL(window.location.href);
      url.searchParams.delete('loggedOut');
      url.searchParams.delete('userName');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isFrench]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const completeLogin = (
    result: { success: boolean; message: string; user?: { isAdmin?: boolean; firstName?: string; fullName?: string }; code?: string },
    emailForVerification?: string
  ) => {
    if (result.success && result.user) {
      if (result.user.isAdmin) {
        router.push('/admin');
      } else {
        const userName = result.user.firstName || result.user.fullName;
        const params = new URLSearchParams();
        params.set('loginSuccess', 'true');
        if (userName) {
          params.set('userName', userName);
        }
        router.push(`/?${params.toString()}`);
      }
      return true;
    }

    setError(result.message);
    if (result.code === 'EMAIL_NOT_VERIFIED') {
      setVerifyGateEmail(emailForVerification || pendingCredentials?.email || '');
    }
    return false;
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    setVerifyGateEmail(null);
    setResendMessage('');

    try {
      const result = await login(data.email, data.password);

      if (result.code === 'TWO_FACTOR_REQUIRED') {
        setPendingCredentials({ email: data.email, password: data.password });
        setTwoFactorStep(true);
        setError('');
        return;
      }

      completeLogin(result, data.email);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingCredentials || twoFactorCode.length !== 6) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await login(
        pendingCredentials.email,
        pendingCredentials.password,
        twoFactorCode
      );
      if (!completeLogin(result)) {
        setTwoFactorCode('');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verifyGateEmail) return;
    setResendLoading(true);
    setResendMessage('');
    const r = await resendVerificationEmail(verifyGateEmail);
    setResendMessage(r.message);
    setResendLoading(false);
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError('');
    setVerifyGateEmail(null);
    setResendMessage('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(credential);
      if (result.success) {
        if (result.user?.isAdmin) {
          router.push('/admin');
        } else {
          const userName = result.user?.firstName || result.user?.fullName;
          const params = new URLSearchParams();
          params.set('loginSuccess', 'true');
          if (userName) {
            params.set('userName', userName);
          }
          router.push(`/?${params.toString()}`);
        }
      } else {
        setError(result.message);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-swisse-canvas dark:bg-background">
      <Navigation />

      <main id="main-content" className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-swisse-ink/60 hover:text-swisse-gold dark:text-muted-foreground dark:hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {isFrench ? "Retour à l'accueil" : 'Back to home'}
          </Link>

          <div className="text-center mb-10">
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl text-swisse-ink dark:text-foreground mb-3"
            >
              {isFrench ? 'Bon retour' : 'Welcome Back'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-swisse-ink/70 dark:text-muted-foreground leading-relaxed"
            >
              {isFrench
                ? 'Connectez-vous pour accéder à votre compte, vos commandes et votre liste de souhaits.'
                : 'Sign in to access your account, orders, and wishlist.'}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8"
          >
          {hasGoogleSignIn && !twoFactorStep && (
            <>
              <div className="flex flex-col items-stretch gap-2">
                <div className="flex w-full justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      const c = credentialResponse.credential;
                      if (c) await handleGoogleSuccess(c);
                    }}
                    onError={() => setError('Google sign-in failed')}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    width={384}
                    text="continue_with"
                    shape="rectangular"
                  />
                </div>
                {googleLoading && (
                  <p className="text-center text-sm text-swisse-ink/60 dark:text-muted-foreground">
                    {isFrench ? 'Connexion en cours…' : 'Signing in…'}
                  </p>
                )}
              </div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-swisse-gold/20 dark:border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white/90 dark:bg-card text-swisse-ink/50 dark:text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    {isFrench ? 'Ou par e-mail' : 'Or continue with email'}
                  </span>
                </div>
              </div>
            </>
          )}
          {twoFactorStep ? (
            <form onSubmit={onSubmitTwoFactor} className="space-y-6">
              <p className="text-sm text-swisse-ink/70 dark:text-muted-foreground">
                {isFrench
                  ? 'Saisissez le code à 6 chiffres de votre application d’authentification.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </p>
              <div>
                <label htmlFor="twoFactorCode" className="block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2">
                  {isFrench ? "Code d'authentification" : 'Authentication code'}
                </label>
                <input
                  id="twoFactorCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full px-3 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary tracking-widest text-center text-lg transition-colors"
                  placeholder="000000"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading || twoFactorCode.length !== 6}
                className="w-full bg-swisse-ink hover:bg-swisse-gold disabled:opacity-50 text-swisse-canvas text-[10px] font-bold uppercase tracking-widest py-3.5 px-4 transition-colors duration-300 dark:bg-foreground dark:text-background dark:hover:bg-primary"
              >
                <span>{isLoading ? (isFrench ? 'Vérification…' : 'Verifying…') : (isFrench ? 'Vérifier et se connecter' : 'Verify and sign in')}</span>
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setTwoFactorStep(false);
                  setPendingCredentials(null);
                  setTwoFactorCode('');
                  setError('');
                }}
                className="w-full text-sm text-swisse-ink/60 dark:text-muted-foreground hover:text-swisse-gold dark:hover:text-primary transition-colors"
              >
                {isFrench ? 'Retour à la connexion' : 'Back to sign in'}
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {logoutTitle && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-swisse-mist/80 dark:bg-muted/50 border border-swisse-gold/20 dark:border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <LogOut className="h-5 w-5 text-swisse-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-swisse-ink dark:text-foreground">{logoutTitle}</p>
                    <p className="mt-1 text-sm text-swisse-ink/70 dark:text-muted-foreground">{logoutBody}</p>
                  </div>
                </div>
              </motion.div>
            )}
            {infoMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-swisse-mist/80 dark:bg-muted/50 border border-swisse-gold/20 dark:border-border p-3"
              >
                <p className="text-sm text-swisse-ink/80 dark:text-muted-foreground">{infoMessage}</p>
              </motion.div>
            )}
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2">
                {isFrench ? 'Adresse e-mail' : 'Email address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-swisse-gold/70" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="block w-full pl-10 pr-3 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary transition-colors"
                  placeholder={isFrench ? 'Votre adresse e-mail' : 'Enter your email'}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2">
                {isFrench ? 'Mot de passe' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-swisse-gold/70" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="block w-full pl-10 pr-12 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary transition-colors"
                  placeholder={isFrench ? 'Votre mot de passe' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? (isFrench ? 'Masquer le mot de passe' : 'Hide password') : (isFrench ? 'Afficher le mot de passe' : 'Show password')}
                  aria-pressed={showPassword ? 'true' : 'false'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-swisse-ink/40 hover:text-swisse-gold transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-swisse-ink/40 hover:text-swisse-gold transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-3"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                {verifyGateEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-sm font-medium text-swisse-gold hover:text-swisse-ink dark:text-primary dark:hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    {resendLoading
                      ? (isFrench ? 'Envoi…' : 'Sending…')
                      : (isFrench ? 'Renvoyer l’e-mail de vérification' : 'Resend verification email')}
                  </button>
                )}
                {resendMessage && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{resendMessage}</p>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading || googleLoading}
              className="w-full bg-swisse-ink hover:bg-swisse-gold disabled:opacity-50 text-swisse-canvas text-[10px] font-bold uppercase tracking-widest py-3.5 px-4 transition-colors duration-300 flex items-center justify-center gap-2 dark:bg-foreground dark:text-background dark:hover:bg-primary"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-swisse-canvas border-t-transparent rounded-full animate-spin dark:border-background" />
              ) : (
                <>
                  <span>{isFrench ? 'Se connecter' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
          )}

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-swisse-gold hover:text-swisse-ink dark:text-primary dark:hover:text-foreground transition-colors"
            >
              {isFrench ? 'Mot de passe oublié ?' : 'Forgot your password?'}
            </Link>
            <div className="text-sm text-swisse-ink/60 dark:text-muted-foreground">
              {isFrench ? 'Pas encore de compte ?' : "Don't have an account?"}{' '}
              <Link
                href="/auth/signup"
                className="text-swisse-gold hover:text-swisse-ink dark:text-primary dark:hover:text-foreground font-medium transition-colors"
              >
                {isFrench ? 'Créer un compte' : 'Sign up'}
              </Link>
            </div>
          </div>
        </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
