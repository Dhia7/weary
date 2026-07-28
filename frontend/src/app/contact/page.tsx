'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { buildApiUrl, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';

const inputClassName =
  'w-full px-4 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary transition-colors';

const labelClassName =
  'block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2';

export default function ContactPage() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setSubmittedEmail('');
    setConfirmationEmailSent(false);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(buildApiUrl('/contact'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitStatus('error');
        setErrorMessage(getApiErrorMessage(res, data));
        return;
      }

      setSubmitStatus('success');
      setSubmittedEmail(data.data?.email || payload.email);
      setConfirmationEmailSent(Boolean(data.data?.confirmationEmailSent));
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-swisse-canvas text-swisse-ink dark:bg-background dark:text-foreground">
      <Navigation />

      <main id="main-content" className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h1 className="font-serif text-4xl sm:text-5xl text-swisse-ink dark:text-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-swisse-ink/70 dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as
            possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8"
          >
            <h2 className="font-serif text-2xl text-swisse-ink dark:text-foreground mb-8">
              Get in Touch
            </h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-swisse-gold mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-1">
                    Email
                  </h3>
                  <p className="text-swisse-ink/70 dark:text-muted-foreground">dhianaija@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-swisse-gold mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-1">
                    Phone
                  </h3>
                  <p className="text-swisse-ink/70 dark:text-muted-foreground">+(216) 28-700-958</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-swisse-gold mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-1">
                    Address
                  </h3>
                  <p className="text-swisse-ink/70 dark:text-muted-foreground">
                    Sahloul 3
                    <br />
                    Sousse, 4056
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-swisse-gold mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-1">
                    Business Hours
                  </h3>
                  <p className="text-swisse-ink/70 dark:text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM
                    <br />
                    Saturday: 10:00 AM - 4:00 PM
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={labelClassName}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClassName}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className={labelClassName}>
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="message" className={labelClassName}>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={inputClassName}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || submitStatus === 'success'}
                className={`w-full py-3.5 px-6 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  submitStatus === 'success'
                    ? 'bg-swisse-gold text-white'
                    : 'bg-swisse-ink hover:bg-swisse-gold disabled:opacity-50 text-swisse-canvas dark:bg-foreground dark:text-background dark:hover:bg-primary'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-swisse-canvas border-t-transparent rounded-full animate-spin dark:border-background" />
                    Sending...
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Message Sent
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              {submitStatus === 'success' && submittedEmail && (
                <div className="p-4 bg-swisse-mist/80 dark:bg-muted/50 border border-swisse-gold/20 dark:border-border">
                  <p className="text-sm font-medium text-swisse-ink dark:text-foreground">
                    Thank you! Your message was sent successfully.
                  </p>
                  <p className="text-sm text-swisse-ink/70 dark:text-muted-foreground mt-2">
                    Our team will contact you at{' '}
                    <span className="font-semibold">{submittedEmail}</span> as soon as possible.
                    {confirmationEmailSent && (
                      <> We also sent a confirmation to that email address.</>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitStatus('idle');
                      setSubmittedEmail('');
                      setConfirmationEmailSent(false);
                    }}
                    className="mt-3 text-sm font-medium text-swisse-gold hover:text-swisse-ink dark:text-primary dark:hover:text-foreground transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {errorMessage || 'Failed to send message. Please try again.'}
                  </p>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
