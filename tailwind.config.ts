/**
 * Tailwind CSS v4 uses CSS-based configuration (@import "tailwindcss" in globals.css).
 * This file exists for forward compatibility and tooling discovery.
 * Custom theme extensions should be added via @theme in CSS.
 * See: https://tailwindcss.com/docs/configuration
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {},
  plugins: [],
};

export default config;
