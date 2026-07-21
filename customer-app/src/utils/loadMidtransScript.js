/**
 * Load Midtrans Snap script dynamically.
 * Vite doesn't auto-substitute env vars in index.html for external scripts,
 * so we load it via JS with data-client-key attribute.
 */
export function loadMidtransScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('midtrans-snap-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute(
      'data-client-key',
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    );
    script.onload = resolve;
    script.onerror = () => reject(new Error('Gagal memuat Midtrans script'));
    document.body.appendChild(script);
  });
}
