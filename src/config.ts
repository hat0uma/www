export const SITE = {
  website: "https://hat0uma.jp/",
  author: "hat0uma",
  bio: "Neovim好き",
  profile: "https://hat0uma.jp/about",
  desc: "hat0umaの備忘録",
  title: "hat0uma.log",
  ogImage: "hat0uma-og.png",
  icon: "hat0uma-icon-rounded.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/hat0uma/www/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "ja", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Tokyo", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
