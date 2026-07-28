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

export const translations: Record<string, Record<string, string>> = {
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
    exeChatDisclaimer: "ExeChat can make mistakes. Verify important information.",
    
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
    exeChatDisclaimer: "ExeChat dapat membuat kesalahan. Periksa dan verifikasi informasi penting.",
    
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
    recentConversations: "最近对话"
  }
};

const extraTranslations: Record<string, Record<string, string>> = {
  en: {
    exeChatDisclaimer: "ExeChat can make mistakes. Verify important information.",
    scrollToBottom: "Scroll to bottom"
  },
  id: {
    exeChatDisclaimer: "ExeChat dapat membuat kesalahan. Periksa dan verifikasi informasi penting.",
    scrollToBottom: "Gulir ke bawah"
  },
  ar: {
    exeChatDisclaimer: "يمكن لـ ExeChat التسبب في أخطاء. يرجى التحقق من المعلومات الهامة.",
    scrollToBottom: "التمرير إلى الأسفل"
  },
  ja: {
    exeChatDisclaimer: "ExeChat は間違えることがあります。重要な情報は再確認してください。",
    scrollToBottom: "下へスクロール"
  },
  ko: {
    exeChatDisclaimer: "ExeChat은 실수를 할 수 있습니다. 중요한 정보는 다시 확인하세요.",
    scrollToBottom: "맨 아래로 스크롤"
  },
  es: {
    exeChatDisclaimer: "ExeChat puede cometer errores. Comprueba la información importante.",
    scrollToBottom: "Desplazarse hacia abajo"
  },
  zh: {
    exeChatDisclaimer: "ExeChat 可能会犯错。请核对重要信息。",
    scrollToBottom: "滚动到探底"
  },
  fr: {
    exeChatDisclaimer: "ExeChat peut commettre des erreurs. Vérifiez les informations importantes.",
    scrollToBottom: "Défiler vers le bas"
  },
  de: {
    exeChatDisclaimer: "ExeChat kann Fehler machen. Überprüfen Sie wichtige Informationen.",
    scrollToBottom: "Nach unten scrollen"
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
