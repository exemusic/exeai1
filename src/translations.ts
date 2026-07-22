export interface TranslationDict {
  // General & Nav
  newChat: string;
  workstation: string;
  settings: string;
  recentConversations: string;
  searchChats: string;
  today: string;
  yesterday: string;
  previous7Days: string;
  olderHistory: string;
  clearHistory: string;
  
  // Greeting & Main Chat
  hello: string;
  askPlaceholder: string;
  generatingResponse: string;
  uploadFile: string;
  topic: string;
  model: string;
  usingModelInfo: string;
  
  // Settings Tabs
  tabAccountName: string;
  tabAccountDesc: string;
  tabModelName: string;
  tabModelDesc: string;
  tabTampilanName: string;
  tabTampilanDesc: string;
  tabIngatanName: string;
  tabIngatanDesc: string;
  tabFeedbackName: string;
  tabFeedbackDesc: string;
  
  // Account Tab
  accountHeader: string;
  accountSubheader: string;
  activeConnection: string;
  offlineMode: string;
  signOut: string;
  nicknameHeader: string;
  nicknameSubheader: string;
  enterCustomName: string;
  saveNickname: string;
  prefLangHeader: string;
  prefLangSubheader: string;
  
  // Model Tab
  modelHeader: string;
  modelSubheader: string;
  availEngines: string;
  tempPresetHeader: string;
  tempPresetSubheader: string;
  activeTemp: string;
  consistent: string;
  creative: string;
  specializedTopics: string;
  
  // Tampilan Tab
  displayHeader: string;
  displaySubheader: string;
  selectStyleTheme: string;
  systemSync: string;
  systemSyncDesc: string;
  slateDark: string;
  slateDarkDesc: string;
  pureLight: string;
  pureLightDesc: string;
  chatHistorySettings: string;
  toggleYesterdayDesc: string;
  acousticAudioHeader: string;
  acousticAudioDesc: string;
  
  // Ingatan Tab
  memoryHeader: string;
  memorySubheader: string;
  injectMemory: string;
  memoryPlaceholder: string;
  maxMemoryReached: string;
  saveMemory: string;
  noMemories: string;
  
  // Feedback Tab
  feedbackHeader: string;
  feedbackSubheader: string;
  selectCategory: string;
  catSuggestion: string;
  catBug: string;
  catFeature: string;
  catOther: string;
  feedbackPlaceholder: string;
  attachFile: string;
  sendFeedback: string;
  feedbackSent: string;
  
  // Modals & General
  selectModel: string;
  selectTopic: string;
  chooseModelDesc: string;
  chooseTopicDesc: string;
  cancel: string;
  close: string;
  selected: string;
  compatible: string;
  active: string;
  rename: string;
  delete: string;
  seeAll: string;
  options: string;
  expandSidebar: string;
  closeSidebar: string;
  closeHistory: string;
  noSearchResults: string;
  noChatHistory: string;
  connectingToExeChat: string;
  verifyingSecureSession: string;
  welcomeSignInPrompt: string;
  chatSessionsSavedPrivately: string;
  removeAttachment: string;
  finalStep: string;
  whatIsYourName: string;
  chooseNicknameDesc: string;
  nicknameLabel: string;
  exampleNamePlaceholder: string;
  saveAndContinue: string;
  skipGoogleName: string;
  deleteWarning: string;
  confirmClearTitle: string;
  confirmClearDesc: string;
  clearChat: string;
  noConversationsFoundFor: string;
  matchingConversations: string;
  clickToJump: string;
  pressEscToClose: string;
  cookieNotificationTitle: string;
  cookieNotificationDesc: string;
  storageDetailsTitle: string;
  essentialStorageDesc: string;
  preferencesStorageDesc: string;
  privacyRespectNotice: string;
  hideDetails: string;
  learnDetails: string;
  exeChatDisclaimer: string;
  
  // ExeCode Workspace
  workspaceTitle: string;
  livePreview: string;
  aiAssistant: string;
  files: string;
  downloadZip: string;
  saveProject: string;
}

export const translations: Record<string, TranslationDict> = {
  en: {
    newChat: "New Chat",
    workstation: "ExeCode Workstation",
    settings: "Settings",
    recentConversations: "Recent Conversations",
    searchChats: "Search chats...",
    today: "Today",
    yesterday: "Yesterday",
    previous7Days: "Previous 7 Days",
    olderHistory: "Older History",
    clearHistory: "Clear All History",
    
    hello: "Hello",
    askPlaceholder: "Ask ExeChat anything...",
    generatingResponse: "Generating response...",
    uploadFile: "Upload File",
    topic: "Topic",
    model: "Model",
    usingModelInfo: "Using model {model} on the {preset} topic.",
    
    tabAccountName: "Account Profile & Status",
    tabAccountDesc: "View Google logins & usernames",
    tabModelName: "Model Engine & Personalities",
    tabModelDesc: "Select fast/powerful AI engines",
    tabTampilanName: "Display Aesthetics & Sounds",
    tabTampilanDesc: "Configure visual modes & feedback",
    tabIngatanName: "Persistent Cognitive Memory",
    tabIngatanDesc: "Inject customizable permanent facts",
    tabFeedbackName: "Submit Feedback & Files",
    tabFeedbackDesc: "Report issues or suggestions to Hexky",
    
    accountHeader: "Account Profile & Status",
    accountSubheader: "Verify login authenticity status and customize greeting nicknames.",
    activeConnection: "Active Secure Connection",
    offlineMode: "Offline Local Storage Mode",
    signOut: "Sign Out Account",
    nicknameHeader: "Personalize AI Nickname Greetings",
    nicknameSubheader: "Set a unique name the assistant will use during private chat dialogs.",
    enterCustomName: "Enter custom name...",
    saveNickname: "Save Nickname",
    prefLangHeader: "Preferred Cognitive Language",
    prefLangSubheader: "Select your preferred language. The system and AI responses will prioritize this choice.",
    
    modelHeader: "AI Engine & Cognitive Topics",
    modelSubheader: "Switch high-level AI reasoning engines and focus topics for tailored behaviors.",
    availEngines: "Available LLM Engines",
    tempPresetHeader: "Preset Temperature (Creativity Level)",
    tempPresetSubheader: "Temperature influences the creativity and consistency of model responses.",
    activeTemp: "Active Temp",
    consistent: "Consistent (0.10)",
    creative: "Creative (1.00)",
    specializedTopics: "Specialized Cognitive Presets",
    
    displayHeader: "Display Aesthetics & Themes",
    displaySubheader: "Customize the layout presentation, system colors, and sound effects.",
    selectStyleTheme: "Select Style Theme",
    systemSync: "System Sync",
    systemSyncDesc: "Follow OS configurations",
    slateDark: "Slate Dark",
    slateDarkDesc: "Eye-saving deep slate",
    pureLight: "Pure Light",
    pureLightDesc: "High contrast paper white",
    chatHistorySettings: "Chat History Settings",
    toggleYesterdayDesc: "Toggle yesterday, earlier and older chat logs in your navigation sidebar list.",
    acousticAudioHeader: "Acoustic Audio Feedback",
    acousticAudioDesc: "ExeChat will play a peaceful, gentle notify sound when generation is complete.",
    
    memoryHeader: "AI Memory Preferences",
    memorySubheader: "Give ExeChat persistent background facts (like occupation, coding preference) to remember permanently.",
    injectMemory: "Inject custom memory preference (Max 5)",
    memoryPlaceholder: "Example: I prefer codes written in React TSX style...",
    maxMemoryReached: "Maximum limit of 5 preferences reached",
    saveMemory: "Save Memory",
    noMemories: "No persistent memories configured yet. Customize yours above!",
    
    feedbackHeader: "Submit Feedback & Files",
    feedbackSubheader: "Share your suggestions or report issues directly to Hexky.",
    selectCategory: "Category",
    catSuggestion: "Suggestion",
    catBug: "Bug Report",
    catFeature: "Feature Request",
    catOther: "Other",
    feedbackPlaceholder: "Describe your issue or suggestion in detail...",
    attachFile: "Attach Screenshot / File (Optional)",
    sendFeedback: "Send Feedback",
    feedbackSent: "Feedback submitted successfully! Thank you.",
    
    selectModel: "Select AI Model",
    selectTopic: "Select Topic",
    chooseModelDesc: "Choose the artificial intelligence model that best fits your analysis and chat response needs.",
    chooseTopicDesc: "Select a trending or specialized topic to focus your AI assistant's expertise.",
    cancel: "Cancel",
    close: "Close",
    selected: "Selected",
    compatible: "Compatible",
    active: "Active",
    rename: "Rename",
    delete: "Delete",
    seeAll: "See all",
    options: "Options",
    expandSidebar: "Expand Sidebar",
    closeSidebar: "Close Sidebar",
    closeHistory: "Close History",
    noSearchResults: "No search results found.",
    noChatHistory: "No chat history yet.",
    connectingToExeChat: "Connecting to ExeChat...",
    verifyingSecureSession: "Verifying secure session...",
    welcomeSignInPrompt: "Please sign in using your Google account to start your chat session.",
    chatSessionsSavedPrivately: "Chat sessions are saved privately in your browser.",
    removeAttachment: "Remove Attachment",
    finalStep: "Final Step",
    whatIsYourName: "What is Your Name?",
    chooseNicknameDesc: "Choose a nickname to display in your chat sessions. Skip to use the name from your Google account.",
    nicknameLabel: "Nickname",
    exampleNamePlaceholder: "Example: John Doe",
    saveAndContinue: "Save & Continue",
    skipGoogleName: "Skip (Use Google Name)",
    deleteWarning: "Delete Warning",
    confirmClearTitle: "Clear Conversation",
    confirmClearDesc: "Are you sure you want to delete all messages in this conversation? This action cannot be undone.",
    clearChat: "Clear Chat",
    noConversationsFoundFor: 'No conversations found for "{query}"',
    matchingConversations: "Matching Conversations",
    clickToJump: "Click on a conversation to jump to it",
    pressEscToClose: "Press ESC to close",
    cookieNotificationTitle: "Cookie & Storage Notification",
    cookieNotificationDesc: "ExeChat uses cookies and local storage (localStorage) to remember your chat sessions, theme settings, and Google login verification to function optimally and securely.",
    storageDetailsTitle: "Our Storage Details:",
    essentialStorageDesc: "Essential (Required): Stores your chat session IDs, Google login status, and the API keys needed to interact with the AI.",
    preferencesStorageDesc: "Preferences (Optional): Stores your theme choices (Dark/Light), assistant characters/presets, and nickname memory preferences.",
    privacyRespectNotice: "We fully respect your privacy. All your chat data is stored locally on your own device.",
    hideDetails: "Hide Details",
    learnDetails: "Learn Details",
    exeChatDisclaimer: "ExeChat can make mistakes. Verify important info.",
    
    workspaceTitle: "ExeCode Web AI Workstation",
    livePreview: "Live Preview",
    aiAssistant: "AI Assistant",
    files: "Files",
    downloadZip: "Download ZIP",
    saveProject: "Save Project"
  },

  id: {
    newChat: "Percakapan Baru",
    workstation: "Workstation ExeCode",
    settings: "Pengaturan",
    recentConversations: "Riwayat Percakapan",
    searchChats: "Cari percakapan...",
    today: "Hari Ini",
    yesterday: "Kemarin",
    previous7Days: "7 Hari Terakhir",
    olderHistory: "Riwayat Lebih Lama",
    clearHistory: "Hapus Semua Riwayat",
    
    hello: "Halo",
    askPlaceholder: "Tanyakan apa saja pada ExeChat...",
    generatingResponse: "Menghasilkan respon...",
    uploadFile: "Unggah File",
    topic: "Topik",
    model: "Model",
    usingModelInfo: "Menggunakan model {model} pada topik {preset}.",
    
    tabAccountName: "Profil Akun & Status",
    tabAccountDesc: "Lihat akun Google & nama panggilan",
    tabModelName: "Engine Model & Karakter AI",
    tabModelDesc: "Pilih engine AI cepat & powerful",
    tabTampilanName: "Tampilan Aesthetics & Suara",
    tabTampilanDesc: "Atur tema visual & respon suara",
    tabIngatanName: "Memori Kognitif Permanen",
    tabIngatanDesc: "Tambahkan fakta latar belakang permanen",
    tabFeedbackName: "Kirim Umpan Balik & Berkas",
    tabFeedbackDesc: "Laporkan kendala atau saran ke Hexky",
    
    accountHeader: "Profil Akun & Status Login",
    accountSubheader: "Verifikasi status otentikasi login dan atur nama panggilan salam.",
    activeConnection: "Koneksi Aman Aktif",
    offlineMode: "Mode Penyimpanan Lokal Offline",
    signOut: "Keluar Akun",
    nicknameHeader: "Personalisasi Nama Panggilan AI",
    nicknameSubheader: "Atur nama unik yang akan digunakan asisten saat menyapa Anda secara pribadi.",
    enterCustomName: "Ketik nama panggilan...",
    saveNickname: "Simpan Nama Panggilan",
    prefLangHeader: "Bahasa Kognitif Pilihan",
    prefLangSubheader: "Pilih bahasa favorit Anda. Sistem dan balasan AI akan mengutamakan pilihan ini.",
    
    modelHeader: "Engine AI & Topik Spesialis",
    modelSubheader: "Ganti engine AI dan fokus topik untuk interaksi yang sesuai dengan kebutuhan Anda.",
    availEngines: "Engine LLM Yang Tersedia",
    tempPresetHeader: "Suhu Preset (Tingkat Kreativitas)",
    tempPresetSubheader: "Suhu mempengaruhi tingkat kreativitas dan konsistensi jawaban model.",
    activeTemp: "Suhu Aktif",
    consistent: "Konsisten (0.10)",
    creative: "Kreatif (1.00)",
    specializedTopics: "Preset Topik Spesialis",
    
    displayHeader: "Aesthetics Tampilan & Tema",
    displaySubheader: "Atur tampilan tata letak, warna sistem, dan efek suara pemberitahuan.",
    selectStyleTheme: "Pilih Tema Tampilan",
    systemSync: "Ikuti Sistem",
    systemSyncDesc: "Ikuti konfigurasi perangkat",
    slateDark: "Gelap Nyaman",
    slateDarkDesc: "Warna gelap lembut untuk mata",
    pureLight: "Terang Bersih",
    pureLightDesc: "Warna terang kontras tinggi",
    chatHistorySettings: "Pengaturan Riwayat Chat",
    toggleYesterdayDesc: "Tampilkan atau sembunyikan riwayat chat kemarin dan yang lebih lama di sidebar.",
    acousticAudioHeader: "Respon Suara Pemberitahuan",
    acousticAudioDesc: "ExeChat akan memainkan suara pemberitahuan lembut saat pembuatan respon selesai.",
    
    memoryHeader: "Pengaturan Memori AI",
    memorySubheader: "Berikan fakta latar belakang permanen (seperti pekerjaan, gaya kode) untuk diingat AI secara permanen.",
    injectMemory: "Tambahkan memori khusus (Maksimal 5)",
    memoryPlaceholder: "Contoh: Saya menyukai kode dalam gaya React TSX...",
    maxMemoryReached: "Batas maksimum 5 memori telah tercapai",
    saveMemory: "Simpan Memori",
    noMemories: "Belum ada memori permanen yang diatur. Tambahkan fakta Anda di atas!",
    
    feedbackHeader: "Kirim Umpan Balik & Berkas",
    feedbackSubheader: "Bagikan saran Anda atau laporkan kendala secara langsung kepada Hexky.",
    selectCategory: "Kategori",
    catSuggestion: "Saran",
    catBug: "Laporan Bug",
    catFeature: "Permintaan Fitur",
    catOther: "Lainnya",
    feedbackPlaceholder: "Jelaskan kendala atau saran Anda secara rinci...",
    attachFile: "Lampirkan Tangkapan Layar / Berkas (Opsional)",
    sendFeedback: "Kirim Umpan Balik",
    feedbackSent: "Umpan balik berhasil dikirim! Terima kasih atas bantuan Anda.",
    
    selectModel: "Pilih Model AI",
    selectTopic: "Pilih Topik",
    chooseModelDesc: "Pilih model kecerdasan buatan yang paling sesuai dengan kebutuhan analisis dan chat Anda.",
    chooseTopicDesc: "Pilih topik spesialis untuk memfokuskan keahlian asisten AI Anda.",
    cancel: "Batal",
    close: "Tutup",
    selected: "Dipilih",
    compatible: "Kompatibel",
    active: "Aktif",
    rename: "Ubah Nama",
    delete: "Hapus",
    seeAll: "Lihat Semua",
    options: "Opsi",
    expandSidebar: "Buka Sidebar",
    closeSidebar: "Tutup Sidebar",
    closeHistory: "Tutup Riwayat",
    noSearchResults: "Tidak ada hasil pencarian ditemukan.",
    noChatHistory: "Belum ada riwayat percakapan.",
    connectingToExeChat: "Menghubungkan ke ExeChat...",
    verifyingSecureSession: "Memverifikasi sesi aman...",
    welcomeSignInPrompt: "Silakan masuk dengan akun Google Anda untuk memulai sesi percakapan.",
    chatSessionsSavedPrivately: "Sesi percakapan disimpan secara pribadi di peramban Anda.",
    removeAttachment: "Hapus Lampiran",
    finalStep: "Langkah Terakhir",
    whatIsYourName: "Siapa Nama Anda?",
    chooseNicknameDesc: "Pilih nama panggilan untuk ditampilkan dalam sesi percakapan. Lewati untuk menggunakan nama dari akun Google Anda.",
    nicknameLabel: "Nama Panggilan",
    exampleNamePlaceholder: "Contoh: Budi Santoso",
    saveAndContinue: "Simpan & Lanjutkan",
    skipGoogleName: "Lewati (Gunakan Nama Google)",
    deleteWarning: "Peringatan Penghapusan",
    confirmClearTitle: "Hapus Percakapan",
    confirmClearDesc: "Apakah Anda yakin ingin menghapus semua pesan dalam percakapan ini? Tindakan ini tidak dapat dibatalkan.",
    clearChat: "Hapus Chat",
    noConversationsFoundFor: 'Tidak ada percakapan ditemukan untuk "{query}"',
    matchingConversations: "Percakapan Cocok",
    clickToJump: "Klik pada percakapan untuk langsung membukanya",
    pressEscToClose: "Tekan ESC untuk menutup",
    cookieNotificationTitle: "Pemberitahuan Cookie & Penyimpanan",
    cookieNotificationDesc: "ExeChat menggunakan cookie dan penyimpanan lokal (localStorage) untuk mengingat sesi chat, pengaturan tema, dan verifikasi login Google agar berfungsi secara optimal dan aman.",
    storageDetailsTitle: "Rincian Penyimpanan Kami:",
    essentialStorageDesc: "Penting (Wajib): Menyimpan ID sesi chat, status login Google, dan kunci API untuk berinteraksi dengan AI.",
    preferencesStorageDesc: "Preferensi (Opsional): Menyimpan pilihan tema (Gelap/Terang), preset asisten, dan preferensi memori nama panggilan.",
    privacyRespectNotice: "Kami sepenuhnya menghormati privasi Anda. Semua data percakapan Anda disimpan secara lokal di perangkat Anda sendiri.",
    hideDetails: "Sembunyikan Rincian",
    learnDetails: "Pelajari Rincian",
    exeChatDisclaimer: "ExeChat dapat membuat kesalahan. Verifikasi info penting.",
    
    workspaceTitle: "Workstation Web AI ExeCode",
    livePreview: "Pratinjau Langsung",
    aiAssistant: "Asisten AI",
    files: "Berkas",
    downloadZip: "Unduh ZIP",
    saveProject: "Simpan Proyek"
  },

  ar: {
    newChat: "محادثة جديدة",
    workstation: "محطة عمل ExeCode",
    settings: "الإعدادات",
    recentConversations: "المحادثات الأخيرة",
    searchChats: "البحث في المحادثات...",
    today: "اليوم",
    yesterday: "أمس",
    previous7Days: "السبعة أيام الماضية",
    olderHistory: "سجل أقدم",
    clearHistory: "مسح كل السجل",
    
    hello: "مرحباً",
    askPlaceholder: "اسأل ExeChat أي شيء...",
    generatingResponse: "جاري إنشاء الإجابة...",
    uploadFile: "رفع ملف",
    topic: "الموضوع",
    model: "النموذج",
    usingModelInfo: "استخدام النموذج {model} في موضوع {preset}.",
    
    tabAccountName: "ملف الحساب والحالة",
    tabAccountDesc: "عرض تسجيل الدخول واسم المستخدم",
    tabModelName: "محرك النموذج والشخصيات",
    tabModelDesc: "اختر محركات الذكاء الاصطناعي",
    tabTampilanName: "جماليات العرض والأصوات",
    tabTampilanDesc: "تكوين الأوضاع البصرية والملاحظات",
    tabIngatanName: "الذاكرة المعرفية الدائمة",
    tabIngatanDesc: "حقن حقائق دائمة قابلة للتخصيص",
    tabFeedbackName: "إرسال الملاحظات والملفات",
    tabFeedbackDesc: "إبلاغ عن المشكلات أو الاقتراحات",
    
    accountHeader: "ملف الحساب وحالة الدخول",
    accountSubheader: "التحقق من حالة الحساب وتخصيص اسم الترحيب.",
    activeConnection: "اتصال آمن نشط",
    offlineMode: "وضع التخزين المحلي",
    signOut: "تسجيل الخروج",
    nicknameHeader: "تخصيص اسم الترحيب بالذكاء الاصطناعي",
    nicknameSubheader: "حدد اسماً فريداً يستخدمه المساعد أثناء المحادثات.",
    enterCustomName: "أدخل الاسم...",
    saveNickname: "حفظ الاسم",
    prefLangHeader: "اللغة المعرفية المفضلة",
    prefLangSubheader: "اختر لغتك المفضلة. سيعطي النظام وإجابات الذكاء الاصطناعي الأولوية لهذا الخيار.",
    
    modelHeader: "محرك الذكاء الاصطناعي والمواضيع",
    modelSubheader: "تبديل محركات التفكير والمواضيع للحصول على سلوك مخصص.",
    availEngines: "محركات LLM المتاحة",
    tempPresetHeader: "درجة الحرارة (مستوى الإبداع)",
    tempPresetSubheader: "تؤثر درجة الحرارة على إبداع واستقرار الإجابات.",
    activeTemp: "الحرارة الحالية",
    consistent: "مستقر (0.10)",
    creative: "مبدع (1.00)",
    specializedTopics: "المواضيع المتخصصة",
    
    displayHeader: "جماليات العرض والسمات",
    displaySubheader: "تخصيص ألوان النظام والأصوات والمظهر.",
    selectStyleTheme: "اختر سمة المظهر",
    systemSync: "مزامنة النظام",
    systemSyncDesc: "متابعة إعدادات الجهاز",
    slateDark: "داكن مريح",
    slateDarkDesc: "لون داكن مريح للعينين",
    pureLight: "فاتح ناصع",
    pureLightDesc: "تباين عالٍ وواضح",
    chatHistorySettings: "إعدادات سجل المحادثات",
    toggleYesterdayDesc: "إظهار أو إخفاء محادثات الأمس والمحادثات القديمة.",
    acousticAudioHeader: "الملاحظات الصوتية",
    acousticAudioDesc: "سيعزف ExeChat صوتاً هادئاً عند اكتمال الإجابة.",
    
    memoryHeader: "تفضيلات الذاكرة",
    memorySubheader: "امنح ExeChat حقائق خلفية دائمة لتذكرها دائماً.",
    injectMemory: "إضافة تفضيل ذاكرة (الحد الأقصى 5)",
    memoryPlaceholder: "مثال: أفضّل الكود المكتوب بأسلوب React TSX...",
    maxMemoryReached: "تم الوصول إلى الحد الأقصى (5 تفضيلات)",
    saveMemory: "حفظ الذاكرة",
    noMemories: "لم يتم تكوين ذاكرة دائمة بعد.",
    
    feedbackHeader: "إرسال الملاحظات والملفات",
    feedbackSubheader: "شارك اقتراحاتك أو أبلغ عن مشكلة مباشرة إلى Hexky.",
    selectCategory: "الفئة",
    catSuggestion: "اقتراح",
    catBug: "تقرير عن خطأ",
    catFeature: "طلب ميزة",
    catOther: "آخر",
    feedbackPlaceholder: "اشرح مشكلتك أو اقتراحك بالتفصيل...",
    attachFile: "إرفاق صورة / ملف (اختياري)",
    sendFeedback: "إرسال الملاحظات",
    feedbackSent: "تم إرسال الملاحظات بنجاح! شكراً لك.",
    
    selectModel: "اختر نموذج الذكاء الاصطناعي",
    selectTopic: "اختر الموضوع",
    chooseModelDesc: "اختر نموذج الذكاء الاصطناعي المناسب لاحتياجاتك.",
    chooseTopicDesc: "اختر موضوعاً متخصصاً لتركيز خبرة المساعد.",
    cancel: "إلغاء",
    close: "إغلاق",
    selected: "محدد",
    compatible: "متوافق",
    active: "نشط",
    
    workspaceTitle: "محطة عمل ExeCode للذكاء الاصطناعي",
    livePreview: "معاينة مباشرة",
    aiAssistant: "مساعد الذكاء الاصطناعي",
    files: "الملفات",
    downloadZip: "تنزيل ZIP",
    saveProject: "حفظ المشروع"
  },

  ja: {
    newChat: "新しいチャット",
    workstation: "ExeCode ワークステーション",
    settings: "設定",
    recentConversations: "最近の会話",
    searchChats: "チャットを検索...",
    today: "今日",
    yesterday: "昨日",
    previous7Days: "過去7日間",
    olderHistory: "以前の履歴",
    clearHistory: "すべての履歴を消去",
    
    hello: "こんにちは",
    askPlaceholder: "ExeChatになんでも質問...",
    generatingResponse: "回答を生成中...",
    uploadFile: "ファイルをアップロード",
    topic: "トピック",
    model: "モデル",
    usingModelInfo: "{preset} トピックでモデル {model} を使用中。",
    
    tabAccountName: "アカウントとステータス",
    tabAccountDesc: "Googleログインとユーザー名",
    tabModelName: "モデルエンジンと性格",
    tabModelDesc: "高速/強力なAIエンジンの選択",
    tabTampilanName: "表示デザインと効果音",
    tabTampilanDesc: "ビジュアルモードとサウンド設定",
    tabIngatanName: "永続的認知メモリ",
    tabIngatanDesc: "カスタマイズ可能な常時事実の注入",
    tabFeedbackName: "フィードバック送信",
    tabFeedbackDesc: "問題の報告や機能提案",
    
    accountHeader: "アカウントプロファイルとステータス",
    accountSubheader: "ログイン状態の確認とニックネームのカスタマイズ。",
    activeConnection: "アクティブな保護接続",
    offlineMode: "オフラインローカルストレージ",
    signOut: "サインアウト",
    nicknameHeader: "AIニックネームのパーソナライズ",
    nicknameSubheader: "会話中にアシスタントが使用する名前を設定します。",
    enterCustomName: "ニックネームを入力...",
    saveNickname: "ニックネームを保存",
    prefLangHeader: "優先言語設定",
    prefLangSubheader: "優先する言語を選択します。システムおよびAIの回答はこの選択を優先します。",
    
    modelHeader: "AIエンジンとトピック",
    modelSubheader: "ニーズに合わせてAI思考エンジンとトピックを切り替えます。",
    availEngines: "利用可能なLLMエンジン",
    tempPresetHeader: "温度設定 (創造性レベル)",
    tempPresetSubheader: "温度はモデルの回答の創造性と一貫性に影響します。",
    activeTemp: "現在の温度",
    consistent: "一貫性重視 (0.10)",
    creative: "創造性重視 (1.00)",
    specializedTopics: "専門トピックプリセット",
    
    displayHeader: "表示デザインとテーマ",
    displaySubheader: "レイアウト、システムカラー、効果音を設定します。",
    selectStyleTheme: "スタイルテーマを選択",
    systemSync: "システム同期",
    systemSyncDesc: "OS設定に従う",
    slateDark: "ダークモード",
    slateDarkDesc: "目に優しいダークカラー",
    pureLight: "ライトモード",
    pureLightDesc: "ハイコントラストなホワイト",
    chatHistorySettings: "チャット履歴設定",
    toggleYesterdayDesc: "サイドバーの履歴表示を切り替えます。",
    acousticAudioHeader: "効果音通知",
    acousticAudioDesc: "回答完了時に心地よい通知音を再生します。",
    
    memoryHeader: "AIメモリ設定",
    memorySubheader: "ExeChatに永久に記憶させたい背景情報を追加します。",
    injectMemory: "カスタムメモリを追加 (最大5個)",
    memoryPlaceholder: "例: React TSXスタイルのコードを好みます...",
    maxMemoryReached: "最大5個のメモリ上限に達しました",
    saveMemory: "メモリを保存",
    noMemories: "設定された永続メモリはまだありません。",
    
    feedbackHeader: "フィードバックとファイルの送信",
    feedbackSubheader: "ご意見やバグ報告をHexkyへ直接送信します。",
    selectCategory: "カテゴリ",
    catSuggestion: "提案",
    catBug: "バグ報告",
    catFeature: "機能要望",
    catOther: "その他",
    feedbackPlaceholder: "問題やご提案の詳細を記入してください...",
    attachFile: "スクリーンショット/ファイルを添付 (任意)",
    sendFeedback: "フィードバックを送信",
    feedbackSent: "フィードバックが送信されました！ご協力ありがとうございます。",
    
    selectModel: "AIモデルを選択",
    selectTopic: "トピックを選択",
    chooseModelDesc: "用途に合った最適なAIモデルを選択してください。",
    chooseTopicDesc: "専門領域に合わせたトピックを選択してください。",
    cancel: "キャンセル",
    close: "閉じる",
    selected: "選択済み",
    compatible: "互換あり",
    active: "アクティブ",
    
    workspaceTitle: "ExeCode Web AI ワークステーション",
    livePreview: "ライブプレビュー",
    aiAssistant: "AIアシスタント",
    files: "ファイル",
    downloadZip: "ZIPをダウンロード",
    saveProject: "プロジェクトを保存"
  },

  ko: {
    newChat: "새 채팅",
    workstation: "ExeCode 워크스테이션",
    settings: "설정",
    recentConversations: "최근 대화",
    searchChats: "채팅 검색...",
    today: "오늘",
    yesterday: "어제",
    previous7Days: "지난 7일",
    olderHistory: "이전 기록",
    clearHistory: "모든 기록 삭제",
    
    hello: "안녕하세요",
    askPlaceholder: "ExeChat에 무엇이든 물어보세요...",
    generatingResponse: "답변 생성 중...",
    uploadFile: "파일 업로드",
    topic: "주제",
    model: "모델",
    usingModelInfo: "{preset} 주제에서 {model} 모델을 사용 중입니다.",
    
    tabAccountName: "계정 프로필 및 상태",
    tabAccountDesc: "Google 로그인 및 사용자 이름",
    tabModelName: "모델 엔진 및 인격",
    tabModelDesc: "빠르고 강력한 AI 엔진 선택",
    tabTampilanName: "디스플레이 디자인 및 소리",
    tabTampilanDesc: "시각적 모드 및 피드백 설정",
    tabIngatanName: "영구 인지 메모리",
    tabIngatanDesc: "맞춤형 영구 사실 주입",
    tabFeedbackName: "피드백 제출",
    tabFeedbackDesc: "문제 보고 및 의견 제안",
    
    accountHeader: "계정 프로필 및 상태",
    accountSubheader: "로그인 상태를 확인하고 닉네임을 설정합니다.",
    activeConnection: "보안 연결 활성화됨",
    offlineMode: "오프라인 로컬 저장소 모드",
    signOut: "로그아웃",
    nicknameHeader: "AI 닉네임 설정",
    nicknameSubheader: "대화 중 어시스턴트가 부를 이름을 설정합니다.",
    enterCustomName: "닉네임 입력...",
    saveNickname: "닉네임 저장",
    prefLangHeader: "선호 언어 설정",
    prefLangSubheader: "선호하는 언어를 선택하세요. 시스템과 AI 답변이 이 언어를 우선시합니다.",
    
    modelHeader: "AI 엔진 및 주제",
    modelSubheader: "필요에 따라 AI 추론 엔진과 주제를 전환하세요.",
    availEngines: "사용 가능한 LLM 엔진",
    tempPresetHeader: "온도 설정 (창의성 수준)",
    tempPresetSubheader: "온도는 답변의 창의성과 일관성에 영향을 미칩니다.",
    activeTemp: "현재 온도",
    consistent: "일관성 (0.10)",
    creative: "창의적 (1.00)",
    specializedTopics: "전문 주제 프리셋",
    
    displayHeader: "디스플레이 디자인 및 테마",
    displaySubheader: "레이아웃, 시스템 색상 및 알림 소리를 설정합니다.",
    selectStyleTheme: "스타일 테마 선택",
    systemSync: "시스템 동기화",
    systemSyncDesc: "기기 설정 따르기",
    slateDark: "다크 모드",
    slateDarkDesc: "눈이 편안한 다크 테마",
    pureLight: "라이트 모드",
    pureLightDesc: "선명한 라이트 테마",
    chatHistorySettings: "채팅 기록 설정",
    toggleYesterdayDesc: "사이드바에 어제 및 이전 채팅 기록을 표시하거나 숨깁니다.",
    acousticAudioHeader: "알림 소리",
    acousticAudioDesc: "답변 생성이 완료되면 부드러운 알림 소리가 재생됩니다.",
    
    memoryHeader: "AI 메모리 설정",
    memorySubheader: "ExeChat이 항상 기억할 정보(직업, 코딩 스타일 등)를 추가하세요.",
    injectMemory: "맞춤 메모리 추가 (최대 5개)",
    memoryPlaceholder: "예: React TSX 스타일 코드를 선호합니다...",
    maxMemoryReached: "최대 5개 메모리 제한에 도달했습니다",
    saveMemory: "메모리 저장",
    noMemories: "설정된 영구 메모리가 없습니다.",
    
    feedbackHeader: "피드백 및 파일 제출",
    feedbackSubheader: "의견이나 버그 보고서를 Hexky에게 직접 전송하세요.",
    selectCategory: "카테고리",
    catSuggestion: "제안",
    catBug: "버그 보고",
    catFeature: "기능 요청",
    catOther: "기타",
    feedbackPlaceholder: "문제나 제안 내용을 자세히 설명해주세요...",
    attachFile: "스크린샷 / 파일 첨부 (선택)",
    sendFeedback: "피드백 전송",
    feedbackSent: "피드백이 성공적으로 전송되었습니다! 감사드립니다.",
    
    selectModel: "AI 모델 선택",
    selectTopic: "주제 선택",
    chooseModelDesc: "요구 사항에 가장 잘 맞는 AI 모델을 선택하세요.",
    chooseTopicDesc: "어시스턴트의 전문 분야를 설정할 주제를 선택하세요.",
    cancel: "취소",
    close: "닫기",
    selected: "선택됨",
    compatible: "호환됨",
    active: "활성",
    
    workspaceTitle: "ExeCode 웹 AI 워크스테이션",
    livePreview: "실시간 미리보기",
    aiAssistant: "AI 어시스턴트",
    files: "파일",
    downloadZip: "ZIP 다운로드",
    saveProject: "프로젝트 저장"
  },

  es: {
    newChat: "Nuevo chat",
    workstation: "Estación de trabajo ExeCode",
    settings: "Ajustes",
    recentConversations: "Conversaciones recientes",
    searchChats: "Buscar chats...",
    today: "Hoy",
    yesterday: "Ayer",
    previous7Days: "Últimos 7 días",
    olderHistory: "Historial anterior",
    clearHistory: "Borrar todo el historial",
    
    hello: "Hola",
    askPlaceholder: "Pregunta lo que sea a ExeChat...",
    generatingResponse: "Generando respuesta...",
    uploadFile: "Subir archivo",
    topic: "Tema",
    model: "Modelo",
    usingModelInfo: "Usando el modelo {model} en el tema {preset}.",
    
    tabAccountName: "Perfil de cuenta y estado",
    tabAccountDesc: "Ver inicio de sesión y usuario",
    tabModelName: "Motor del modelo y personalidades",
    tabModelDesc: "Seleccionar motores de IA",
    tabTampilanName: "Estética de pantalla y sonidos",
    tabTampilanDesc: "Configurar modo visual y sonidos",
    tabIngatanName: "Memoria cognitiva permanente",
    tabIngatanDesc: "Añadir datos permanentes personalizados",
    tabFeedbackName: "Enviar comentarios y archivos",
    tabFeedbackDesc: "Reportar problemas o sugerencias",
    
    accountHeader: "Perfil de cuenta y estado",
    accountSubheader: "Verifica el estado de tu cuenta y personaliza tu apodo.",
    activeConnection: "Conexión segura activa",
    offlineMode: "Modo de almacenamiento local offline",
    signOut: "Cerrar sesión",
    nicknameHeader: "Personalizar apodo para la IA",
    nicknameSubheader: "Elige un nombre que el asistente usará para dirigirse a ti.",
    enterCustomName: "Escribe tu apodo...",
    saveNickname: "Guardar apodo",
    prefLangHeader: "Idioma cognitivo preferido",
    prefLangSubheader: "Selecciona tu idioma preferido. El sistema y las respuestas de IA darán prioridad a esta elección.",
    
    modelHeader: "Motor de IA y temas",
    modelSubheader: "Cambia de motor y enfoque según tus necesidades.",
    availEngines: "Motores LLM disponibles",
    tempPresetHeader: "Temperatura (Nivel de creatividad)",
    tempPresetSubheader: "La temperatura influye en la creatividad y coherencia de las respuestas.",
    activeTemp: "Temp actual",
    consistent: "Consistente (0.10)",
    creative: "Creativo (1.00)",
    specializedTopics: "Temas especializados",
    
    displayHeader: "Estética de pantalla y temas",
    displaySubheader: "Personaliza el diseño, los colores del sistema y los efectos de sonido.",
    selectStyleTheme: "Seleccionar tema de estilo",
    systemSync: "Sincronizar sistema",
    systemSyncDesc: "Seguir la configuración del SO",
    slateDark: "Modo oscuro",
    slateDarkDesc: "Oscuro suave para la vista",
    pureLight: "Modo claro",
    pureLightDesc: "Blanco de alto contraste",
    chatHistorySettings: "Ajustes de historial de chat",
    toggleYesterdayDesc: "Mostrar u ocultar registros de chats antiguos en la barra lateral.",
    acousticAudioHeader: "Efectos de sonido",
    acousticAudioDesc: "ExeChat reproducirá un sonido suave cuando termine de responder.",
    
    memoryHeader: "Preferencias de memoria IA",
    memorySubheader: "Añade datos permanentes para que la IA los recuerde siempre.",
    injectMemory: "Añadir memoria personalizada (Máx. 5)",
    memoryPlaceholder: "Ejemplo: Prefiero código escrito en estilo React TSX...",
    maxMemoryReached: "Límite máximo de 5 memorias alcanzado",
    saveMemory: "Guardar memoria",
    noMemories: "Aún no hay memorias permanentes configuradas.",
    
    feedbackHeader: "Enviar comentarios y archivos",
    feedbackSubheader: "Comparte tus sugerencias o reporta problemas directamente a Hexky.",
    selectCategory: "Categoría",
    catSuggestion: "Sugerencia",
    catBug: "Reporte de error",
    catFeature: "Solicitud de función",
    catOther: "Otro",
    feedbackPlaceholder: "Describe tu problema o sugerencia en detalle...",
    attachFile: "Adjuntar captura / archivo (Opcional)",
    sendFeedback: "Enviar comentario",
    feedbackSent: "¡Comentario enviado con éxito! Gracias por tu ayuda.",
    
    selectModel: "Seleccionar modelo de IA",
    selectTopic: "Seleccionar tema",
    chooseModelDesc: "Elige el modelo que mejor se adapte a tus necesidades.",
    chooseTopicDesc: "Selecciona un tema especializado para enfocar al asistente.",
    cancel: "Cancelar",
    close: "Cerrar",
    selected: "Seleccionado",
    compatible: "Compatible",
    active: "Activo",
    
    workspaceTitle: "Estación de trabajo Web AI ExeCode",
    livePreview: "Vista previa en vivo",
    aiAssistant: "Asistente de IA",
    files: "Archivos",
    downloadZip: "Descargar ZIP",
    saveProject: "Guardar proyecto"
  },

  zh: {
    newChat: "新建对话",
    workstation: "ExeCode 工作站",
    settings: "设置",
    recentConversations: "最近对话",
    searchChats: "搜索对话...",
    today: "今天",
    yesterday: "昨天",
    previous7Days: "过去7天",
    olderHistory: "更早的记录",
    clearHistory: "清除所有历史",
    
    hello: "你好",
    askPlaceholder: "向 ExeChat 提问任何问题...",
    generatingResponse: "正在生成回答...",
    uploadFile: "上传文件",
    topic: "主题",
    model: "模型",
    usingModelInfo: "在 {preset} 主题上使用 {model} 模型。",
    
    tabAccountName: "账户资料与状态",
    tabAccountDesc: "查看 Google 登录和用户名",
    tabModelName: "模型引擎与 AI 性格",
    tabModelDesc: "选择快速/强大的 AI 引擎",
    tabTampilanName: "外观主题与音效",
    tabTampilanDesc: "配置视觉模式和声音",
    tabIngatanName: "持久认知记忆",
    tabIngatanDesc: "注入可自定义的永久背景",
    tabFeedbackName: "提交反馈与文件",
    tabFeedbackDesc: "向 Hexky 报告问题或建议",
    
    accountHeader: "账户资料与状态",
    accountSubheader: "验证登录状态并自定义问候昵称。",
    activeConnection: "安全连接已激活",
    offlineMode: "离线本地存储模式",
    signOut: "退出登录",
    nicknameHeader: "个性化 AI 问候昵称",
    nicknameSubheader: "设置 AI 助手在私聊时使用的专属称呼。",
    enterCustomName: "输入昵称...",
    saveNickname: "保存昵称",
    prefLangHeader: "偏好认知语言",
    prefLangSubheader: "选择您的偏好语言。系统和 AI 回答将优先使用此选择。",
    
    modelHeader: "AI 引擎与主题",
    modelSubheader: "切换 AI 推理引擎和专注主题，以获得定制化行为。",
    availEngines: "可用的 LLM 引擎",
    tempPresetHeader: "预设温度 (创造力水平)",
    tempPresetSubheader: "温度会影响模型回答的创造力和一致性。",
    activeTemp: "当前温度",
    consistent: "严谨一致 (0.10)",
    creative: "富有创意 (1.00)",
    specializedTopics: "专业主题预设",
    
    displayHeader: "外观主题与界面",
    displaySubheader: "自定义布局、系统颜色和通知音效。",
    selectStyleTheme: "选择样式主题",
    systemSync: "跟随系统",
    systemSyncDesc: "跟从操作系统设置",
    slateDark: "深色模式",
    slateDarkDesc: "护眼深色调",
    pureLight: "浅色模式",
    pureLightDesc: "高对比度纯白",
    chatHistorySettings: "对话历史设置",
    toggleYesterdayDesc: "在侧边栏显示或隐藏昨天及更早的对话记录。",
    acousticAudioHeader: "声音反馈",
    acousticAudioDesc: "当回答生成完成时，ExeChat 将播放柔和的提示音。",
    
    memoryHeader: "AI 记忆设置",
    memorySubheader: "为 ExeChat 添加永久背景信息（如职业、代码偏好）。",
    injectMemory: "添加自定义记忆（最多5条）",
    memoryPlaceholder: "例如：我喜欢 React TSX 风格的代码...",
    maxMemoryReached: "已达到最多 5 条记忆限制",
    saveMemory: "保存记忆",
    noMemories: "尚未配置永久记忆。",
    
    feedbackHeader: "提交反馈与文件",
    feedbackSubheader: "直接向 Hexky 分享您的建议或报告问题。",
    selectCategory: "类别",
    catSuggestion: "建议",
    catBug: "错误报告",
    catFeature: "功能需求",
    catOther: "其他",
    feedbackPlaceholder: "请详细描述您的问题或建议...",
    attachFile: "附加截图 / 文件 (可选)",
    sendFeedback: "发送反馈",
    feedbackSent: "反馈提交成功！感谢您的支持。",
    
    selectModel: "选择 AI 模型",
    selectTopic: "选择主题",
    chooseModelDesc: "选择最适合您需求的 AI 模型。",
    chooseTopicDesc: "选择专业主题以聚焦 AI 助手的能力。",
    cancel: "取消",
    close: "关闭",
    selected: "已选择",
    compatible: "兼容",
    active: "当前激活",
    
    workspaceTitle: "ExeCode Web AI 工作站",
    livePreview: "实时预览",
    aiAssistant: "AI 助手",
    files: "文件",
    downloadZip: "下载 ZIP",
    saveProject: "保存项目"
  },

  fr: {
    newChat: "Nouvelle discussion",
    workstation: "Poste de travail ExeCode",
    settings: "Paramètres",
    recentConversations: "Conversations récentes",
    searchChats: "Rechercher des chats...",
    today: "Aujourd'hui",
    yesterday: "Hier",
    previous7Days: "7 derniers jours",
    olderHistory: "Historique plus ancien",
    clearHistory: "Effacer tout l'historique",
    
    hello: "Bonjour",
    askPlaceholder: "Posez n'importe quelle question à ExeChat...",
    generatingResponse: "Génération de la réponse...",
    uploadFile: "Téléverser un fichier",
    topic: "Sujet",
    model: "Modèle",
    usingModelInfo: "Utilisation du modèle {model} sur le sujet {preset}.",
    
    tabAccountName: "Profil de compte et statut",
    tabAccountDesc: "Voir la connexion Google et le pseudo",
    tabModelName: "Moteur de modèle et personnalités",
    tabModelDesc: "Sélectionner des moteurs d'IA",
    tabTampilanName: "Esthétique d'affichage et sons",
    tabTampilanDesc: "Configurer les modes visuels et sons",
    tabIngatanName: "Mémoire cognitive permanente",
    tabIngatanDesc: "Injecter des faits permanents",
    tabFeedbackName: "Envoyer des commentaires et fichiers",
    tabFeedbackDesc: "Signaler des problèmes ou suggestions",
    
    accountHeader: "Profil de compte & statut",
    accountSubheader: "Vérifiez le statut de votre compte et personnalisez votre pseudo.",
    activeConnection: "Connexion sécurisée active",
    offlineMode: "Mode de stockage local hors ligne",
    signOut: "Se déconnecter",
    nicknameHeader: "Personnaliser le pseudo IA",
    nicknameSubheader: "Définissez un nom unique que l'assistant utilisera avec vous.",
    enterCustomName: "Entrez un pseudo...",
    saveNickname: "Enregistrer le pseudo",
    prefLangHeader: "Langue cognitive préférée",
    prefLangSubheader: "Choisissez votre langue préférée. Le système et l'IA prioriseront ce choix.",
    
    modelHeader: "Moteur d'IA & sujets",
    modelSubheader: "Changez de moteur et de sujet selon vos besoins.",
    availEngines: "Moteurs LLM disponibles",
    tempPresetHeader: "Température (Niveau de créativité)",
    tempPresetSubheader: "La température influe sur la créativité et la cohérence des réponses.",
    activeTemp: "Temp. active",
    consistent: "Consistant (0.10)",
    creative: "Créatif (1.00)",
    specializedTopics: "Sujets spécialisés",
    
    displayHeader: "Esthétique d'affichage & thèmes",
    displaySubheader: "Personnalisez l'affichage, les couleurs du système et les effets sonores.",
    selectStyleTheme: "Sélectionner le thème",
    systemSync: "Synchro système",
    systemSyncDesc: "Suivre la configuration de l'OS",
    slateDark: "Mode sombre",
    slateDarkDesc: "Sombre doux pour les yeux",
    pureLight: "Mode clair",
    pureLightDesc: "Blanc pur haut contraste",
    chatHistorySettings: "Paramètres de l'historique",
    toggleYesterdayDesc: "Afficher ou masquer les discussions anciennes dans la barre latérale.",
    acousticAudioHeader: "Effets sonores",
    acousticAudioDesc: "ExeChat jouera un son doux lorsque la réponse sera terminée.",
    
    memoryHeader: "Préférences de mémoire IA",
    memorySubheader: "Ajoutez des informations permanentes que l'IA retiendra toujours.",
    injectMemory: "Ajouter une mémoire (Max 5)",
    memoryPlaceholder: "Exemple: Je préfère le code écrit en style React TSX...",
    maxMemoryReached: "Limite maximale de 5 mémoires atteinte",
    saveMemory: "Enregistrer la mémoire",
    noMemories: "Aucune mémoire permanente configurée.",
    
    feedbackHeader: "Envoyer des commentaires & fichiers",
    feedbackSubheader: "Partagez vos suggestions ou signalez un problème directement à Hexky.",
    selectCategory: "Catégorie",
    catSuggestion: "Suggestion",
    catBug: "Rapport de bug",
    catFeature: "Demande de fonctionnalité",
    catOther: "Autre",
    feedbackPlaceholder: "Décrivez votre problème ou suggestion en détail...",
    attachFile: "Joindre une capture / un fichier (Optionnel)",
    sendFeedback: "Envoyer le commentaire",
    feedbackSent: "Commentaire envoyé avec succès ! Merci.",
    
    selectModel: "Sélectionner le modèle IA",
    selectTopic: "Sélectionner le sujet",
    chooseModelDesc: "Choisissez le modèle d'IA adapté à vos besoins.",
    chooseTopicDesc: "Sélectionnez un sujet spécialisé pour orienter l'assistant.",
    cancel: "Annuler",
    close: "Fermer",
    selected: "Sélectionné",
    compatible: "Compatible",
    active: "Actif",
    
    workspaceTitle: "Poste de travail Web AI ExeCode",
    livePreview: "Aperçu en direct",
    aiAssistant: "Assistant IA",
    files: "Fichiers",
    downloadZip: "Télécharger ZIP",
    saveProject: "Enregistrer le projet"
  },

  de: {
    newChat: "Neuer Chat",
    workstation: "ExeCode Arbeitsbereich",
    settings: "Einstellungen",
    recentConversations: "Kürzliche Chats",
    searchChats: "Chats durchsuchen...",
    today: "Heute",
    yesterday: "Gestern",
    previous7Days: "Letzte 7 Tage",
    olderHistory: "Älterer Verlauf",
    clearHistory: "Gesamten Verlauf löschen",
    
    hello: "Hallo",
    askPlaceholder: "Frage ExeChat irgendetwas...",
    generatingResponse: "Antwort wird generiert...",
    uploadFile: "Datei hochladen",
    topic: "Thema",
    model: "Modell",
    usingModelInfo: "Verwende Modell {model} zum Thema {preset}.",
    
    tabAccountName: "Konto & Status",
    tabAccountDesc: "Google-Logins & Benutzernamen",
    tabModelName: "Modell-Engine & Persönlichkeiten",
    tabModelDesc: "Schnelle/starke AI-Engines wählen",
    tabTampilanName: "Anzeige-Ästhetik & Töne",
    tabTampilanDesc: "Visuelle Modi & Sound-Feedback",
    tabIngatanName: "Dauerhafter kognitiver Speicher",
    tabIngatanDesc: "Dauerhafte Fakten hinzufügen",
    tabFeedbackName: "Feedback & Dateien senden",
    tabFeedbackDesc: "Probleme oder Vorschläge melden",
    
    accountHeader: "Kontoprofil & Status",
    accountSubheader: "Überprüfe deinen Loginstatus und passe deinen Spitznamen an.",
    activeConnection: "Aktive sichere Verbindung",
    offlineMode: "Lokaler Offline-Speichermodus",
    signOut: "Abmelden",
    nicknameHeader: "AI-Spitznamen personalisieren",
    nicknameSubheader: "Setze einen eindeutigen Namen, den der Assistent verwenden soll.",
    enterCustomName: "Spitznamen eingeben...",
    saveNickname: "Spitznamen speichern",
    prefLangHeader: "Bevorzugte kognitive Sprache",
    prefLangSubheader: "Wähle deine bevorzugte Sprache. System und KI-Antworten bevorzugen diese Wahl.",
    
    modelHeader: "KI-Engine & Themen",
    modelSubheader: "Wechsle Denkmodelle und Themen nach deinen Bedürfnissen.",
    availEngines: "Verfügbare LLM-Engines",
    tempPresetHeader: "Temperatur (Kreativitätsstufe)",
    tempPresetSubheader: "Die Temperatur beeinflusst Kreativität und Konsistenz der Antworten.",
    activeTemp: "Aktive Temp",
    consistent: "Konsistent (0.10)",
    creative: "Kreativ (1.00)",
    specializedTopics: "Spezialisierte Themen",
    
    displayHeader: "Anzeige-Ästhetik & Designs",
    displaySubheader: "Passe Layout, Systemfarben und Töne an.",
    selectStyleTheme: "Design wählen",
    systemSync: "Systemsynchron",
    systemSyncDesc: "Betriebssystem-Einstellungen folgen",
    slateDark: "Dunkelmodus",
    slateDarkDesc: "Augenschonendes Dunkelgrau",
    pureLight: "Hellmodus",
    pureLightDesc: "Kontrastreiches Weiß",
    chatHistorySettings: "Verlaufseinstellungen",
    toggleYesterdayDesc: "Ältere Chats in der Seitenleiste ein- oder ausblenden.",
    acousticAudioHeader: "Audio-Feedback",
    acousticAudioDesc: "ExeChat spielt einen sanften Ton ab, wenn die Antwort fertig ist.",
    
    memoryHeader: "KI-Speichereinstellungen",
    memorySubheader: "Füge dauerhafte Fakten hinzu, an die sich die KI erinnern soll.",
    injectMemory: "Benutzerdefinierten Speicher hinzufügen (Max 5)",
    memoryPlaceholder: "Beispiel: Ich bevorzuge Code im React TSX-Stil...",
    maxMemoryReached: "Maximales Limit von 5 Einträgen erreicht",
    saveMemory: "Speicher sichern",
    noMemories: "Noch kein dauerhafter Speicher eingerichtet.",
    
    feedbackHeader: "Feedback & Dateien senden",
    feedbackSubheader: "Teile Vorschläge oder melde Probleme direkt an Hexky.",
    selectCategory: "Kategorie",
    catSuggestion: "Vorschlag",
    catBug: "Fehlerbericht",
    catFeature: "Funktionswunsch",
    catOther: "Sonstiges",
    feedbackPlaceholder: "Beschreibe dein Problem oder deinen Vorschlag im Detail...",
    attachFile: "Screenshot / Datei anfügen (Optional)",
    sendFeedback: "Feedback senden",
    feedbackSent: "Feedback erfolgreich gesendet! Vielen Dank.",
    
    selectModel: "KI-Modell wählen",
    selectTopic: "Thema wählen",
    chooseModelDesc: "Wähle das Modell, das am besten zu deinen Anforderungen passt.",
    chooseTopicDesc: "Wähle ein Spezialthema, um die Expertise des Assistenten zu fokussieren.",
    cancel: "Abbrechen",
    close: "Schließen",
    selected: "Ausgewählt",
    compatible: "Kompatibel",
    active: "Aktiv",
    
    workspaceTitle: "ExeCode Web AI Arbeitsbereich",
    livePreview: "Live-Vorschau",
    aiAssistant: "KI-Assistent",
    files: "Dateien",
    downloadZip: "ZIP herunterladen",
    saveProject: "Projekt speichern"
  }
};

export function getTranslation(
  key: keyof TranslationDict,
  langCode: string = "en",
  params?: Record<string, string>
): string {
  const dict = translations[langCode] || translations.en;
  let text = dict[key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }

  return text;
}
