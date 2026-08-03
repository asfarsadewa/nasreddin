export const COLLECTION_COPY = {
  en: {
    htmlLanguage: 'en',
    documentTitle: 'Wisdom Short Stories',
    description: 'Timeless tales retold as brief multilingual cinematic experiences.',
    languageLabel: 'Site language',
    eyebrow: 'A small library of enduring tales',
    titleFirst: 'Wisdom',
    titleSecond: 'Short Stories',
    introduction: 'Old stories, retold as brief cinematic experiences—performed, subtitled, and made to linger.',
    showing: 'Now showing',
    viewStory: 'Watch the story',
    shelfEyebrow: 'The shelf is growing',
    shelfTitle: 'More wisdom, shortly.',
    shelfBody: 'New tales will arrive here, each with its own world, voice, and way of seeing.',
    footer: 'Made for a quiet minute. Remembered for longer.',
    notFoundEyebrow: 'Beyond the shelf',
    notFoundDocumentTitle: 'Story Not Found | Wisdom Short Stories',
    notFoundDescription: 'This story is not on the shelf. Browse the collection for a cinematic tale ready to be told.',
    notFoundTitle: 'That story is not here—yet.',
    notFoundBody: 'Return to the collection and choose a tale that is ready to be told.',
    backHome: 'Browse the collection',
  },
  id: {
    htmlLanguage: 'id',
    documentTitle: 'Kumpulan Kisah Teladan',
    description: 'Kisah-kisah abadi yang dituturkan kembali sebagai pengalaman sinematik multibahasa.',
    languageLabel: 'Bahasa situs',
    eyebrow: 'Perpustakaan kecil untuk kisah yang abadi',
    titleFirst: 'Kumpulan Kisah',
    titleSecond: 'Teladan',
    introduction: 'Kisah-kisah lama, dituturkan kembali sebagai pengalaman sinematik singkat—dengan suara, subtitle, dan makna yang tinggal lebih lama.',
    showing: 'Sedang tayang',
    viewStory: 'Tonton kisahnya',
    shelfEyebrow: 'Rak ini terus bertambah',
    shelfTitle: 'Hikmah berikutnya segera hadir.',
    shelfBody: 'Kisah-kisah baru akan hadir di sini, masing-masing dengan dunia, suara, dan sudut pandangnya sendiri.',
    footer: 'Dibuat untuk satu menit yang tenang. Dikenang lebih lama.',
    notFoundEyebrow: 'Di luar rak',
    notFoundDocumentTitle: 'Kisah Tidak Ditemukan | Kumpulan Kisah Teladan',
    notFoundDescription: 'Kisah ini belum ada di rak. Jelajahi koleksi dan pilih kisah sinematik yang siap dituturkan.',
    notFoundTitle: 'Kisah itu belum ada di sini.',
    notFoundBody: 'Kembalilah ke koleksi dan pilih kisah yang sudah siap dituturkan.',
    backHome: 'Lihat koleksi',
  },
  zh: {
    htmlLanguage: 'zh-CN',
    documentTitle: 'Wisdom Short Stories · 智慧短篇',
    description: '把流传已久的故事，重述为短小精致的多语种电影体验。',
    languageLabel: '网站语言',
    eyebrow: '一座收藏恒久故事的小小书阁',
    titleFirst: '智慧',
    titleSecond: '短篇',
    introduction: '古老的故事，以短小的电影体验重新讲述——有表演、有字幕，也有久久不散的余味。',
    showing: '正在上映',
    viewStory: '观看故事',
    shelfEyebrow: '故事仍在增加',
    shelfTitle: '下一则智慧，即将到来。',
    shelfBody: '新的故事会陆续来到这里，各有自己的世界、声音与看见事物的方式。',
    footer: '一刻安静，回味更久。',
    notFoundEyebrow: '书阁之外',
    notFoundDocumentTitle: '故事未找到 | Wisdom Short Stories · 智慧短篇',
    notFoundDescription: '这则故事还不在书阁里。请浏览故事集，选择一则已经准备好开讲的电影化短篇。',
    notFoundTitle: '这则故事还没有来到这里。',
    notFoundBody: '回到故事集，选择一则已经准备好开讲的故事。',
    backHome: '浏览故事集',
  },
};

export const STORIES = [
  {
    slug: 'smell-of-soup',
    path: '/stories/smell-of-soup',
    sequence: '01',
    status: 'available',
    title: {
      en: 'The Smell of Soup & The Sound of Money',
      id: 'Aroma Sup & Gemerincing Uang',
      zh: '汤香与钱响',
    },
    description: {
      en: 'A hungry traveler, a disputed aroma, and Nasreddin’s perfectly measured judgment.',
      id: 'Seorang musafir lapar, aroma yang diperebutkan, dan putusan Nasreddin yang menakar keadilan dengan sempurna.',
      zh: '一位饥饿的旅人、一缕引发争执的香气，以及纳斯尔丁恰到好处的裁决。',
    },
    tradition: {
      en: 'A Nasreddin Hodja tale',
      id: 'Kisah Nasreddin Hodja',
      zh: '纳斯尔丁·霍加故事',
    },
    duration: {
      en: '1 minute 35 seconds',
      id: '1 menit 35 detik',
      zh: '1 分 35 秒',
    },
    format: {
      en: '3D animation · Trilingual voice',
      id: 'Animasi 3D · Suara trilingual',
      zh: '3D 动画 · 三语配音',
    },
    languages: '中文 · EN · ID',
    load: () => import('./stories/smell-of-soup/entry.js'),
  },
  {
    slug: 'yan-er-dao-ling',
    path: '/stories/yan-er-dao-ling',
    sequence: '02',
    status: 'available',
    cover: 'bell',
    title: {
      zh: '掩耳盗铃',
      en: 'Covering One’s Ears While Stealing a Bell',
      id: 'Menutup Telinga Saat Mencuri Lonceng',
    },
    description: {
      zh: '一个自以为聪明的偷钟人，一口声传院外的大钟，以及只属于他自己的安静。',
      en: 'A self-satisfied thief, a bell heard beyond the walls, and a silence that belongs to him alone.',
      id: 'Seorang pencuri yang merasa cerdik, dentang yang menembus tembok, dan kesunyian yang hanya menjadi miliknya.',
    },
    tradition: {
      zh: '中国古代寓言',
      en: 'An ancient Chinese fable',
      id: 'Fabel Tiongkok kuno',
    },
    duration: {
      zh: '约 2 分钟',
      en: 'About 2 minutes',
      id: 'Sekitar 2 menit',
    },
    format: {
      zh: '3D 动画 · 三语配音',
      en: '3D animation · Trilingual voice',
      id: 'Animasi 3D · Suara trilingual',
    },
    languages: '中文 · EN · ID',
    load: () => import('./stories/yan-er-dao-ling/entry.js'),
  },
  {
    slug: 'tiger-and-dried-persimmon',
    path: '/stories/tiger-and-dried-persimmon',
    sequence: '03',
    status: 'available',
    cover: 'persimmon',
    title: {
      en: 'The Tiger and the Dried Persimmon',
      id: 'Harimau dan Kesemek Kering',
      zh: '老虎与柿饼',
    },
    description: {
      en: 'A crying child, one small dried persimmon, and two strangers racing through the dark in mutual terror.',
      id: 'Seorang anak yang menangis, sebutir kesemek kering, dan dua sosok yang berlari dalam gelap karena sama-sama ketakutan.',
      zh: '一个哭闹的孩子、一枚小小的柿饼，以及两个在黑夜里彼此吓得狂奔的陌生人。',
    },
    tradition: {
      en: 'A Korean folktale',
      id: 'Cerita rakyat Korea',
      zh: '韩国民间故事',
    },
    duration: {
      en: 'About 2 minutes',
      id: 'Sekitar 2 menit',
      zh: '约 2 分钟',
    },
    format: {
      en: '3D animation · Trilingual voice',
      id: 'Animasi 3D · Suara trilingual',
      zh: '3D 动画 · 三语配音',
    },
    languages: '中文 · EN · ID',
    load: () => import('./stories/tiger-and-dried-persimmon/entry.js'),
  },
];

export function normalizePath(pathname) {
  const withoutIndex = pathname.replace(/\/index\.html$/, '');
  return withoutIndex.replace(/\/+$/, '') || '/';
}

export function findStory(pathname) {
  const path = normalizePath(pathname);
  return STORIES.find((story) => story.path === path);
}

export function formatStoryCount(language, count) {
  if (language === 'zh') return `${count} 则故事`;
  if (language === 'id') return `${count} kisah`;
  return `${count} ${count === 1 ? 'story' : 'stories'}`;
}
