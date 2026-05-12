'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information We Collect
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us for support. This may include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
              <li>Name and contact information</li>
              <li>Payment and billing information</li>
              <li>Account credentials</li>
              <li>Communications with us</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Develop new products and services</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign in with Google
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If you choose Sign in with Google, Google may share with Swissé the data you authorize
              through the OAuth consent screen for our app (typically your Google account subject
              identifier, name, email address, and profile picture, consistent with the{' '}
              <strong>openid</strong>, <strong>email</strong>, and <strong>profile</strong> scopes).
              We use that information only to create or log you into your Swissé account, secure
              your session, and personalize your experience on our site. Google processes your
              information under Google&apos;s own policies; see Google&apos;s Privacy Policy for
              details on how Google handles your data.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We use the email address associated with your account for account-related messages
              (for example sign-in, verification, order and shipping updates, password reset, and
              security notices). If we offer optional marketing emails, we will only send them when
              you have opted in, and you can unsubscribe using the link in those messages. We do
              not sell your email address or rent it to third parties for their marketing.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information Sharing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third 
              parties without your consent, except as described in this policy. We may share 
              your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
              <li>With service providers who assist us in operating our website</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no 
              method of transmission over the internet is 100% secure.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We use cookies and similar tracking technologies to enhance your experience on 
              our website. You can control cookie settings through your browser preferences.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Rights
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 mb-6">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your personal information</li>
              <li>Object to processing of your information</li>
              <li>Data portability</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our services are not intended for children under 13. We do not knowingly collect 
              personal information from children under 13. If we become aware that we have 
              collected personal information from a child under 13, we will take steps to 
              delete such information.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We may update this privacy policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If you have any questions about this Privacy Policy, please reach out through our{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                Contact
              </Link>{' '}
              page.
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

