import { cookies } from 'next/headers';
import type { Language } from '@/lib/contexts/LanguageContext';

export async function getServerLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const value = cookieStore.get('language')?.value;
  return value === 'en' || value === 'fr' ? value : 'fr';
}
