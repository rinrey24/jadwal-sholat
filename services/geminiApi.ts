/**
 * Groq API integration for semantic Quran search.
 * Uses Llama 3.3 70B via Groq (free tier: 14,400 req/day, 30 req/min)
 * then fetches actual text from Al-Quran Cloud API (free, no key needed).
 *
 * NOTE: Move API key to .env / backend proxy before publishing to production.
 */

// Store actual key in .env.local: EXPO_PUBLIC_GROQ_API_KEY=gsk_...
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface QuranSearchResult {
  surah: number;
  ayatNumber: number;
  surahName: string;
  arabicText: string;
  translation: string;
  reason: string;
}

export interface SearchResponse {
  results: QuranSearchResult[];
  summary: string;
  query: string;
}

function buildPrompt(query: string): string {
  return `Kamu adalah asisten Al-Quran yang membantu menemukan ayat-ayat berdasarkan makna dan konteks dalam Bahasa Indonesia.

Temukan 3-5 ayat Al-Quran yang PALING RELEVAN untuk topik/pertanyaan berikut:
"${query}"

ATURAN WAJIB:
- Kembalikan HANYA format JSON di bawah ini, tanpa teks lain
- Nomor surah: 1–114, nomor ayat harus valid
- "summary": 2–3 kalimat apa yang Al-Quran ajarkan tentang topik ini
- "reason": 1–2 kalimat mengapa ayat ini relevan

FORMAT JSON YANG HARUS DIKEMBALIKAN:
{
  "summary": "...",
  "verses": [
    {
      "surah": 2,
      "ayat": 153,
      "surahName": "Al-Baqarah",
      "reason": "..."
    }
  ]
}`;
}

/** Optional callback to report status to UI (e.g. retry countdown) */
export type StatusCallback = (msg: string) => void;

/** Sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function searchQuranSemantic(
  query: string,
  onStatus?: StatusCallback,
): Promise<SearchResponse> {
  // ── Step 1: Ask Groq (Llama 3.3 70B) for verse references ───────────────────
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 15_000;

  let groqData: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: buildPrompt(query) }],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });
    } catch (networkErr) {
      throw new Error('Tidak dapat terhubung ke internet. Periksa koneksi internetmu.');
    }

    if (res.ok) {
      groqData = await res.json();
      break;
    }

    let detail = '';
    try { const body = await res.json(); detail = body?.error?.message ?? ''; } catch {}

    if (res.status === 429) {
      if (attempt < MAX_RETRIES) {
        const secs = RETRY_DELAY_MS / 1000;
        for (let s = secs; s > 0; s--) {
          onStatus?.(`AI sedang sibuk — mencoba lagi dalam ${s} detik… (${attempt + 1}/${MAX_RETRIES})`);
          await sleep(1000);
        }
        onStatus?.('Mencoba lagi…');
      } else {
        throw new Error('AI masih terlalu sibuk setelah beberapa percobaan. Tunggu 1 menit lalu coba lagi.');
      }
    } else if (res.status === 401) {
      throw new Error('API key tidak valid. Periksa konfigurasi API key.');
    } else if (res.status === 400) {
      throw new Error(`Permintaan tidak valid. Coba ubah pertanyaanmu.${detail ? '\n' + detail : ''}`);
    } else {
      throw new Error(`Gagal menghubungi AI (${res.status})${detail ? ': ' + detail : ''}.`);
    }
  }

  if (!groqData) {
    throw new Error('Tidak dapat menghubungi AI. Coba lagi nanti.');
  }

  const rawText: string = groqData.choices?.[0]?.message?.content ?? '';

  // Extract JSON block from response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Format respons AI tidak valid. Coba lagi.');

  const { summary = '', verses = [] } = JSON.parse(jsonMatch[0]);

  // ── Step 2: Fetch Arabic + Indonesian text from Al-Quran Cloud (free) ─────
  const results: QuranSearchResult[] = await Promise.all(
    (verses as Array<{
      surah: number; ayat: number; surahName: string; reason: string;
    }>).map(async (v): Promise<QuranSearchResult> => {
      try {
        const quranRes = await fetch(
          `https://api.alquran.cloud/v1/ayah/${v.surah}:${v.ayat}/editions/ar,id.kemenag`
        );
        const { data } = await quranRes.json();
        return {
          surah: v.surah,
          ayatNumber: v.ayat,
          surahName: v.surahName ?? data?.[0]?.surah?.englishName ?? `Surah ${v.surah}`,
          arabicText: data?.[0]?.text ?? '',
          translation: data?.[1]?.text ?? '',
          reason: v.reason ?? '',
        };
      } catch {
        return {
          surah: v.surah,
          ayatNumber: v.ayat,
          surahName: v.surahName ?? `Surah ${v.surah}`,
          arabicText: '',
          translation: '',
          reason: v.reason ?? '',
        };
      }
    })
  );

  return { results, summary, query };
}
