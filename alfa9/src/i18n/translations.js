// ============================================================
// TRANSLATIONS
// ============================================================
// Add new keys here as more pages get translated. Every page should pull
// its text through useLanguage()'s t('key') instead of hardcoding English,
// so it automatically works in all 4 languages going forward.
//
// Note on Urdu: only the TEXT is translated to the Urdu script — the page
// layout itself stays left-to-right (not flipped to RTL). Flipping the
// whole app's direction would require re-checking every page's spacing,
// icon placement, and alignment, which risks breaking the existing
// pixel-perfect design. This is standard practice for apps that support
// RTL languages without a full RTL layout pass.

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bangla', native: 'বাংলা' },
];

export const DEFAULT_LANGUAGE = 'en';

export const translations = {
  en: {
    // Bottom nav (Footer.jsx) — shared across almost every page
    nav_home: 'Home',
    nav_activity: 'Activity',
    nav_spin: 'Get Rs3,000',
    nav_promotion: 'Promotion',
    nav_account: 'Account',
    add_to_desktop: 'Add to Desktop',

    // Language switcher
    select_language: 'Select Language',
    language: 'Language',
    language_hint: 'Choose the language you\u2019re most comfortable with. You can change this anytime.',

    // Home page
    home_announce_1: 'Dear members, please verify your wallet before withdrawing',
    home_announce_2: 'Win big with our daily bonus rewards!',
    home_announce_3: 'New games added! Check out the latest slots',
    detail: 'Detail',
    cat_popular: 'Popular',
    cat_fishing: 'Fishing',
    cat_slots: 'Slots',
    cat_lottery: 'Lottery',
    cat_original: 'Original',
    cat_casino: 'Casino',
    cat_sports: 'Sports',
    cat_rummy: 'Rummy',

    // Account page
    acc_deposit: 'Deposit',
    acc_deposit_sub: 'My deposit history',
    acc_withdraw: 'Withdraw',
    acc_withdraw_sub: 'My withdraw history',
    acc_settings_more: 'Settings & More',
    acc_notification: 'Notification',
    acc_gifts: 'Gifts',
    acc_game_stats: 'Game statistics',
    acc_service_center: 'Service center',
    acc_settings: 'Settings',
    acc_feedback: 'Feedback',
    acc_announcement: 'Announcement',
  },

  ur: {
    nav_home: 'ہوم',
    nav_activity: 'سرگرمی',
    nav_spin: '3,000 روپے حاصل کریں',
    nav_promotion: 'پروموشن',
    nav_account: 'اکاؤنٹ',
    add_to_desktop: 'ڈیسک ٹاپ پر شامل کریں',

    select_language: 'زبان منتخب کریں',
    language: 'زبان',
    language_hint: 'وہ زبان منتخب کریں جس میں آپ آسانی محسوس کرتے ہیں۔ آپ اسے کبھی بھی تبدیل کر سکتے ہیں۔',

    home_announce_1: 'عزیز ممبران، رقم نکالنے سے پہلے اپنا والٹ تصدیق کریں',
    home_announce_2: 'ہمارے روزانہ بونس انعامات کے ساتھ بڑی جیت حاصل کریں!',
    home_announce_3: 'نئے گیمز شامل کیے گئے! تازہ ترین سلاٹس دیکھیں',
    detail: 'تفصیل',
    cat_popular: 'مقبول',
    cat_fishing: 'فشنگ',
    cat_slots: 'سلاٹس',
    cat_lottery: 'لاٹری',
    cat_original: 'اوریجنل',
    cat_casino: 'کیسینو',
    cat_sports: 'اسپورٹس',
    cat_rummy: 'رمی',

    acc_deposit: 'ڈپازٹ',
    acc_deposit_sub: 'میری ڈپازٹ ہسٹری',
    acc_withdraw: 'نکالیں',
    acc_withdraw_sub: 'میری نکلوانے کی ہسٹری',
    acc_settings_more: 'ترتیبات اور مزید',
    acc_notification: 'اطلاعات',
    acc_gifts: 'تحائف',
    acc_game_stats: 'گیم کے اعداد و شمار',
    acc_service_center: 'سروس سینٹر',
    acc_settings: 'ترتیبات',
    acc_feedback: 'رائے',
    acc_announcement: 'اعلان',
  },

  hi: {
    nav_home: 'होम',
    nav_activity: 'एक्टिविटी',
    nav_spin: 'Rs3,000 पाएं',
    nav_promotion: 'प्रमोशन',
    nav_account: 'अकाउंट',
    add_to_desktop: 'डेस्कटॉप पर जोड़ें',

    select_language: 'भाषा चुनें',
    language: 'भाषा',
    language_hint: 'वह भाषा चुनें जिसमें आप सहज हों। आप इसे कभी भी बदल सकते हैं।',

    home_announce_1: 'प्रिय सदस्यों, निकासी से पहले कृपया अपना वॉलेट सत्यापित करें',
    home_announce_2: 'हमारे रोज़ाना बोनस रिवॉर्ड्स के साथ बड़ी जीत पाएं!',
    home_announce_3: 'नए गेम्स जोड़े गए! नवीनतम स्लॉट्स देखें',
    detail: 'विवरण',
    cat_popular: 'लोकप्रिय',
    cat_fishing: 'फिशिंग',
    cat_slots: 'स्लॉट्स',
    cat_lottery: 'लॉटरी',
    cat_original: 'ओरिजिनल',
    cat_casino: 'कैसीनो',
    cat_sports: 'स्पोर्ट्स',
    cat_rummy: 'रम्मी',

    acc_deposit: 'डिपॉज़िट',
    acc_deposit_sub: 'मेरी डिपॉज़िट हिस्ट्री',
    acc_withdraw: 'निकासी',
    acc_withdraw_sub: 'मेरी निकासी हिस्ट्री',
    acc_settings_more: 'सेटिंग्स और अधिक',
    acc_notification: 'सूचना',
    acc_gifts: 'गिफ्ट्स',
    acc_game_stats: 'गेम आँकड़े',
    acc_service_center: 'सर्विस सेंटर',
    acc_settings: 'सेटिंग्स',
    acc_feedback: 'फीडबैक',
    acc_announcement: 'घोषणा',
  },

  bn: {
    nav_home: 'হোম',
    nav_activity: 'অ্যাক্টিভিটি',
    nav_spin: 'Rs3,000 পান',
    nav_promotion: 'প্রমোশন',
    nav_account: 'অ্যাকাউন্ট',
    add_to_desktop: 'ডেস্কটপে যোগ করুন',

    select_language: 'ভাষা নির্বাচন করুন',
    language: 'ভাষা',
    language_hint: 'আপনি যে ভাষায় সবচেয়ে স্বাচ্ছন্দ্য বোধ করেন তা বেছে নিন। আপনি এটি যেকোনো সময় পরিবর্তন করতে পারেন।',

    home_announce_1: 'প্রিয় সদস্যগণ, উত্তোলনের আগে অনুগ্রহ করে আপনার ওয়ালেট যাচাই করুন',
    home_announce_2: 'আমাদের দৈনিক বোনাস রিওয়ার্ডের সাথে বড় জয় পান!',
    home_announce_3: 'নতুন গেম যোগ করা হয়েছে! সর্বশেষ স্লট দেখুন',
    detail: 'বিস্তারিত',
    cat_popular: 'জনপ্রিয়',
    cat_fishing: 'ফিশিং',
    cat_slots: 'স্লট',
    cat_lottery: 'লটারি',
    cat_original: 'অরিজিনাল',
    cat_casino: 'ক্যাসিনো',
    cat_sports: 'স্পোর্টস',
    cat_rummy: 'রামি',

    acc_deposit: 'ডিপোজিট',
    acc_deposit_sub: 'আমার ডিপোজিট হিস্টোরি',
    acc_withdraw: 'উত্তোলন',
    acc_withdraw_sub: 'আমার উত্তোলন হিস্টোরি',
    acc_settings_more: 'সেটিংস ও আরও',
    acc_notification: 'নোটিফিকেশন',
    acc_gifts: 'গিফট',
    acc_game_stats: 'গেম পরিসংখ্যান',
    acc_service_center: 'সার্ভিস সেন্টার',
    acc_settings: 'সেটিংস',
    acc_feedback: 'ফিডব্যাক',
    acc_announcement: 'ঘোষণা',
  },
};