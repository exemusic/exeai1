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
  rename?: string;
  delete?: string;
  seeAll?: string;
  options?: string;
  expandSidebar?: string;
  closeSidebar?: string;
  closeHistory?: string;
  noSearchResults?: string;
  noChatHistory?: string;
  connectingToExeChat?: string;
  verifyingSecureSession?: string;
  welcomeSignInPrompt?: string;
  chatSessionsSavedPrivately?: string;
  removeAttachment?: string;
  finalStep?: string;
  whatIsYourName?: string;
  chooseNicknameDesc?: string;
  nicknameLabel?: string;
  exampleNamePlaceholder?: string;
  saveAndContinue?: string;
  skipGoogleName?: string;
  deleteWarning?: string;
  confirmClearTitle?: string;
  confirmClearDesc?: string;
  clearChat?: string;
  searchConversationsPlaceholder?: string;
  noConversationsFound?: string;
  noConversationsFoundFor?: string;
  matchingConversations?: string;
  clickToJump?: string;
  clickToJumpConversation?: string;
  pressEscToClose?: string;
  cookieNotificationTitle?: string;
  cookieNotificationDesc?: string;
  cookieTitle?: string;
  cookieNoticeText?: string;
  storageDetailsTitle?: string;
  ourStorageDetails?: string;
  essentialRequired?: string;
  essentialDesc?: string;
  essentialStorageDesc?: string;
  preferencesOptional?: string;
  preferencesDesc?: string;
  preferencesStorageDesc?: string;
  privacyRespectNotice?: string;
  privacyRespect?: string;
  hideDetails?: string;
  learnDetails?: string;
  reject?: string;
  accept?: string;
  exeChatDisclaimer?: string;
  
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
    
    tabAccountName: "Account & Profile",
    tabAccountDesc: "Nickname, email, and language",
    tabModelName: "AI Model & Temperature",
    tabModelDesc: "Select active model and creativity preset",
    tabTampilanName: "Theme & Display",
    tabTampilanDesc: "Dark/light mode and chat history",
    tabIngatanName: "AI Memory",
    tabIngatanDesc: "Set persistent background memory",
    tabFeedbackName: "Help & Feedback",
    tabFeedbackDesc: "Submit suggestions and bug reports",
    
    accountHeader: "Account Settings",
    accountSubheader: "Manage your profile, nickname, and language preferences.",
    activeConnection: "Active Session",
    offlineMode: "Guest Mode",
    signOut: "Sign Out",
    nicknameHeader: "Nickname Settings",
    nicknameSubheader: "Set your preferred name used by the assistant to greet you.",
    enterCustomName: "Enter nickname...",
    saveNickname: "Save Nickname",
    prefLangHeader: "Interface Language",
    prefLangSubheader: "Choose your preferred language for the interface and responses.",
    
    modelHeader: "AI Model & Temperature",
    modelSubheader: "Select your active AI model and adjust response creativity.",
    availEngines: "Available Models",
    tempPresetHeader: "Temperature Preset",
    tempPresetSubheader: "Controls the creativity and consistency of responses.",
    activeTemp: "Active Temp",
    consistent: "Precise (0.10)",
    creative: "Creative (1.00)",
    specializedTopics: "Topics",
    
    displayHeader: "Theme & Display",
    displaySubheader: "Customize appearance and chat history settings.",
    selectStyleTheme: "Theme Mode",
    systemSync: "System",
    systemSyncDesc: "Follow system settings",
    slateDark: "Dark Mode",
    slateDarkDesc: "Comfortable dark theme",
    pureLight: "Light Mode",
    pureLightDesc: "Clean light theme",
    chatHistorySettings: "Chat History Visibility",
    toggleYesterdayDesc: "Show or hide earlier chat history in the sidebar.",
    acousticAudioHeader: "Completion Sound",
    acousticAudioDesc: "Play a subtle chime when the AI finishes generating.",
    
    memoryHeader: "AI Memory",
    memorySubheader: "Save background context so the AI remembers your key preferences.",
    injectMemory: "Add preference (Max 5)",
    memoryPlaceholder: "e.g. I prefer clean TypeScript code examples...",
    maxMemoryReached: "Maximum limit of 5 memory items reached",
    saveMemory: "Save",
    noMemories: "No saved memories yet.",
    
    feedbackHeader: "Help & Feedback",
    feedbackSubheader: "Send suggestions or report bugs directly to support.",
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
    searchConversationsPlaceholder: "Search for conversations...",
    noConversationsFound: 'No conversations found for "{query}"',
    noConversationsFoundFor: 'No conversations found for "{query}"',
    matchingConversations: "Matching Conversations",
    clickToJump: "Click on a conversation to jump to it",
    clickToJumpConversation: "Click on a conversation to jump to it",
    pressEscToClose: "Press ESC to close",
    cookieNotificationTitle: "Cookie & Storage Notification",
    cookieNotificationDesc: "ExeChat uses cookies and local storage (localStorage) to remember your chat sessions, theme settings, and Google login verification to function optimally and securely.",
    cookieTitle: "Cookie & Storage Notification",
    cookieNoticeText: "ExeChat uses cookies and local storage (localStorage) to remember your chat sessions, theme settings, and Google login verification to function optimally and securely.",
    storageDetailsTitle: "Our Storage Details:",
    ourStorageDetails: "Our Storage Details:",
    essentialRequired: "Essential (Required)",
    essentialDesc: "Stores your chat session IDs, Google login status, and the API keys needed to interact with the AI.",
    essentialStorageDesc: "Essential (Required): Stores your chat session IDs, Google login status, and the API keys needed to interact with the AI.",
    preferencesOptional: "Preferences (Optional)",
    preferencesDesc: "Stores your theme choices (Dark/Light), assistant characters/presets, and nickname memory preferences.",
    preferencesStorageDesc: "Preferences (Optional): Stores your theme choices (Dark/Light), assistant characters/presets, and nickname memory preferences.",
    privacyRespectNotice: "We fully respect your privacy. All your chat data is stored locally on your own device.",
    privacyRespect: "We fully respect your privacy. All your chat data is stored locally on your own device.",
    hideDetails: "Hide Details",
    learnDetails: "Learn Details",
    reject: "Reject",
    accept: "Accept",
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
    
    tabAccountName: "Akun & Profil",
    tabAccountDesc: "Nama panggilan, email, dan bahasa",
    tabModelName: "Model AI & Suhu",
    tabModelDesc: "Pilih model aktif dan tingkat kreativitas",
    tabTampilanName: "Tema & Tampilan",
    tabTampilanDesc: "Mode terang/gelap dan riwayat chat",
    tabIngatanName: "Memori AI",
    tabIngatanDesc: "Simpan konteks preferensi pengguna",
    tabFeedbackName: "Bantuan & Masukan",
    tabFeedbackDesc: "Kirim saran dan laporan kendala",
    
    accountHeader: "Pengaturan Akun",
    accountSubheader: "Kelola profil, nama panggilan, dan preferensi bahasa Anda.",
    activeConnection: "Sesi Aktif",
    offlineMode: "Mode Tamu",
    signOut: "Keluar",
    nicknameHeader: "Nama Panggilan",
    nicknameSubheader: "Atur nama panggilan yang digunakan asisten AI untuk menyapa Anda.",
    enterCustomName: "Ketik nama panggilan...",
    saveNickname: "Simpan Nama Panggilan",
    prefLangHeader: "Bahasa Antarmuka",
    prefLangSubheader: "Pilih bahasa favorit Anda untuk antarmuka dan respon AI.",
    
    modelHeader: "Model AI & Suhu Kreativitas",
    modelSubheader: "Pilih model AI aktif dan atur tingkat kreativitas respon.",
    availEngines: "Model Yang Tersedia",
    tempPresetHeader: "Suhu Kreativitas",
    tempPresetSubheader: "Mengatur tingkat kreativitas dan konsistensi respon.",
    activeTemp: "Suhu Aktif",
    consistent: "Presisi (0.10)",
    creative: "Kreatif (1.00)",
    specializedTopics: "Topik",
    
    displayHeader: "Tema & Tampilan",
    displaySubheader: "Atur mode tampilan dan visibilitas riwayat percakapan.",
    selectStyleTheme: "Mode Tema",
    systemSync: "Ikuti Sistem",
    systemSyncDesc: "Mengikuti pengaturan perangkat",
    slateDark: "Mode Gelap",
    slateDarkDesc: "Warna gelap nyaman untuk mata",
    pureLight: "Mode Terang",
    pureLightDesc: "Warna terang kontras tinggi",
    chatHistorySettings: "Tampilan Riwayat Chat",
    toggleYesterdayDesc: "Tampilkan atau sembunyikan riwayat percakapan sebelumnya di sidebar.",
    acousticAudioHeader: "Suara Pemberitahuan",
    acousticAudioDesc: "Memainkan suara lembut saat balasan selesai dibuat.",
    
    memoryHeader: "Memori AI",
    memorySubheader: "Simpan konteks penting agar AI selalu mengingat preferensi Anda.",
    injectMemory: "Tambah preferensi (Maksimal 5)",
    memoryPlaceholder: "Contoh: Saya lebih menyukai contoh kode TypeScript...",
    maxMemoryReached: "Batas maksimum 5 memori telah tercapai",
    saveMemory: "Simpan",
    noMemories: "Belum ada memori tersimpan.",
    
    feedbackHeader: "Bantuan & Masukan",
    feedbackSubheader: "Kirimkan saran atau laporkan kendala aplikasi.",
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
    searchConversationsPlaceholder: "Cari percakapan...",
    noConversationsFound: 'Tidak ada percakapan ditemukan untuk "{query}"',
    noConversationsFoundFor: 'Tidak ada percakapan ditemukan untuk "{query}"',
    matchingConversations: "Percakapan Cocok",
    clickToJump: "Klik pada percakapan untuk langsung membukanya",
    clickToJumpConversation: "Klik pada percakapan untuk langsung membukanya",
    pressEscToClose: "Tekan ESC untuk menutup",
    cookieNotificationTitle: "Pemberitahuan Cookie & Penyimpanan",
    cookieNotificationDesc: "ExeChat menggunakan cookie dan penyimpanan lokal (localStorage) untuk mengingat sesi chat, pengaturan tema, dan verifikasi login Google agar berfungsi secara optimal dan aman.",
    cookieTitle: "Pemberitahuan Cookie & Penyimpanan",
    cookieNoticeText: "ExeChat menggunakan cookie dan penyimpanan lokal (localStorage) untuk mengingat sesi chat, pengaturan tema, dan verifikasi login Google agar berfungsi secara optimal dan aman.",
    storageDetailsTitle: "Rincian Penyimpanan Kami:",
    ourStorageDetails: "Rincian Penyimpanan Kami:",
    essentialRequired: "Penting (Wajib)",
    essentialDesc: "Menyimpan ID sesi chat, status login Google, dan kunci API untuk berinteraksi dengan AI.",
    essentialStorageDesc: "Penting (Wajib): Menyimpan ID sesi chat, status login Google, dan kunci API untuk berinteraksi dengan AI.",
    preferencesOptional: "Preferensi (Opsional)",
    preferencesDesc: "Menyimpan pilihan tema (Gelap/Terang), preset asisten, dan preferensi memori nama panggilan.",
    preferencesStorageDesc: "Preferensi (Opsional): Menyimpan pilihan tema (Gelap/Terang), preset asisten, dan preferensi memori nama panggilan.",
    privacyRespectNotice: "Kami sepenuhnya menghormati privasi Anda. Semua data percakapan Anda disimpan secara lokal di perangkat Anda sendiri.",
    privacyRespect: "Kami sepenuhnya menghormati privasi Anda. Semua data percakapan Anda disimpan secara lokal di perangkat Anda sendiri.",
    hideDetails: "Sembunyikan Rincian",
    learnDetails: "Pelajari Rincian",
    reject: "Tolak",
    accept: "Terima",
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

// Copy that is shared by cards, popups, and the ExeCode workspace.  Keeping it
// here prevents a language selector from falling back to English in a nested UI.
const extraTranslations: Record<string, Record<string, string>> = {
  en: {
    scrollToBottom: "Scroll to bottom",
    thoughtFor: "Thought for {duration}s", processingReasoning: "Processing reasoning...", noResponseGenerated: "No text response was generated. Please try resending or rephrasing your message!", loadingModel: "Loading model {model}...", thinking: "Thinking...", ttsSpeaking: "Voice is speaking...", textRead: "Text read", selectAiModel: "Select AI Model", sendMessage: "Send message", switchAiModel: "Switch AI model",
    appPreferences: "App Preferences", accountAppPreferences: "Account & app preferences", membershipStatus: "Membership Status", connectedViaGoogle: "Connected via Google", connectedAsGuest: "Connected as guest", offlineSession: "Offline session", guestProfile: "Guest Profile", closeSettings: "Close settings", backToSettings: "Back to settings", settingsMenu: "Settings menu",
    helpImprove: "Help us improve ExeAi", whyUnhelpful: "Why was this response unhelpful?", thankFeedback: "Thank you for your feedback!", inaccurate: "Inaccurate / Hallucination", incorrectFormat: "Incorrect code or format", tooBrief: "Too brief / Ignored instructions", slowChat: "Slow chat / Stalled response", unclearExplanation: "Unclear explanation", addDetails: "Add specific details (optional)...", detailedReport: "Detailed report & files in Settings", skip: "Skip", submit: "Submit", dismiss: "Dismiss",
    manageProjects: "Manage projects (max. {max} per user)", realtimeSync: "Realtime sync", connecting: "Connecting...", preview: "Preview", code: "Code", desktopPreview: "Desktop preview", mobilePreview: "Mobile preview", myProjects: "My Projects", maxProjects: "Maximum {max} projects per account", projectQuota: "Project quota usage:", projectsUsed: "Projects used", newProjectPlaceholder: "New project name (e.g. cashier_app)...", create: "Create", maxProjectsReached: "Maximum project limit reached. Please delete an old project first.", noProjects: "No projects saved yet. Enter a name above and click Create.", saveName: "Save name", defaultProject: "Default", renameProject: "Rename project", filesLabel: "files", updated: "Updated:", open: "Open", defaultCannotDelete: "The default project cannot be deleted", deleteProject: "Delete project", projectNameRequired: "Project name cannot be empty.", failedCreateProject: "Failed to create project.", failedDeleteProject: "Failed to delete project.", failedRenameProject: "Failed to rename project.", projectCreated: "Project '{name}' created successfully!", openingProject: "Opening project '{name}'...", projectLoaded: "Project '{name}' loaded successfully!", projectOpened: "Project '{name}' opened.", projectDeleted: "Project '{name}' deleted successfully.", projectRenamed: "Project renamed to '{name}'!"
  },
  id: {
    scrollToBottom: "Gulir ke bawah",
    thoughtFor: "Berpikir selama {duration} dtk", processingReasoning: "Memproses penalaran...", noResponseGenerated: "Tidak ada respons teks yang dibuat. Silakan kirim ulang atau ubah pertanyaan Anda.", loadingModel: "Memuat model {model}...", thinking: "Sedang berpikir...", ttsSpeaking: "Suara sedang diputar...", textRead: "Teks terbaca", selectAiModel: "Pilih Model AI", sendMessage: "Kirim pesan", switchAiModel: "Ganti model AI",
    appPreferences: "Preferensi Aplikasi", accountAppPreferences: "Akun & preferensi aplikasi", membershipStatus: "Status Keanggotaan", connectedViaGoogle: "Terhubung melalui Google", connectedAsGuest: "Terhubung sebagai tamu", offlineSession: "Sesi offline", guestProfile: "Profil Tamu", closeSettings: "Tutup pengaturan", backToSettings: "Kembali ke pengaturan", settingsMenu: "Menu pengaturan",
    helpImprove: "Bantu kami meningkatkan ExeAi", whyUnhelpful: "Mengapa respons ini kurang membantu?", thankFeedback: "Terima kasih atas umpan baliknya!", inaccurate: "Tidak akurat / Halusinasi", incorrectFormat: "Kode atau format salah", tooBrief: "Terlalu singkat / Mengabaikan instruksi", slowChat: "Chat lambat / Respons macet", unclearExplanation: "Penjelasan kurang jelas", addDetails: "Tambahkan detail (opsional)...", detailedReport: "Laporan lengkap & berkas di Pengaturan", skip: "Lewati", submit: "Kirim", dismiss: "Tutup",
    manageProjects: "Kelola proyek (maks. {max} per pengguna)", realtimeSync: "Sinkronisasi real-time", connecting: "Menghubungkan...", preview: "Pratinjau", code: "Kode", desktopPreview: "Pratinjau desktop", mobilePreview: "Pratinjau seluler", myProjects: "Proyek Saya", maxProjects: "Maksimal {max} proyek per akun", projectQuota: "Penggunaan kuota proyek:", projectsUsed: "Proyek digunakan", newProjectPlaceholder: "Nama proyek baru (contoh: app_kasir)...", create: "Buat", maxProjectsReached: "Batas maksimal proyek tercapai. Hapus proyek lama terlebih dahulu.", noProjects: "Belum ada proyek tersimpan. Masukkan nama di atas lalu tekan Buat.", saveName: "Simpan nama", defaultProject: "Bawaan", renameProject: "Ubah nama proyek", filesLabel: "berkas", updated: "Diperbarui:", open: "Buka", defaultCannotDelete: "Proyek bawaan tidak dapat dihapus", deleteProject: "Hapus proyek", projectNameRequired: "Nama proyek tidak boleh kosong.", failedCreateProject: "Gagal membuat proyek.", failedDeleteProject: "Gagal menghapus proyek.", failedRenameProject: "Gagal mengubah nama proyek.", projectCreated: "Proyek '{name}' berhasil dibuat!", openingProject: "Membuka proyek '{name}'...", projectLoaded: "Proyek '{name}' berhasil dimuat!", projectOpened: "Proyek '{name}' dibuka.", projectDeleted: "Proyek '{name}' berhasil dihapus.", projectRenamed: "Nama proyek diubah menjadi '{name}'!"
  },
  ar: {
    thoughtFor: "التفكير لمدة {duration} ث", processingReasoning: "جارٍ معالجة الاستدلال...", noResponseGenerated: "لم يتم إنشاء رد نصي. يرجى إعادة الإرسال أو إعادة صياغة رسالتك.", loadingModel: "جارٍ تحميل النموذج {model}...", thinking: "جارٍ التفكير...", ttsSpeaking: "يتم تشغيل الصوت...", textRead: "تمت قراءة النص", selectAiModel: "اختر نموذج الذكاء الاصطناعي", sendMessage: "إرسال الرسالة", switchAiModel: "تغيير نموذج الذكاء الاصطناعي",
    appPreferences: "تفضيلات التطبيق", accountAppPreferences: "الحساب وتفضيلات التطبيق", membershipStatus: "حالة العضوية", connectedViaGoogle: "متصل عبر Google", connectedAsGuest: "متصل كضيف", offlineSession: "جلسة دون اتصال", guestProfile: "ملف الضيف", closeSettings: "إغلاق الإعدادات", backToSettings: "العودة إلى الإعدادات", settingsMenu: "قائمة الإعدادات",
    helpImprove: "ساعدنا في تحسين ExeAi", whyUnhelpful: "لماذا لم تكن هذه الإجابة مفيدة؟", thankFeedback: "شكرًا لملاحظاتك!", inaccurate: "غير دقيق / هلوسة", incorrectFormat: "رمز أو تنسيق غير صحيح", tooBrief: "قصير جدًا / تجاهل التعليمات", slowChat: "دردشة بطيئة / استجابة متوقفة", unclearExplanation: "شرح غير واضح", addDetails: "أضف تفاصيل (اختياري)...", detailedReport: "التقرير والملفات في الإعدادات", skip: "تخطي", submit: "إرسال", dismiss: "إغلاق",
    manageProjects: "إدارة المشاريع (الحد {max} لكل مستخدم)", realtimeSync: "مزامنة فورية", connecting: "جارٍ الاتصال...", preview: "معاينة", code: "رمز", desktopPreview: "معاينة سطح المكتب", mobilePreview: "معاينة الهاتف", myProjects: "مشاريعي", maxProjects: "الحد {max} مشاريع لكل حساب", projectQuota: "استخدام حصة المشاريع:", projectsUsed: "مشاريع مستخدمة", newProjectPlaceholder: "اسم مشروع جديد (مثال: cashier_app)...", create: "إنشاء", maxProjectsReached: "تم الوصول إلى الحد الأقصى للمشاريع. احذف مشروعًا قديمًا أولاً.", noProjects: "لا توجد مشاريع محفوظة. أدخل اسمًا أعلاه ثم اضغط إنشاء.", saveName: "حفظ الاسم", defaultProject: "افتراضي", renameProject: "إعادة تسمية المشروع", filesLabel: "ملفات", updated: "محدّث:", open: "فتح", defaultCannotDelete: "لا يمكن حذف المشروع الافتراضي", deleteProject: "حذف المشروع", projectNameRequired: "لا يمكن أن يكون اسم المشروع فارغًا.", failedCreateProject: "تعذر إنشاء المشروع.", failedDeleteProject: "تعذر حذف المشروع.", failedRenameProject: "تعذر إعادة تسمية المشروع.", projectCreated: "تم إنشاء المشروع '{name}' بنجاح!", openingProject: "جارٍ فتح المشروع '{name}'...", projectLoaded: "تم تحميل المشروع '{name}' بنجاح!", projectOpened: "تم فتح المشروع '{name}'.", projectDeleted: "تم حذف المشروع '{name}' بنجاح.", projectRenamed: "تمت إعادة تسمية المشروع إلى '{name}'!"
  },
  ja: {
    thoughtFor: "{duration}秒間考えました", processingReasoning: "推論を処理中...", noResponseGenerated: "テキスト応答が生成されませんでした。再送信するか、質問を言い換えてください。", loadingModel: "モデル {model} を読み込み中...", thinking: "考え中...", ttsSpeaking: "音声を再生中...", textRead: "テキストを読み込み済み", selectAiModel: "AIモデルを選択", sendMessage: "メッセージを送信", switchAiModel: "AIモデルを変更",
    appPreferences: "アプリの設定", accountAppPreferences: "アカウントとアプリの設定", membershipStatus: "会員ステータス", connectedViaGoogle: "Googleで接続中", connectedAsGuest: "ゲストとして接続中", offlineSession: "オフラインセッション", guestProfile: "ゲストプロフィール", closeSettings: "設定を閉じる", backToSettings: "設定に戻る", settingsMenu: "設定メニュー",
    helpImprove: "ExeAiの改善にご協力ください", whyUnhelpful: "この回答が役に立たなかった理由は？", thankFeedback: "フィードバックありがとうございます！", inaccurate: "不正確 / 幻覚", incorrectFormat: "コードまたは形式が正しくない", tooBrief: "短すぎる / 指示を無視", slowChat: "チャットが遅い / 応答停止", unclearExplanation: "説明が不明確", addDetails: "詳細を追加（任意）...", detailedReport: "詳細な報告とファイルは設定から", skip: "スキップ", submit: "送信", dismiss: "閉じる",
    manageProjects: "プロジェクトを管理（ユーザーあたり最大{max}件）", realtimeSync: "リアルタイム同期", connecting: "接続中...", preview: "プレビュー", code: "コード", desktopPreview: "デスクトッププレビュー", mobilePreview: "モバイルプレビュー", myProjects: "マイプロジェクト", maxProjects: "アカウントあたり最大{max}件", projectQuota: "プロジェクト容量:", projectsUsed: "使用中のプロジェクト", newProjectPlaceholder: "新しいプロジェクト名（例: cashier_app）...", create: "作成", maxProjectsReached: "プロジェクト数の上限に達しました。古いプロジェクトを削除してください。", noProjects: "保存済みプロジェクトはありません。上で名前を入力して作成を押してください。", saveName: "名前を保存", defaultProject: "既定", renameProject: "プロジェクト名を変更", filesLabel: "ファイル", updated: "更新:", open: "開く", defaultCannotDelete: "既定のプロジェクトは削除できません", deleteProject: "プロジェクトを削除", projectNameRequired: "プロジェクト名は空にできません。", failedCreateProject: "プロジェクトを作成できませんでした。", failedDeleteProject: "プロジェクトを削除できませんでした。", failedRenameProject: "プロジェクト名を変更できませんでした。", projectCreated: "プロジェクト '{name}' を作成しました！", openingProject: "プロジェクト '{name}' を開いています...", projectLoaded: "プロジェクト '{name}' を読み込みました！", projectOpened: "プロジェクト '{name}' を開きました。", projectDeleted: "プロジェクト '{name}' を削除しました。", projectRenamed: "プロジェクト名を '{name}' に変更しました！"
  },
  ko: {
    thoughtFor: "{duration}초 동안 생각함", processingReasoning: "추론 처리 중...", noResponseGenerated: "텍스트 응답이 생성되지 않았습니다. 다시 보내거나 메시지를 바꿔 주세요.", loadingModel: "모델 {model} 로드 중...", thinking: "생각 중...", ttsSpeaking: "음성을 재생 중...", textRead: "텍스트 읽음", selectAiModel: "AI 모델 선택", sendMessage: "메시지 보내기", switchAiModel: "AI 모델 변경",
    appPreferences: "앱 환경설정", accountAppPreferences: "계정 및 앱 환경설정", membershipStatus: "멤버십 상태", connectedViaGoogle: "Google로 연결됨", connectedAsGuest: "게스트로 연결됨", offlineSession: "오프라인 세션", guestProfile: "게스트 프로필", closeSettings: "설정 닫기", backToSettings: "설정으로 돌아가기", settingsMenu: "설정 메뉴",
    helpImprove: "ExeAi 개선을 도와주세요", whyUnhelpful: "이 응답이 도움이 되지 않은 이유는 무엇인가요?", thankFeedback: "피드백 감사합니다!", inaccurate: "부정확함 / 환각", incorrectFormat: "코드 또는 형식 오류", tooBrief: "너무 짧음 / 지시 무시", slowChat: "느린 채팅 / 응답 멈춤", unclearExplanation: "불명확한 설명", addDetails: "세부 정보 추가(선택 사항)...", detailedReport: "자세한 보고서와 파일은 설정에서", skip: "건너뛰기", submit: "제출", dismiss: "닫기",
    manageProjects: "프로젝트 관리(사용자당 최대 {max}개)", realtimeSync: "실시간 동기화", connecting: "연결 중...", preview: "미리보기", code: "코드", desktopPreview: "데스크톱 미리보기", mobilePreview: "모바일 미리보기", myProjects: "내 프로젝트", maxProjects: "계정당 최대 {max}개 프로젝트", projectQuota: "프로젝트 할당량 사용량:", projectsUsed: "사용 중인 프로젝트", newProjectPlaceholder: "새 프로젝트 이름(예: cashier_app)...", create: "만들기", maxProjectsReached: "프로젝트 한도에 도달했습니다. 이전 프로젝트를 삭제하세요.", noProjects: "저장된 프로젝트가 없습니다. 위에 이름을 입력하고 만들기를 누르세요.", saveName: "이름 저장", defaultProject: "기본", renameProject: "프로젝트 이름 변경", filesLabel: "파일", updated: "업데이트:", open: "열기", defaultCannotDelete: "기본 프로젝트는 삭제할 수 없습니다", deleteProject: "프로젝트 삭제", projectNameRequired: "프로젝트 이름은 비워 둘 수 없습니다.", failedCreateProject: "프로젝트를 만들지 못했습니다.", failedDeleteProject: "프로젝트를 삭제하지 못했습니다.", failedRenameProject: "프로젝트 이름을 변경하지 못했습니다.", projectCreated: "프로젝트 '{name}'을 만들었습니다!", openingProject: "프로젝트 '{name}' 여는 중...", projectLoaded: "프로젝트 '{name}'을 불러왔습니다!", projectOpened: "프로젝트 '{name}'을 열었습니다.", projectDeleted: "프로젝트 '{name}'을 삭제했습니다.", projectRenamed: "프로젝트 이름을 '{name}'으로 변경했습니다!"
  },
  es: {
    thoughtFor: "Pensó durante {duration}s", processingReasoning: "Procesando el razonamiento...", noResponseGenerated: "No se generó una respuesta de texto. Vuelve a enviar o reformula tu mensaje.", loadingModel: "Cargando el modelo {model}...", thinking: "Pensando...", ttsSpeaking: "Reproduciendo voz...", textRead: "Texto leído", selectAiModel: "Seleccionar modelo de IA", sendMessage: "Enviar mensaje", switchAiModel: "Cambiar modelo de IA",
    appPreferences: "Preferencias de la aplicación", accountAppPreferences: "Cuenta y preferencias de la aplicación", membershipStatus: "Estado de membresía", connectedViaGoogle: "Conectado con Google", connectedAsGuest: "Conectado como invitado", offlineSession: "Sesión sin conexión", guestProfile: "Perfil de invitado", closeSettings: "Cerrar configuración", backToSettings: "Volver a configuración", settingsMenu: "Menú de configuración",
    helpImprove: "Ayúdanos a mejorar ExeAi", whyUnhelpful: "¿Por qué esta respuesta no fue útil?", thankFeedback: "¡Gracias por tus comentarios!", inaccurate: "Inexacta / Alucinación", incorrectFormat: "Código o formato incorrecto", tooBrief: "Demasiado breve / Ignoró instrucciones", slowChat: "Chat lento / Respuesta detenida", unclearExplanation: "Explicación poco clara", addDetails: "Añadir detalles (opcional)...", detailedReport: "Informe y archivos detallados en Configuración", skip: "Omitir", submit: "Enviar", dismiss: "Cerrar",
    manageProjects: "Gestionar proyectos (máx. {max} por usuario)", realtimeSync: "Sincronización en tiempo real", connecting: "Conectando...", preview: "Vista previa", code: "Código", desktopPreview: "Vista previa de escritorio", mobilePreview: "Vista previa móvil", myProjects: "Mis proyectos", maxProjects: "Máximo {max} proyectos por cuenta", projectQuota: "Uso de cuota de proyectos:", projectsUsed: "Proyectos usados", newProjectPlaceholder: "Nuevo nombre de proyecto (p. ej., cashier_app)...", create: "Crear", maxProjectsReached: "Se alcanzó el límite de proyectos. Elimina primero un proyecto antiguo.", noProjects: "Aún no hay proyectos guardados. Escribe un nombre arriba y pulsa Crear.", saveName: "Guardar nombre", defaultProject: "Predeterminado", renameProject: "Cambiar nombre del proyecto", filesLabel: "archivos", updated: "Actualizado:", open: "Abrir", defaultCannotDelete: "El proyecto predeterminado no se puede eliminar", deleteProject: "Eliminar proyecto", projectNameRequired: "El nombre del proyecto no puede estar vacío.", failedCreateProject: "No se pudo crear el proyecto.", failedDeleteProject: "No se pudo eliminar el proyecto.", failedRenameProject: "No se pudo cambiar el nombre del proyecto.", projectCreated: "¡Proyecto '{name}' creado correctamente!", openingProject: "Abriendo el proyecto '{name}'...", projectLoaded: "¡Proyecto '{name}' cargado correctamente!", projectOpened: "Proyecto '{name}' abierto.", projectDeleted: "Proyecto '{name}' eliminado correctamente.", projectRenamed: "¡Proyecto renombrado a '{name}'!"
  },
  zh: {
    thoughtFor: "已思考 {duration} 秒", processingReasoning: "正在处理推理...", noResponseGenerated: "未生成文字回复。请重新发送或换一种说法。", loadingModel: "正在加载模型 {model}...", thinking: "正在思考...", ttsSpeaking: "正在播放语音...", textRead: "已读取文本", selectAiModel: "选择 AI 模型", sendMessage: "发送消息", switchAiModel: "切换 AI 模型",
    appPreferences: "应用偏好设置", accountAppPreferences: "帐户和应用偏好设置", membershipStatus: "会员状态", connectedViaGoogle: "已通过 Google 连接", connectedAsGuest: "以访客身份连接", offlineSession: "离线会话", guestProfile: "访客资料", closeSettings: "关闭设置", backToSettings: "返回设置", settingsMenu: "设置菜单",
    helpImprove: "帮助我们改进 ExeAi", whyUnhelpful: "此回答为什么没有帮助？", thankFeedback: "感谢您的反馈！", inaccurate: "不准确 / 幻觉", incorrectFormat: "代码或格式不正确", tooBrief: "太简短 / 忽略指令", slowChat: "聊天缓慢 / 响应停滞", unclearExplanation: "解释不清楚", addDetails: "添加具体细节（可选）...", detailedReport: "详细报告和文件位于设置中", skip: "跳过", submit: "提交", dismiss: "关闭",
    manageProjects: "管理项目（每位用户最多 {max} 个）", realtimeSync: "实时同步", connecting: "正在连接...", preview: "预览", code: "代码", desktopPreview: "桌面预览", mobilePreview: "移动预览", myProjects: "我的项目", maxProjects: "每个帐户最多 {max} 个项目", projectQuota: "项目配额使用情况：", projectsUsed: "已用项目", newProjectPlaceholder: "新项目名称（如 cashier_app）...", create: "创建", maxProjectsReached: "已达到项目数量上限。请先删除旧项目。", noProjects: "尚未保存项目。在上方输入名称后点击创建。", saveName: "保存名称", defaultProject: "默认", renameProject: "重命名项目", filesLabel: "文件", updated: "更新：", open: "打开", defaultCannotDelete: "默认项目无法删除", deleteProject: "删除项目", projectNameRequired: "项目名称不能为空。", failedCreateProject: "无法创建项目。", failedDeleteProject: "无法删除项目。", failedRenameProject: "无法重命名项目。", projectCreated: "项目“{name}”已创建！", openingProject: "正在打开项目“{name}”...", projectLoaded: "项目“{name}”已加载！", projectOpened: "项目“{name}”已打开。", projectDeleted: "项目“{name}”已删除。", projectRenamed: "项目已重命名为“{name}”！"
  },
  fr: {
    thoughtFor: "Réflexion pendant {duration}s", processingReasoning: "Traitement du raisonnement...", noResponseGenerated: "Aucune réponse texte n'a été générée. Réessayez ou reformulez votre message.", loadingModel: "Chargement du modèle {model}...", thinking: "Réflexion...", ttsSpeaking: "Lecture vocale en cours...", textRead: "Texte lu", selectAiModel: "Sélectionner un modèle d'IA", sendMessage: "Envoyer le message", switchAiModel: "Changer de modèle d'IA",
    appPreferences: "Préférences de l'application", accountAppPreferences: "Compte et préférences de l'application", membershipStatus: "Statut de l'adhésion", connectedViaGoogle: "Connecté via Google", connectedAsGuest: "Connecté en tant qu'invité", offlineSession: "Session hors ligne", guestProfile: "Profil invité", closeSettings: "Fermer les paramètres", backToSettings: "Retour aux paramètres", settingsMenu: "Menu des paramètres",
    helpImprove: "Aidez-nous à améliorer ExeAi", whyUnhelpful: "Pourquoi cette réponse n'a-t-elle pas été utile ?", thankFeedback: "Merci pour votre avis !", inaccurate: "Imprécise / Hallucination", incorrectFormat: "Code ou format incorrect", tooBrief: "Trop bref / Instructions ignorées", slowChat: "Chat lent / Réponse bloquée", unclearExplanation: "Explication peu claire", addDetails: "Ajouter des détails (facultatif)...", detailedReport: "Rapport détaillé et fichiers dans les paramètres", skip: "Ignorer", submit: "Envoyer", dismiss: "Fermer",
    manageProjects: "Gérer les projets (max. {max} par utilisateur)", realtimeSync: "Synchronisation en temps réel", connecting: "Connexion...", preview: "Aperçu", code: "Code", desktopPreview: "Aperçu ordinateur", mobilePreview: "Aperçu mobile", myProjects: "Mes projets", maxProjects: "Maximum {max} projets par compte", projectQuota: "Utilisation du quota de projets :", projectsUsed: "Projets utilisés", newProjectPlaceholder: "Nouveau nom de projet (ex. cashier_app)...", create: "Créer", maxProjectsReached: "La limite de projets est atteinte. Supprimez d'abord un ancien projet.", noProjects: "Aucun projet enregistré. Saisissez un nom ci-dessus et cliquez sur Créer.", saveName: "Enregistrer le nom", defaultProject: "Par défaut", renameProject: "Renommer le projet", filesLabel: "fichiers", updated: "Mis à jour :", open: "Ouvrir", defaultCannotDelete: "Le projet par défaut ne peut pas être supprimé", deleteProject: "Supprimer le projet", projectNameRequired: "Le nom du projet ne peut pas être vide.", failedCreateProject: "Impossible de créer le projet.", failedDeleteProject: "Impossible de supprimer le projet.", failedRenameProject: "Impossible de renommer le projet.", projectCreated: "Projet '{name}' créé avec succès !", openingProject: "Ouverture du projet '{name}'...", projectLoaded: "Projet '{name}' chargé avec succès !", projectOpened: "Projet '{name}' ouvert.", projectDeleted: "Projet '{name}' supprimé avec succès.", projectRenamed: "Projet renommé en '{name}' !"
  },
  de: {
    thoughtFor: "Nachgedacht für {duration}s", processingReasoning: "Verarbeitung der Überlegung...", noResponseGenerated: "Es wurde keine Textantwort erstellt. Bitte erneut senden oder anders formulieren.", loadingModel: "Modell {model} wird geladen...", thinking: "Denkt nach...", ttsSpeaking: "Sprachausgabe läuft...", textRead: "Text gelesen", selectAiModel: "KI-Modell auswählen", sendMessage: "Nachricht senden", switchAiModel: "KI-Modell wechseln",
    appPreferences: "App-Einstellungen", accountAppPreferences: "Konto- und App-Einstellungen", membershipStatus: "Mitgliedschaftsstatus", connectedViaGoogle: "Über Google verbunden", connectedAsGuest: "Als Gast verbunden", offlineSession: "Offline-Sitzung", guestProfile: "Gastprofil", closeSettings: "Einstellungen schließen", backToSettings: "Zu den Einstellungen", settingsMenu: "Einstellungsmenü",
    helpImprove: "Hilf uns, ExeAi zu verbessern", whyUnhelpful: "Warum war diese Antwort nicht hilfreich?", thankFeedback: "Danke für dein Feedback!", inaccurate: "Ungenau / Halluzination", incorrectFormat: "Falscher Code oder Format", tooBrief: "Zu kurz / Anweisungen ignoriert", slowChat: "Langsamer Chat / Antwort hängt", unclearExplanation: "Unklare Erklärung", addDetails: "Details hinzufügen (optional)...", detailedReport: "Detaillierter Bericht und Dateien in Einstellungen", skip: "Überspringen", submit: "Senden", dismiss: "Schließen",
    manageProjects: "Projekte verwalten (max. {max} pro Benutzer)", realtimeSync: "Echtzeit-Synchronisierung", connecting: "Verbindung wird hergestellt...", preview: "Vorschau", code: "Code", desktopPreview: "Desktop-Vorschau", mobilePreview: "Mobilvorschau", myProjects: "Meine Projekte", maxProjects: "Maximal {max} Projekte pro Konto", projectQuota: "Projektkontingent:", projectsUsed: "Verwendete Projekte", newProjectPlaceholder: "Neuer Projektname (z. B. cashier_app)...", create: "Erstellen", maxProjectsReached: "Die Projektgrenze ist erreicht. Bitte zuerst ein altes Projekt löschen.", noProjects: "Noch keine Projekte gespeichert. Gib oben einen Namen ein und klicke auf Erstellen.", saveName: "Namen speichern", defaultProject: "Standard", renameProject: "Projekt umbenennen", filesLabel: "Dateien", updated: "Aktualisiert:", open: "Öffnen", defaultCannotDelete: "Das Standardprojekt kann nicht gelöscht werden", deleteProject: "Projekt löschen", projectNameRequired: "Der Projektname darf nicht leer sein.", failedCreateProject: "Projekt konnte nicht erstellt werden.", failedDeleteProject: "Projekt konnte nicht gelöscht werden.", failedRenameProject: "Projekt konnte nicht umbenannt werden.", projectCreated: "Projekt '{name}' wurde erstellt!", openingProject: "Projekt '{name}' wird geöffnet...", projectLoaded: "Projekt '{name}' wurde geladen!", projectOpened: "Projekt '{name}' wurde geöffnet.", projectDeleted: "Projekt '{name}' wurde gelöscht.", projectRenamed: "Projekt wurde in '{name}' umbenannt!"
  }
};

export function getTranslation(
  key: string,
  langCode: string = "en",
  params?: Record<string, string>
): string {
  const dict = translations[langCode] || translations.en;
  let text = extraTranslations[langCode]?.[key] || (dict as unknown as Record<string, string>)[key] || extraTranslations.en[key] || (translations.en as unknown as Record<string, string>)[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }

  return text;
}
