import { google } from 'googleapis';

// --- Environment Variables ---
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || import.meta.env.GOOGLE_SHEET_ID;
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || import.meta.env.GOOGLE_SHEET_NAME || 'Sheet1';
const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = (
  process.env.GOOGLE_PRIVATE_KEY ||
  import.meta.env.GOOGLE_PRIVATE_KEY ||
  ''
).replace(/\\n/g, '\n');

// --- Interfaces ---

export interface BaseLeadData {
  formType: 'contact_form' | 'faq_form' | 'configurator_form' | 'inquiry_form';
  email: string;
  phone?: string;
  utm?: string; // All UTM params as formatted text (one per line)
}

export interface ContactLeadData extends BaseLeadData {
  formType: 'contact_form' | 'faq_form';
  message?: string;
}

export interface InquiryLeadData extends BaseLeadData {
  formType: 'inquiry_form';
  name?: string;
  teamSize?: string;
  timeline?: string;
  additionalInfo?: string;
}

export interface QuoteLeadData extends BaseLeadData {
  formType: 'configurator_form';
  additionalInfo?: string;
  quote: {
    participants: number | string;
    dates: string | string[];
    priceBrutto: number | string;
    priceNetto: number | string;
    itemsSummary: string;
  };
}

export type LeadData = ContactLeadData | InquiryLeadData | QuoteLeadData;

// --- Helper Functions ---

/**
 * Format date to DD/MM/YYYY HH:mm:ss (Google Sheets datetime format)
 */
const formatDate = (date: Date): string => {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Build a row array matching the Google Sheet column order:
 * 0: STATUS, 1: KOMENTARZ, 2: Data, 3: Typ Formularza, 4: Email, 5: Telefon,
 * 6: Wiadomość, 7: Liczba Osób, 8: Data Eventu, 9: Wartość (PLN),
 * 10: Szczegóły Oferty, 11: UTM
 */
const teamSizeLabels: Record<string, string> = {
  'do-30': 'do 30 osób',
  '31-80': '31-80 osób',
  '81-150': '81-150 osób',
  '150+': '150+ osób',
};

const buildRow = (data: LeadData): string[] => {
  const isQuote = data.formType === 'configurator_form' && 'quote' in data;
  const isInquiry = data.formType === 'inquiry_form';
  const quoteData = isQuote ? (data as QuoteLeadData).quote : null;
  const inquiryData = isInquiry ? (data as InquiryLeadData) : null;

  // Get message field based on form type
  let message = '';
  if (inquiryData) {
    const parts: string[] = [];
    if (inquiryData.name) parts.push(`Imię/Firma: ${inquiryData.name}`);
    if (inquiryData.additionalInfo) parts.push(inquiryData.additionalInfo);
    message = parts.join('\n');
  } else if ('message' in data && data.message) {
    message = data.message;
  } else if ('additionalInfo' in data && data.additionalInfo) {
    message = data.additionalInfo;
  }

  // Team size / participants
  let teamSize = '';
  if (inquiryData?.teamSize) {
    teamSize = teamSizeLabels[inquiryData.teamSize] || inquiryData.teamSize;
  } else if (quoteData) {
    teamSize = String(quoteData.participants);
  }

  // Event dates / timeline
  let eventDates = '';
  if (inquiryData?.timeline) {
    eventDates = inquiryData.timeline;
  } else if (quoteData) {
    eventDates = Array.isArray(quoteData.dates) ? quoteData.dates.join(', ') : quoteData.dates;
  }

  // Format price with brutto and netto on separate lines
  let priceValue = '';
  if (quoteData) {
    const lines: string[] = [];
    if (quoteData.priceBrutto) lines.push(`Brutto: ${quoteData.priceBrutto} PLN`);
    if (quoteData.priceNetto) lines.push(`Netto: ${quoteData.priceNetto} PLN`);
    priceValue = lines.join('\n');
  }

  return [
    'NOWY', // 0: STATUS
    '', // 1: KOMENTARZ (empty for manual input)
    formatDate(new Date()), // 2: Data
    data.formType, // 3: Typ Formularza
    data.email, // 4: Email
    data.phone ? `'${data.phone}` : '', // 5: Telefon (prefixed with ' to prevent number formatting)
    message, // 6: Wiadomość
    teamSize, // 7: Liczba Osób
    eventDates, // 8: Data Eventu
    priceValue, // 9: Wartość (PLN) - Brutto + Netto
    quoteData?.itemsSummary || '', // 10: Szczegóły Oferty
    data.utm || '', // 11: UTM (all params, one per line)
  ];
};

// --- Main Export ---

/**
 * Append a lead to the Google Sheet
 */
export const appendLeadToSheet = async (data: LeadData): Promise<{ success: boolean; error?: string }> => {
  if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('[Google Sheets] Missing credentials in environment variables.');
    return { success: false, error: 'Server configuration error' };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const row = buildRow(data);

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${GOOGLE_SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    console.log('[Google Sheets] Successfully appended lead:', data.formType, data.email);
    return { success: true };
  } catch (error) {
    console.error('[Google Sheets] Error appending lead:', error);
    return { success: false, error: 'Failed to save data to sheet' };
  }
};
