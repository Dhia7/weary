/**
 * Localities (municipalities / cités) from the public Tunisian Municipality API,
 * filtered client-side to the user’s delegation.
 * @see https://tn-municipality-api.vercel.app
 */

/** Same-origin proxy (see `app/locality/municipalities/route.ts`) — avoids CORS “Failed to fetch” in the browser. */
const MUNICIPALITIES_URL = '/locality/municipalities';

type ApiDelegation = { Name: string; Value: string; PostalCode?: string };

type ApiGovernorateBlock = { Name?: string; Delegations?: ApiDelegation[] };

/** `name` query values accepted by the API (lowercase). */
const GOVERNORATE_TO_API_NAME: Record<string, string> = {
  Ariana: 'ariana',
  Béja: 'beja',
  'Ben Arous': 'ben arous',
  Bizerte: 'bizerte',
  Gabès: 'gabes',
  Gafsa: 'gafsa',
  Jendouba: 'jendouba',
  Kairouan: 'kairouan',
  Kasserine: 'kasserine',
  Kébili: 'kebili',
  'Le Kef': 'kef',
  Mahdia: 'mahdia',
  'La Manouba': 'manouba',
  Médenine: 'medenine',
  Monastir: 'monastir',
  Nabeul: 'nabeul',
  Sfax: 'sfax',
  'Sidi Bouzid': 'sidi bouzid',
  Siliana: 'siliana',
  Sousse: 'sousse',
  Tataouine: 'tataouine',
  Tozeur: 'tozeur',
  Tunis: 'tunis',
  Zaghouan: 'zaghouan',
};

export type LocalityOption = {
  id: string;
  label: string;
  postalCode: string;
};

/** Strip combining marks (broader than `\p{M}` support in some runtimes). */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeKey(s: string): string {
  return stripDiacritics(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Canonical slug for comparing our delegation labels to API `Value` / name head
 * (handles La Soukra vs LA SOUKRA, Djebel Djelloud vs JEBEL JELLOUD, etc.).
 */
function slugForDelegation(s: string): string {
  let x = normalizeKey(s);
  x = x.replace(/DJEBEL/g, 'JEBEL').replace(/DJELL/g, 'JELL').replace(/DJEL/g, 'JEL');
  // Common FR / official spelling drift vs API `Value`
  x = x.replace(/BENGUERDANE/g, 'BENGARDANE');
  for (const p of ['LA', 'LES', 'EL', 'LE']) {
    if (x.startsWith(p) && x.length - p.length >= 4) {
      x = x.slice(p.length);
      break;
    }
  }
  return x;
}

function nameHead(name: string): string {
  return name.split('(')[0]?.trim() ?? '';
}

function matchesDelegation(row: ApiDelegation, userDelegation: string): boolean {
  const head = nameHead(row.Name);
  const su = slugForDelegation(userDelegation);
  const sh = slugForDelegation(head);
  const sv = slugForDelegation(row.Value);
  if (!su) return false;
  if (su === sh || su === sv) return true;
  const min = 4;
  if (su.length >= min && (sh.includes(su) || su.includes(sh))) return true;
  if (su.length >= min && (sv.includes(su) || su.includes(sv))) return true;
  return false;
}

export function governorateToApiQueryName(governorate: string): string {
  return (
    GOVERNORATE_TO_API_NAME[governorate] ??
    stripDiacritics(governorate).toLowerCase()
  );
}

export async function fetchLocalitiesForDelegation(
  governorate: string,
  delegation: string,
  signal?: AbortSignal
): Promise<LocalityOption[]> {
  const nameParam = governorateToApiQueryName(governorate);
  const url = `${MUNICIPALITIES_URL}?name=${encodeURIComponent(nameParam)}`;
  const res = await fetch(url, { signal });
  const data = (await res.json()) as unknown;
  if (!res.ok) {
    const msg =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (!Array.isArray(data)) {
    throw new Error('Invalid locality response');
  }

  const rows = data.flatMap((g) => g.Delegations ?? []);
  const filtered = rows.filter((r) => matchesDelegation(r, delegation));

  const seen = new Set<string>();
  const out: LocalityOption[] = [];
  for (const r of filtered) {
    const label = r.Name.trim();
    const postalCode = String(r.PostalCode ?? '').trim();
    const id = `${label}|${postalCode}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, postalCode });
  }
  out.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
  return out;
}
