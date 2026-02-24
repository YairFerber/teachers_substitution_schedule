'use client';

import { useState } from 'react';

type Lang = 'he' | 'en' | 'yi';

const sections = {
    he: [
        {
            id: 'login', icon: '🔐', title: 'התחברות למערכת',
            content: [
                { heading: 'גישה למערכת', body: 'המערכת נגישה דרך הדפדפן בכתובת הייעודית של בית הספר.' },
                { heading: 'שם משתמש ו-PIN', body: 'הזן את שם המשתמש (בדרך כלל שם משפחה בעברית) ואת קוד ה-PIN בן 4 ספרות שקיבלת מהמנהל/ת.' },
                { heading: 'רמות הרשאה', body: 'מנהל (Admin) — גישה מלאה לניהול. מורה — צפייה במערכת שיעורים אישית בלבד.' },
            ],
        },
        {
            id: 'teachers', icon: '👥', title: 'ניהול מורות',
            content: [
                { heading: 'דף המורות', body: 'נווט אל Admin › Teachers לצפייה ברשימת כל הצוות. מורות רגילות ומורות מחליפות מוצגות בנפרד.' },
                { heading: 'פרופיל מורה', body: 'לחץ על שם המורה לפתיחת כרטיס הפרופיל. ניתן לעדכן שם, מייל, טלפון ושם משתמש.' },
                { heading: 'PIN', body: 'מנהל יכול לצפות ולשנות את קוד ה-PIN של כל מורה דרך כרטיס הפרופיל.' },
                { heading: 'הוספת מורה', body: 'לחץ על כפתור "הוסף מורה" ומלא את הפרטים. ניתן לסמן מורה כ"ממלא מקום" (Substitute).' },
            ],
        },
        {
            id: 'schedule', icon: '📅', title: 'מערכת שיעורים ושיבוץ',
            content: [
                { heading: 'תבנית שבועית', body: 'בכרטיס המורה, לחץ על "+" בכל תא להוספת שיעור. בחר נושא, כיתה וסוג שיעור (רגיל / ישיבה / פרטני / פגישת צוות).' },
                { heading: 'ניהול היעדרויות', body: 'עבור ללשונית "ניהול שיבוץ". בחר שבוע, לחץ על שיעור וסמן כנעדר. התא יהפוך לאדום 🔴.' },
                { heading: 'שיבוץ מחליף', body: 'לחץ על תא אדום › "שבץ מחליף/ה" › בחר מורה › "Confirm". התא יהפוך לירוק 🟢.' },
                { heading: 'לא לתשלום', body: 'בעת שיבוץ, סמן את "לא לתשלום" אם שעה זו לא תחויב בגמול.' },
                { heading: 'ביטול', body: 'לחץ על תא ירוק › "בטל השמה / החזר למצב רגיל".' },
            ],
        },
        {
            id: 'daily', icon: '⚡', title: 'מארגן יומי',
            content: [
                { heading: 'גישה', body: 'נווט אל Admin › Daily Organizer. השתמש בחצים לניווט בין תאריכים.' },
                { heading: 'סימון היעדרות', body: 'לחץ על שם המורה בטור השמאלי. בחר סיבה (מחלה / חופש / בתפקיד) ואז היעדרות יומית או שעתית.' },
                { heading: 'היעדרות יומית', body: 'מסמנת את כל שיעורי ההוראה הרגילים כנעדרים. שעות ישיבה ופרטני אינן מסומנות.' },
                { heading: 'היעדרות שעתית', body: 'לחץ על תא בודד בשורת המורה לסימון שעה ספציפית.' },
                { heading: 'שיבוץ מחליף', body: 'לחץ על תא אדום בגריד. תפריט ממלאי מקום יופיע עם עומס וזמינות כל מורה.' },
                { heading: 'לא לתשלום', body: 'סמן "לא לתשלום" לפני בחירת המורה אם שעה זו לא תחויב.' },
            ],
        },
        {
            id: 'reports', icon: '📊', title: 'דוחות',
            content: [
                { heading: 'היעדרויות יומי', body: 'רשימת נעדרות לפי יום. שתי טבלאות: מחלה/חופש ובתפקיד. כל שורה — יומי (X) או מספר שעות.' },
                { heading: 'היעדרויות חודשי', body: 'מטריצה חודשית, שתי טבלאות נפרדות (מחלה/חופש + בתפקיד).' },
                { heading: 'מ"מ יומי', body: 'ממלאי מקום בתשלום ביום הנבחר עם סה"כ שעות.' },
                { heading: 'מ"מ חודשי', body: 'מטריצה חודשית של שעות מילוי מקום בתשלום.' },
                { heading: 'מ"מ ללא תשלום', body: 'מטריצה חודשית של שעות ללא תשלום בלבד.' },
                { heading: 'הדפסה / PDF', body: 'לחץ על "הדפסה / PDF" לייצוא הדוח.' },
            ],
        },
        {
            id: 'data', icon: '⚙️', title: 'כלי ניהול נתונים',
            content: [
                { heading: 'ייצוא נתונים', body: 'Admin › Data Management לייצוא מסד הנתונים כ-JSON לגיבוי.' },
                { heading: 'ייבוא מ-Excel', body: 'ייבוא מערכת שיעורים מ-Excel. הורד תבנית, מלא והעלה.' },
                { heading: 'שחזור', body: 'העלאת קובץ JSON לשחזור הנתונים ממצב קודם.' },
            ],
        },
    ],
    en: [
        {
            id: 'login', icon: '🔐', title: 'Getting Started',
            content: [
                { heading: 'Accessing the App', body: 'The system is accessible via browser at your school\'s dedicated URL.' },
                { heading: 'Username & PIN', body: 'Enter your username (usually your last name in Hebrew) and your 4-digit PIN given to you by the administrator.' },
                { heading: 'Access Levels', body: 'Admin — full management access. Teacher — view-only access to personal schedule.' },
            ],
        },
        {
            id: 'teachers', icon: '👥', title: 'Teacher Management',
            content: [
                { heading: 'Teachers Dashboard', body: 'Navigate to Admin › Teachers to view the full staff list. Regular teachers and substitutes are displayed separately.' },
                { heading: 'Teacher Profile', body: 'Click a teacher\'s name to open their profile card. You can update name, email, phone, and username.' },
                { heading: 'PIN Management', body: 'Admins can view and change any teacher\'s login PIN from the profile card.' },
                { heading: 'Adding a Teacher', body: 'Click "Add Teacher" and fill in the details. You can flag a teacher as a "Substitute".' },
            ],
        },
        {
            id: 'schedule', icon: '📅', title: 'Schedule & Substitutions',
            content: [
                { heading: 'Weekly Template', body: 'In the teacher profile, click "+" in any cell to add a class. Select Subject, Class, and Period Type.' },
                { heading: 'Marking Absences', body: 'Go to "Manage Substitutions" tab, select a week, click a class cell, and choose "Mark as Absent". Cell turns red 🔴.' },
                { heading: 'Assigning a Substitute', body: 'Click a red cell › "Assign Substitute" › pick a teacher › "Confirm". Cell turns green 🟢.' },
                { heading: 'Not for Pay', body: 'When assigning, check "לא לתשלום" (No Pay) if this substitution should not count for pay.' },
                { heading: 'Cancelling', body: 'Click a green cell › "Cancel Assignment / Revert to Normal".' },
            ],
        },
        {
            id: 'daily', icon: '⚡', title: 'Daily Organizer',
            content: [
                { heading: 'Access', body: 'Navigate to Admin › Daily Organizer. Use the date arrows to navigate between days.' },
                { heading: 'Marking Absence', body: 'Click a teacher\'s name. Select a reason (Sick / Vacation / On-Duty) then choose Daily or Hourly absence.' },
                { heading: 'Daily Absence', body: 'Marks all regular teaching periods as absent (red). Stay, Individual, and Meeting periods are not flagged.' },
                { heading: 'Hourly Absence', body: 'Click individual cells in the teacher\'s row to mark specific hours as absent.' },
                { heading: 'Assigning Substitutes', body: 'Click a red cell. A picker appears showing each teacher\'s workload and availability.' },
                { heading: 'No-Pay Filter', body: 'Tick "לא לתשלום" before selecting the teacher if the hour should not be paid.' },
            ],
        },
        {
            id: 'reports', icon: '📊', title: 'Reports',
            content: [
                { heading: 'Daily Absence Report', body: 'Lists absent teachers for the selected day, split into Sick/Vacation and On-Duty tables. Each row shows daily (X) or hourly count.' },
                { heading: 'Monthly Absence Report', body: 'Monthly matrix, two separate tables (Sick/Vacation + On-Duty). X = daily, number = hourly.' },
                { heading: 'Daily Sub Report', body: 'Lists substituting teachers for the selected day with total paid substitution hours.' },
                { heading: 'Monthly Sub Report', body: 'Monthly matrix showing paid substitution hours per teacher.' },
                { heading: 'No-Pay Sub Report', body: 'Monthly matrix for unpaid substitutions only.' },
                { heading: 'Print / PDF', body: 'Click "Print / PDF" in the top right to export the current report.' },
            ],
        },
        {
            id: 'data', icon: '⚙️', title: 'Data Management',
            content: [
                { heading: 'Export Data', body: 'Navigate to Admin › Data Management to export the full database as a JSON backup file.' },
                { heading: 'Import from Excel', body: 'Import a schedule from an existing Excel file. Download the template, fill in the data, and upload.' },
                { heading: 'Restore', body: 'Upload a JSON backup file to restore system data from a previous state.' },
            ],
        },
    ],
    yi: [
        {
            id: 'login', icon: '🔐', title: 'אַנמעלדונג אין סיסטעם',
            content: [
                { heading: 'צוטריט צום סיסטעם', body: 'דאָס סיסטעם איז צוטריטלעך דורך דעם בלעטערער אין דער שולס ייעודישן אַדרעס.' },
                { heading: 'באַניצער-נאָמען און PIN', body: 'אַרייַנשרייַבן דעם באַניצער-נאָמען (געװײנלעך דעם משפּחה-נאָמען) און דעם 4-ציפֿערן PIN קאָד וואָס איר האָט באַקומען פֿונעם פֿאַרװאַלטער.' },
                { heading: 'צוטריט-מדרגות', body: 'פֿאַרװאַלטער (Admin) — פֿולן צוטריט. לערער — קיקן בלויז אויף דעם אייגענעם שטונדן-פּלאַן.' },
            ],
        },
        {
            id: 'teachers', icon: '👥', title: 'לערער-פֿאַרװאַלטונג',
            content: [
                { heading: 'לערער-זייַט', body: 'גיין צו Admin › Teachers כּדי צו זען דעם גאַנצן פּערסאָנאַל. רעגולערע לערערינס און מחליפים זענען באַזונדער אַנגעוויזן.' },
                { heading: 'לערערינס פּראָפֿיל', body: 'דריקן אויפן נאָמען פֿונעם לערער כּדי עפֿענען זיין קאַרטל. מען קען עדכּנען נאָמען, בליצפּאָסט, טעלעפֿאָן.' },
                { heading: 'PIN', body: 'דער פֿאַרװאַלטער קען מסתּכּל זיין אויף יעדן לערערס PIN קאָד און עס בײַטן.' },
                { heading: 'צוגעבן אַ לערער', body: 'דריקן "הוסף מורה" און אויספֿילן די פּרטים. מען קען באַצייכענען אַ לערער ווי אַ "מחליף".' },
            ],
        },
        {
            id: 'schedule', icon: '📅', title: 'שטונדן-פּלאַן און פֿאַרטרעטונג',
            content: [
                { heading: 'וועכנטלעכע תּבנית', body: 'אין לערערינס קאַרטל, דריקן "+" אין יעדן קעסטל צו צוגעבן אַ לעקציע. אויסוועלן פֿאַך, קלאַס, און שטונדן-טיפּ.' },
                { heading: 'כּיסוי אַ אָפּוועזנקייט', body: 'גיין צום רייטער "ניהול שיבוץ". אויסוועלן אַ וואָך, דריקן אויף אַ לעקציע, כּיסוי ווי נישטאָ. קעסטל ווערט רויט 🔴.' },
                { heading: 'צוטיילן אַ מחליף', body: 'דריקן אויף אַ רויטן קעסטל › "שבץ מחליף/ה" › אויסוועלן לערער › "Confirm". קעסטל ווערט גרין 🟢.' },
                { heading: 'ניט פֿאַר באַצאָלונג', body: 'ביים צוטיילן אַ מחליף, אָנשרייַבן "לא לתשלום" אויב די שטונד ווערט ניט באַצאָלט.' },
                { heading: 'מבטּל זיין', body: 'דריקן אויף אַ גרינעם קעסטל › "בטל השמה" כּדי אַ מבטּל זיין דעם שיבוץ.' },
            ],
        },
        {
            id: 'daily', icon: '⚡', title: 'טעגלעכער אָרגאַניזאַטאָר',
            content: [
                { heading: 'צוטריט', body: 'גיין צו Admin › Daily Organizer. נוצן די פֿייַלן כּדי נאַוויגירן צווישן טעג.' },
                { heading: 'כּיסוי אָפּוועזנקייט', body: 'דריקן אויפן נאָמען פֿונעם לערער. אויסוועלן אַ סיבה (קראַנק / אורלויב / אין אַ פֿונקציע) דערנאָך — טעגלעך אָדער שעהלעך.' },
                { heading: 'טעגלעכע אָפּוועזנקייט', body: 'באַצייכנט אַלע רעגולערע לעקציעס ווי נישט-פֿאַראַן (רויט). שיצן, פּריוועטע, און פֿאַרזאַמלונגס-שעהן בלייַבן אַן אָנמאַרקירן.' },
                { heading: 'שעהלעכע אָפּוועזנקייט', body: 'דריקן אויף יעדן קעסטל אין ריי פֿונעם לערער כּדי אָנמאַרקירן אַ ספּעציפֿישע שעה.' },
                { heading: 'צוטיילן מחלפים', body: 'דריקן אויף אַ רויטן קעסטל אין גריד. עס ווייזט זיך אַ רשימה מיט יעדן לערערס ווייַטיקייט.' },
                { heading: 'ניט פֿאַר באַצאָלונג', body: 'אָנשרייַבן "לא לתשלום" פֿאַר דעם אויסוועלן פֿון לערער אויב ניט צו באַצאָלן.' },
            ],
        },
        {
            id: 'reports', icon: '📊', title: 'באַריכטן',
            content: [
                { heading: 'טעגלעכער אָפּוועזנקייטן-באַריכט', body: 'אַ רשימה פֿון נישט-פֿאַראַנע לערערינס פֿאַרן אויסגעוועלטן טאָג. צוויי טישן: קראַנק/אורלויב + אין אַ פֿונקציע.' },
                { heading: 'חודשלעכער אָפּוועזנקייטן-באַריכט', body: 'אַ חודשלעכע מאַטריצע. X = טעגלעכע אָפּוועזנקייט, צאָל = שטונדן. צוויי באַזונדערע טישן.' },
                { heading: 'טעגלעכער מחליף-באַריכט', body: 'אַ רשימה פֿון מחלפים מיט זייערע באַצאָלטע שעהן אויפן אויסגעוועלטן טאָג.' },
                { heading: 'חודשלעכער מחליף-באַריכט', body: 'אַ חודשלעכע מאַטריצע פֿון באַצאָלטע פֿאַרטרעטונגס-שטונדן.' },
                { heading: 'ניט-באַצאָלטע פֿאַרטרעטונג', body: 'אַ חודשלעכע מאַטריצע בלויז פֿאַר ניט-באַצאָלטע פֿאַרטרעטונגן.' },
                { heading: 'דרוקן / PDF', body: 'דריקן "הדפסה / PDF" כּדי עקספּאָרטירן דעם באַריכט.' },
            ],
        },
        {
            id: 'data', icon: '⚙️', title: 'דאַטן-פֿאַרװאַלטונג',
            content: [
                { heading: 'עקספּאָרטירן דאַטן', body: 'גיין צו Admin › Data Management כּדי עקספּאָרטירן די גאַנצע דאַטנבאַנק ווי אַ JSON גיבוי-פֿייל.' },
                { heading: 'אַיינפֿירן פֿון Excel', body: 'אַיינפֿירן אַ שטונדן-פּלאַן פֿון אַ Excel-פֿייל. אַראָפּלאָדן דעם מוסטער, אויספֿילן, און אַרויפֿלאָדן.' },
                { heading: 'אָפּשטעלן', body: 'אַרויפֿלאָדן אַ JSON פֿייל כּדי אָפּשטעלן דאַטן פֿון אַ פֿריִערדיקן צושטאַנד.' },
            ],
        },
    ],
};

const langMeta: Record<Lang, { label: string; dir: 'rtl' | 'ltr'; title: string; subtitle: string; footer: string; back: string }> = {
    he: { label: 'עברית', dir: 'rtl', title: '📚 מדריך למשתמש', subtitle: 'מערכת ניהול שיעורים ומחליפים', footer: 'לעזרה נוספת פנה למנהל המערכת.', back: '← חזרה' },
    en: { label: 'English', dir: 'ltr', title: '📚 User Manual', subtitle: 'Teacher Schedule & Substitution Management System', footer: 'For further assistance, contact your system administrator.', back: '← Back' },
    yi: { label: 'יידיש', dir: 'rtl', title: '📚 באַניצער-מדריך', subtitle: 'לערערס שטונדן-פּלאַן און מחליפים-סיסטעם', footer: 'פֿאַר ווייַטערדיקע הילף, ווענדט זיך צום פֿאַרװאַלטער.', back: '← צוריק' },
};

export default function HelpPage() {
    const [lang, setLang] = useState<Lang>('he');
    const [expanded, setExpanded] = useState<string | null>(null);
    const data = sections[lang];
    const meta = langMeta[lang];

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6"
            dir={meta.dir}
            style={{ colorScheme: 'light', color: '#111827' }}
        >
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{meta.title}</h1>
                        <p className="text-gray-500 mt-1 text-sm">{meta.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            {(['he', 'yi', 'en'] as Lang[]).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`px-3 py-2 text-sm font-semibold transition-colors ${lang === l ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {langMeta[l].label}
                                </button>
                            ))}
                        </div>
                        <a href="/admin/teachers" className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium">
                            {meta.back}
                        </a>
                    </div>
                </div>

                {/* Quick nav pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {data.map(s => (
                        <button
                            key={s.id}
                            onClick={() => {
                                setExpanded(s.id);
                                document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition-colors shadow-sm"
                        >
                            {s.icon} {s.title}
                        </button>
                    ))}
                </div>

                {/* Sections */}
                <div className="space-y-3">
                    {data.map(section => (
                        <div key={section.id} id={`section-${section.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{section.icon}</span>
                                    <span className="text-lg font-bold text-gray-800">{section.title}</span>
                                </div>
                                <span className={`text-gray-400 transition-transform duration-200 ${expanded === section.id ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {expanded === section.id && (
                                <div className="border-t border-gray-100 px-6 py-4 space-y-4">
                                    {section.content.map((item, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="w-1 flex-shrink-0 bg-indigo-200 rounded-full mt-1" />
                                            <div>
                                                <h3 className="font-semibold text-gray-800 text-sm">{item.heading}</h3>
                                                <p className="text-gray-600 text-sm mt-0.5 leading-relaxed">{item.body}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-400 pb-8">{meta.footer}</div>
            </div>
        </div>
    );
}
