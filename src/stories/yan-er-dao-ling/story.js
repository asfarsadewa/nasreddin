export const STORY_LINES = [
  {
    file: '01_narrator_bell.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: {
      zh: '很久以前，有个人在一座安静的院子里，看见一口漂亮的青铜大钟。',
      en: 'Long ago, a man found a magnificent bronze bell hanging in a quiet courtyard.',
      id: 'Dahulu kala, seorang lelaki melihat lonceng perunggu yang indah tergantung di sebuah halaman yang sunyi.',
    },
    chapter: ['I', { zh: '院中铜钟', en: 'The bronze bell', id: 'Lonceng perunggu' }],
  },
  {
    file: '02_thief_claims.wav', speaker: { zh: '偷钟人', en: 'Thief', id: 'Pencuri' },
    text: { zh: '这么好的钟，应该归我。', en: 'A bell this fine ought to belong to me.', id: 'Lonceng sebagus ini seharusnya menjadi milikku.' },
    chapter: ['I', { zh: '院中铜钟', en: 'The bronze bell', id: 'Lonceng perunggu' }],
  },
  {
    file: '03_narrator_heavy.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: { zh: '他使出浑身力气去搬，大钟却纹丝不动。', en: 'He pulled with all his strength. The bell did not move at all.', id: 'Ia mengerahkan seluruh tenaganya. Lonceng itu sama sekali tidak bergerak.' },
    chapter: ['II', { zh: '搬不动', en: 'Too heavy', id: 'Terlalu berat' }],
  },
  {
    file: '04_thief_plan.wav', speaker: { zh: '偷钟人', en: 'Thief', id: 'Pencuri' },
    text: { zh: '太重了……不如砸碎，再一块一块带走。', en: "Too heavy to carry... I'll break it apart and take it piece by piece.", id: 'Terlalu berat... Akan kuhancurkan, lalu kubawa sedikit demi sedikit.' },
    chapter: ['II', { zh: '搬不动', en: 'Too heavy', id: 'Terlalu berat' }],
  },
  {
    file: '05_narrator_hammer.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: { zh: '他举起铁锤，狠狠砸了下去。', en: 'He lifted his hammer and struck.', id: 'Ia mengangkat palunya tinggi-tinggi, lalu menghantam.' },
    chapter: ['III', { zh: '响亮的主意', en: 'One loud idea', id: 'Akal yang nyaring' }],
  },
  {
    file: '06_narrator_rings.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: { zh: '钟声越过院墙，在夜色里远远传开。', en: "The bell's voice leapt over the courtyard wall and rolled far into the night.", id: 'Suara lonceng melompati tembok halaman dan bergema jauh menembus malam.' },
    chapter: ['III', { zh: '响亮的主意', en: 'One loud idea', id: 'Akal yang nyaring' }],
  },
  {
    file: '07_thief_panics.wav', speaker: { zh: '偷钟人', en: 'Thief', id: 'Pencuri' },
    text: { zh: '糟了！大家都会听见！', en: 'Oh no! Everyone will hear it!', id: 'Celaka! Semua orang akan mendengarnya!' },
    chapter: ['III', { zh: '响亮的主意', en: 'One loud idea', id: 'Akal yang nyaring' }],
  },
  {
    file: '08_narrator_covers.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: {
      zh: '他慌忙用双手捂住耳朵。院子顿时安静了——至少，对他来说是这样。',
      en: 'In a panic, he clapped both hands over his ears. The courtyard fell silent—at least, for him.',
      id: 'Panik, ia menutup kedua telinganya. Halaman itu pun sunyi—setidaknya, bagi dirinya.',
    },
    chapter: ['IV', { zh: '只对一人安静', en: 'Quiet to one man', id: 'Sunyi bagi satu orang' }],
  },
  {
    file: '09_thief_fools.wav', speaker: { zh: '偷钟人', en: 'Thief', id: 'Pencuri' },
    text: { zh: '哈！我听不见，别人当然也听不见。', en: 'Ha! If I cannot hear it, no one else can either.', id: 'Ha! Kalau aku tidak mendengarnya, orang lain pasti tidak mendengarnya juga.' },
    chapter: ['IV', { zh: '只对一人安静', en: 'Quiet to one man', id: 'Sunyi bagi satu orang' }],
  },
  {
    file: '10_narrator_second.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: { zh: '他得意地又砸了一锤。第二声，比第一声还要响亮。', en: 'Pleased with his cleverness, he struck again. The second peal was louder than the first.', id: 'Bangga akan kecerdikannya, ia menghantam sekali lagi. Dentang kedua bahkan lebih keras.' },
    chapter: ['IV', { zh: '只对一人安静', en: 'Quiet to one man', id: 'Sunyi bagi satu orang' }],
  },
  {
    file: '11_villager_calls.wav', speaker: { zh: '邻人', en: 'Villager', id: 'Penduduk' },
    text: { zh: '谁在里面？', en: "Who's in there?", id: 'Siapa di dalam sana?' },
    chapter: ['V', { zh: '世人皆闻', en: 'The whole world heard', id: 'Dunia mendengarnya' }],
  },
  {
    file: '12_narrator_caught.wav', speaker: { zh: '旁白', en: 'Narrator', id: 'Narator' },
    text: {
      zh: '邻人循声赶来，把他抓个正着。他骗得了自己的耳朵，却骗不了整个世界。这就是——掩耳盗铃。',
      en: "The neighbors followed the sound and caught him beside the bell. He had fooled his own ears, but not the world. We remember it as covering one's ears while stealing a bell.",
      id: 'Para tetangga mengikuti suara itu dan memergokinya di samping lonceng. Ia berhasil menipu telinganya sendiri, tetapi tidak seluruh dunia. Inilah kisah Menutup Telinga Saat Mencuri Lonceng.',
    },
    chapter: ['V', { zh: '世人皆闻', en: 'The whole world heard', id: 'Dunia mendengarnya' }],
  },
];

export const AUDIO_TRACKS = {
  zh: { label: '中文', root: '/audio/stories/yan-er-dao-ling/voice/zh/' },
  en: { label: 'English', root: '/audio/stories/yan-er-dao-ling/voice/en/' },
  id: { label: 'Bahasa Indonesia', root: '/audio/stories/yan-er-dao-ling/voice/id/' },
};

export const MUSIC_CUES = {
  opening: '/audio/stories/yan-er-dao-ling/music/opening-theme.mp3',
  ambience: '/audio/stories/yan-er-dao-ling/music/courtyard-underscore.mp3',
  ending: '/audio/stories/yan-er-dao-ling/music/ending-theme.mp3',
};

export const SFX_CUES = {
  bell: '/audio/stories/yan-er-dao-ling/sfx/bronze-bell-strike.mp3',
  courtyard: '/audio/stories/yan-er-dao-ling/sfx/courtyard-night.mp3',
  approach: '/audio/stories/yan-er-dao-ling/sfx/villagers-approach.mp3',
};

const shared = {
  chinese: '中文', english: 'English', indonesian: 'Bahasa Indonesia',
};

export const UI_COPY = {
  zh: {
    ...shared, htmlLanguage: 'zh-CN', documentTitle: '掩耳盗铃 | Wisdom Short Stories',
    eyebrow: '中国古代寓言 · 电影化短篇',
    titleHtml: '<span>掩耳</span><span class="opening__join"><i>盗</i>铃</span>',
    deck: '他捂住自己的耳朵，以为整个世界也会随之安静。',
    preparing: '正在准备故事', loading: '加载配音、音乐与音效', begin: '开始故事',
    ready: '配音、音乐与字幕已就绪', headphones: '建议佩戴耳机',
    taleMark: '中国古代寓言', chapter: '章', judgment: '寓意',
    endingHtml: '捂住耳朵，<br>世界仍然听得见。', replay: '再听一遍',
    pause: '暂停故事', resume: '继续故事', mute: '关闭声音', unmute: '开启声音',
    muteMusic: '关闭音乐', unmuteMusic: '开启音乐', musicMuted: '音乐已关闭。', musicPlaying: '音乐已开启。',
    hideSubtitles: '隐藏字幕', showSubtitles: '显示字幕', started: '故事开始了。', paused: '故事已暂停。', resumed: '故事继续。', ended: '故事结束了。',
    loadError: '音频加载失败', retry: '请刷新页面重试', optionsLabel: '语言与字幕',
    optionsEyebrow: '播放选项', optionsTitle: '选择你的听法', optionsIntro: '配音与屏幕字幕可以分别选择。',
    voice: '配音', voiceHelp: '完整角色演绎', voiceLoading: '正在加载{language}配音 · {progress}%', voiceLoadError: '{language}配音加载失败，请重试。', subtitles: '字幕', subtitlesHelp: '可与配音语言不同',
    off: '关闭', close: '关闭语言选项', allStories: '全部故事',
  },
  en: {
    ...shared, htmlLanguage: 'en', documentTitle: 'Covering One’s Ears While Stealing a Bell | Wisdom Short Stories',
    eyebrow: 'An ancient Chinese fable · cinematically retold',
    titleHtml: '<span>Covering one’s ears</span><span class="opening__join">while stealing <i>a bell</i></span>',
    deck: 'He covered his own ears—and mistook that private silence for the silence of the world.',
    preparing: 'Preparing the story', loading: 'Loading voices, score & sound', begin: 'Begin the story',
    ready: 'Voices, music & subtitles ready', headphones: 'Headphones recommended',
    taleMark: 'An ancient Chinese fable', chapter: 'Chapter', judgment: 'The lesson',
    endingHtml: 'Cover your ears.<br>The world still hears.', replay: 'Tell it again',
    pause: 'Pause story', resume: 'Resume story', mute: 'Mute sound', unmute: 'Unmute sound',
    muteMusic: 'Mute music', unmuteMusic: 'Unmute music', musicMuted: 'Music muted.', musicPlaying: 'Music playing.',
    hideSubtitles: 'Hide subtitles', showSubtitles: 'Show subtitles', started: 'The story has begun.', paused: 'Story paused.', resumed: 'Story resumed.', ended: 'The story has ended.',
    loadError: 'The audio could not be loaded', retry: 'Refresh to try again', optionsLabel: 'Language and subtitles',
    optionsEyebrow: 'Listening options', optionsTitle: 'Hear it your way', optionsIntro: 'Choose the performed language and the words shown on screen independently.',
    voice: 'Voice', voiceHelp: 'Fully acted narration', voiceLoading: 'Loading {language} voice · {progress}%', voiceLoadError: 'Could not load {language}. Try again.', subtitles: 'Subtitles', subtitlesHelp: 'Choose independently from the voice',
    off: 'Off', close: 'Close language options', allStories: 'All stories',
  },
  id: {
    ...shared, htmlLanguage: 'id', documentTitle: 'Menutup Telinga Saat Mencuri Lonceng | Wisdom Short Stories',
    eyebrow: 'Fabel Tiongkok kuno · dituturkan secara sinematik',
    titleHtml: '<span>Menutup telinga</span><span class="opening__join">saat mencuri <i>lonceng</i></span>',
    deck: 'Ia menutup telinganya sendiri—lalu mengira seluruh dunia ikut terdiam.',
    preparing: 'Menyiapkan kisah', loading: 'Memuat suara, musik & efek', begin: 'Mulai kisahnya',
    ready: 'Suara, musik & subtitle siap', headphones: 'Disarankan memakai headphone',
    taleMark: 'Fabel Tiongkok kuno', chapter: 'Bab', judgment: 'Hikmahnya',
    endingHtml: 'Tutup telingamu.<br>Dunia tetap mendengar.', replay: 'Ceritakan lagi',
    pause: 'Jeda kisah', resume: 'Lanjutkan kisah', mute: 'Bisukan suara', unmute: 'Nyalakan suara',
    muteMusic: 'Bisukan musik', unmuteMusic: 'Nyalakan musik', musicMuted: 'Musik dibisukan.', musicPlaying: 'Musik dinyalakan.',
    hideSubtitles: 'Sembunyikan subtitle', showSubtitles: 'Tampilkan subtitle', started: 'Kisah dimulai.', paused: 'Kisah dijeda.', resumed: 'Kisah dilanjutkan.', ended: 'Kisah telah usai.',
    loadError: 'Audio tidak dapat dimuat', retry: 'Muat ulang halaman untuk mencoba lagi', optionsLabel: 'Bahasa dan subtitle',
    optionsEyebrow: 'Pilihan mendengarkan', optionsTitle: 'Nikmati dengan caramu', optionsIntro: 'Pilih bahasa suara dan tulisan di layar secara terpisah.',
    voice: 'Suara', voiceHelp: 'Narasi dengan pemeran lengkap', voiceLoading: 'Memuat suara {language} · {progress}%', voiceLoadError: 'Suara {language} tidak dapat dimuat. Coba lagi.', subtitles: 'Subtitle', subtitlesHelp: 'Boleh berbeda dari bahasa suara',
    off: 'Tanpa subtitle', close: 'Tutup pilihan bahasa', allStories: 'Semua cerita',
  },
};

export const CAMERA_POSES = [
  { position: [10.8, 5.8, 12.5], target: [0, 1.8, -1.2], fov: 40 },
  { position: [4.8, 2.7, 5.8], target: [-0.2, 1.65, 0], fov: 36 },
  { position: [-4.0, 2.2, 4.5], target: [-1.2, 1.2, 0.7], fov: 33 },
  { position: [3.8, 2.25, 4.1], target: [0.9, 1.3, 0.6], fov: 31 },
  { position: [-1.5, 3.4, 4.2], target: [0.2, 1.85, -0.2], fov: 29 },
  { position: [7.0, 3.3, 6.8], target: [0, 1.8, -0.3], fov: 38 },
  { position: [-2.8, 2.1, 3.6], target: [0.8, 1.5, 0.5], fov: 28 },
  { position: [1.1, 2.1, 3.0], target: [1.2, 1.65, 0.7], fov: 27 },
  { position: [2.5, 1.9, 3.3], target: [1.0, 1.55, 0.6], fov: 28 },
  { position: [-0.3, 3.5, 4.0], target: [0.15, 1.8, -0.2], fov: 29 },
  { position: [7.8, 2.8, 5.2], target: [1.6, 1.3, 0.4], fov: 34 },
  { position: [11.8, 6.2, 13.6], target: [0, 1.65, -0.4], fov: 41 },
];
