// Everything on the site that may change lives here. Pages fill elements
// marked data-config="key" from these values.
window.VERGE_CONFIG = {
  supportEmail: 'support@vergefinance.app',

  // Who runs Verge, as named in the privacy policy, terms and footers. A
  // person for now (Verge is a solo project, not a registered business); it
  // must match the name verified on the Google Play developer account. If a
  // business is registered, put its name exactly as on the certificate.
  operator: 'Kwarfo Michael Acheampong',

  // Same Supabase project as the app. The publishable key is public by
  // design: row-level security only lets the website add to the waitlist,
  // never read it. Never put the secret key here.
  supabaseUrl: 'https://nffevmvtjfllckourbel.supabase.co',
  supabaseKey: 'sb_publishable_yDPFIktoe2952_Dm1nPL9A_MHMx5b5x',

  lastUpdated: '3 October 2026',
};
