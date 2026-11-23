// @ts-check
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import preact from "@astrojs/preact";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://shlongee.github.io",
  i18n: {
    locales: ["en", "ru"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    preact(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          ru: "ru",
        },
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: "rose-pine-dawn",
        dark: "aurora-x",
      },
      wrap: true,
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: "JetBrains Mono",
      cssVariable: "--jetbrains-mono",
      options: {
        variants: [
          { src: ["./src/assets/fonts/JetBrainsMono-Regular.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/JetBrainsMono-Italic.woff2"], weight: 400, style: "italic" },
          { src: ["./src/assets/fonts/JetBrainsMono-Bold.woff2"], weight: 700, style: "normal" },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Kejter",
      cssVariable: "--kejter",
      fallbacks: [],
      options: {
        variants: [
          { src: ["./src/assets/fonts/Kejter-latin.woff2"], weight: 400, style: "normal", display: "swap" },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "AmaticSC",
      cssVariable: "--amatic-sc",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/AmaticSC-cyrillic.woff2"],
            weight: "400",
            style: "normal",
            unicodeRange: ["U+0400-04FF", "U+2116"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "MorningBreeze",
      cssVariable: "--morning-breeze",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/morningbreeze-light.woff2"], weight: 300, style: "normal", display: "swap" },
          { src: ["./src/assets/fonts/morningbreeze-regular.woff2"], weight: 400, style: "normal", display: "swap" },
          { src: ["./src/assets/fonts/morningbreeze-italic.woff2"], weight: 400, style: "italic", display: "swap" },
          { src: ["./src/assets/fonts/morningbreeze-bold.woff2"], weight: 700, style: "normal", display: "swap" },
        ],
      },
    }
  ],
  vite: {
    build: {
      chunkSizeWarningLimit: 750,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "three",
                test: /node_modules[\\/]three/,
              },
            ],
          },
        },
      },
    },
  },
});