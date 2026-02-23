const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    /** @type {import('next/dist/lib/load-custom-routes').Header['headers']} */
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    // Build the CSP dynamically
    let cspConnectSrc = "'self' https://*.supabase.co https://*.resend.com";
    let cspImgSrc = "'self' data: https://*.supabase.co https://*.resend.com https://images.unsplash.com";

    // Allow local Supabase endpoints during development
    if (process.env.NODE_ENV !== "production") {
      cspConnectSrc += " http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*";
      cspImgSrc += " http://127.0.0.1:* http://localhost:*";
    }

    securityHeaders.push({
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src " + cspImgSrc,
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src " + cspConnectSrc,
        "frame-ancestors 'none'",
      ].join("; "),
    });

    // HSTS only in production
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
