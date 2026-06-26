'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

const hasGoogleSignIn = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const inputClassName =
  'block w-full pl-10 pr-3 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary transition-colors';

const inputWithToggleClassName =
  'block w-full pl-10 pr-12 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary transition-colors';

const labelClassName =
  'block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2';

const PasswordStrengthIndicator = ({ password, isFrench }: { password: string; isFrench: boolean }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/\d/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        level: 'weak',
        color: 'bg-red-500',
        text: isFrench ? 'Faible' : 'Weak',
      };
    }
    if (score <= 3) {
      return {
        level: 'fair',
        color: 'bg-yellow-500',
        text: isFrench ? 'Moyen' : 'Fair',
      };
    }
    if (score <= 4) {
      return {
        level: 'good',
        color: 'bg-swisse-gold',
        text: isFrench ? 'Bon' : 'Good',
      };
    }
    return {
      level: 'strong',
      color: 'bg-green-600',
      text: isFrench ? 'Fort' : 'Strong',
    };
  };

  const strength = getStrength();
  const percentage = Math.min((password.length / 8) * 100, 100);

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between text-xs">
        <span className="text-swisse-ink/60 dark:text-muted-foreground">
          {isFrench ? 'Force du mot de passe' : 'Password strength'}
        </span>
        <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>
          {strength.text}
        </span>
      </div>
      <div className="w-full bg-swisse-mist dark:bg-muted h-1.5">
        <div
          className={`h-1.5 transition-all duration-300 ${strength.color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup, loginWithGoogle } = useAuth();
  const { isFrench } = useLanguage();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      if (result.success) {
        const q = new URLSearchParams({ registered: '1' });
        if (result.emailSent === false) {
          q.set('emailSent', '0');
        }
        router.push(`/auth/login?${q.toString()}`);
      } else {
        setError(result.message);
      }
    } catch {
      setError(isFrench ? 'Une erreur est survenue. Veuillez réessayer.' : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError('');
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
      setError(isFrench ? 'Une erreur est survenue. Veuillez réessayer.' : 'An unexpected error occurred. Please try again.');
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
              {isFrench ? 'Créer un compte' : 'Create Account'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-swisse-ink/70 dark:text-muted-foreground leading-relaxed"
            >
              {isFrench
                ? 'Rejoignez Swissé pour suivre vos commandes, enregistrer vos favoris et profiter d’une expérience personnalisée.'
                : 'Join Swissé to track orders, save your favorites, and enjoy a personalized experience.'}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8"
          >
            {hasGoogleSignIn && (
              <>
                <div className="flex flex-col items-stretch gap-2">
                  <div className="flex w-full justify-center">
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        const c = credentialResponse.credential;
                        if (c) await handleGoogleSuccess(c);
                      }}
                      onError={() =>
                        setError(isFrench ? 'Échec de la connexion Google' : 'Google sign-in failed')
                      }
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
                      {isFrench ? 'Ou par e-mail' : 'Or sign up with email'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className={labelClassName}>
                    {isFrench ? 'Prénom' : 'First name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-swisse-gold/70" />
                    </div>
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      className={inputClassName}
                      placeholder={isFrench ? 'Marie' : 'John'}
                    />
                  </div>
                  {errors.firstName && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.firstName.message}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className={labelClassName}>
                    {isFrench ? 'Nom' : 'Last name'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-swisse-gold/70" />
                    </div>
                    <input
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      className={inputClassName}
                      placeholder={isFrench ? 'Dupont' : 'Doe'}
                    />
                  </div>
                  {errors.lastName && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.lastName.message}
                    </motion.p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className={labelClassName}>
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
                    className={inputClassName}
                    placeholder={isFrench ? 'vous@exemple.com' : 'you@example.com'}
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

              <div>
                <label htmlFor="phone" className={labelClassName}>
                  {isFrench ? 'Téléphone (optionnel)' : 'Phone (optional)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-swisse-gold/70" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={inputClassName}
                    placeholder="+216 20 123 456"
                  />
                </div>
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.phone.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="password" className={labelClassName}>
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
                    className={inputWithToggleClassName}
                    placeholder={isFrench ? 'Créez un mot de passe' : 'Create a strong password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={
                      showPassword
                        ? isFrench
                          ? 'Masquer le mot de passe'
                          : 'Hide password'
                        : isFrench
                          ? 'Afficher le mot de passe'
                          : 'Show password'
                    }
                    aria-pressed={showPassword ? 'true' : 'false'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-swisse-ink/40 hover:text-swisse-gold transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-swisse-ink/40 hover:text-swisse-gold transition-colors" />
                    )}
                  </button>
                </div>
                {watchedPassword && (
                  <PasswordStrengthIndicator password={watchedPassword} isFrench={isFrench} />
                )}
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

              <div>
                <label htmlFor="confirmPassword" className={labelClassName}>
                  {isFrench ? 'Confirmer le mot de passe' : 'Confirm password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-swisse-gold/70" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={inputWithToggleClassName}
                    placeholder={isFrench ? 'Confirmez votre mot de passe' : 'Confirm your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={
                      showConfirmPassword
                        ? isFrench
                          ? 'Masquer la confirmation'
                          : 'Hide confirm password'
                        : isFrench
                          ? 'Afficher la confirmation'
                          : 'Show confirm password'
                    }
                    aria-pressed={showConfirmPassword ? 'true' : 'false'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-swisse-ink/40 hover:text-swisse-gold transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-swisse-ink/40 hover:text-swisse-gold transition-colors" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                  >
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

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
                    <span>{isFrench ? 'Créer mon compte' : 'Create account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-swisse-ink/60 dark:text-muted-foreground">
                {isFrench ? 'Déjà un compte ?' : 'Already have an account?'}{' '}
                <Link
                  href="/auth/login"
                  className="text-swisse-gold hover:text-swisse-ink dark:text-primary dark:hover:text-foreground font-medium transition-colors"
                >
                  {isFrench ? 'Se connecter' : 'Sign in'}
                </Link>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
