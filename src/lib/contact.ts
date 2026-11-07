const endpoint = (import.meta.env.PUBLIC_CONTACT_ENDPOINT || '').trim();
const providerName = (import.meta.env.CONTACT_PROVIDER_NAME || '').trim();
const providerPrivacyUrl = (import.meta.env.CONTACT_PROVIDER_PRIVACY_URL || '').trim();

function requireHttps(value: string, setting: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${setting} must be a full HTTPS URL.`); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${setting} must be an HTTPS URL without credentials.`);
}

if (endpoint) {
  requireHttps(endpoint, 'PUBLIC_CONTACT_ENDPOINT');
  if (!providerName || !providerPrivacyUrl) {
    throw new Error('Direct enquiries require CONTACT_PROVIDER_NAME and CONTACT_PROVIDER_PRIVACY_URL for the privacy notice.');
  }
  requireHttps(providerPrivacyUrl, 'CONTACT_PROVIDER_PRIVACY_URL');
}

export const contact = { endpoint, providerName, providerPrivacyUrl };
