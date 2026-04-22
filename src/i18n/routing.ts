import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "rw", "sw", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
});
