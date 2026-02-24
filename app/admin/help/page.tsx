'use client';

import { useState } from 'react';

type Lang = 'he' | 'en';

const sections = {
    he: [
        {
            id: 'login',
            icon: '🔐',
            title: 'התחברות למערכת',
            content: [
                { heading: 'גישה למערכת', body: 'המערכת נגישה דרך הדפדפן בכתובת הייעודית של בית הספר.' },
                { heading: 'שם משתמש ו-PIN', body: 'הזן את שם המשתמש (בדרך כלל שם משפחה בעברית) ואת קוד ה-PIN בן 4 ספרות שקיבלת מהמנהל/ת.' },
                { heading: 'רמות הרשאה', body: 'מנהל (Admin) — גישה מלאה לניהול. מורה — צפייה במערכת שיעורים אישית בלבד.' },
            ],
        },
        {
            id: 'teachers',
            icon: '👥',
            title: 'ניהול מורות',
            content: [
                { heading: 'דף המורות', body: 'נווט אל Admin › Teachers לצפייה ברשימת כל הצוות. מורות רגילות ומורות מחליפות מוצגות בנפרד.' },
                { heading: 'פרופיל מורה', body: 'לחץ על שם המורה לפתיחת כרטיס הפרופיל. ניתן לעדכן שם, מייל, טלפון ושם משתמש.' },
                { heading: 'PIN', body: 'מנהל יכול לצפות ולשנות את קוד ה-PIN של כל מורה דרך כרטיס הפרופיל.' },
                { heading: 'הוספת מורה', body: 'לחץ על כפתור "הוסף מורה" ומלא את הפרטים. ניתן לסמן מורה כ"ממלא מקום" (Substitute).' },
            ],
        },
        {
            id: 'schedule',
            icon: '📅',
            title: 'מערכת שיעורים ושיבוץ',
            content: [
                { heading: 'תבנית שבועית', body: 'בכרטיס המורה, לחץ על כפתור "+" בכל תא להוספת שיעור. בחר נושא, כיתה וסוג שיעור (רגיל / ישיבה / פרטני / פגישת צוות).' },
                { heading: 'ניהול היעדרויות', body: 'עבור ללשונית "ניהול שיבוץ" בכרטיס המורה. בחר שבוע בנווט, לחץ על שיעור וסמן כנעדר. התא יהפוך לאדום 🔴.' },
                { heading: 'שיבוץ מחליף', body: 'לחץ על תא אדום › "שבץ מחליף/ה" › בחר מורה מהרשימה › "Confirm". התא יהפוך לירוק 🟢.' },
                { heading: 'לא לתשלום', body: 'בעת שיבוץ מחליף, סמן את תיבת "לא לתשלום" אם שעה זו לא תחויב בגמול מילוי מקום.' },
                { heading: 'ביטול', body: 'לחץ על תא ירוק "בטל השמה / החזר למצב רגיל" לביטול שיבוץ.' },
            ],
        },
        {
            id: 'daily',
            icon: '⚡',
            title: 'מארגן יומי',
            content: [
                { heading: 'גישה', body: 'נווט אל Admin › Daily Organizer. השתמש בחצים לניווט בין תאריכים.' },
                { heading: 'סימון היעדרות', body: 'לחץ על שם המורה בטור השמאלי. בחר סיבה (מחלה / חופש / בתפקיד) ואז היעדרות יומית או שעתית.' },
                { heading: 'היעדרות יומית', body: 'מסמנת את כל שיעורי ההוראה הרגילים כנעדרים (אדום). אין חשיפה על שעות ישיבה / פרטני.' },
                { heading: 'היעדרות שעתית', body: 'לחץ על כל תא בודד בשורת המורה כדי לסמן שעה ספציפית כנעדרת.' },
                { heading: 'שיבוץ מחליף', body: 'לחץ על תא אדום בגריד. תפריט ממלאי מקום יופיע עם ציון עומס וזמינות כל מורה.' },
                { heading: 'סינון לא לתשלום', body: 'בתפריט השיבוץ, סמן את "לא לתשלום" לפני בחירת המורה אם שעה זו לא תחויב.' },
            ],
        },
        {
            id: 'reports',
            icon: '📊',
            title: 'דוחות',
            content: [
                { heading: 'היעדרויות יומי', body: 'רשימה של מורות נעדרות ביום הנבחר, מחולקת לטבלת מחלה/חופש וטבלת בתפקיד. כל שורה מציגה יומי (X) או מספר שעות.' },
                { heading: 'היעדרויות חודשי', body: 'מטריצה חודשית עם עמודה לכל יום, X להיעדרות יומית ומספר לשעתית. שתי טבלאות נפרדות (מחלה/חופש + בתפקיד).' },
                { heading: 'מ"מ יומי', body: 'רשימת ממלאי מקום ביום הנבחר, עם סה"כ שעות מילוי מקום בתשלום.' },
                { heading: 'מ"מ חודשי', body: 'מטריצה חודשית של שעות מילוי מקום בתשלום לכל ממלא מקום.' },
                { heading: 'מ"מ ללא תשלום', body: 'מטריצה חודשית של שעות מילוי מקום ללא תשלום בלבד.' },
                { heading: 'הדפסה / PDF', body: 'לחץ על כפתור "הדפסה / PDF" בפינה הימנית לייצוא הדוח.' },
            ],
        },
        {
            id: 'data',
            icon: '⚙️',
            title: 'כלי ניהול נתונים',
            content: [
                { heading: 'ייצוא נתונים', body: 'נווט אל Admin › Data Management לייצוא מסד הנתונים כולו לקובץ JSON לגיבוי.' },
                { heading: 'ייבוא מ-Excel', body: 'ייבוא מערכת שיעורים ממסד Excel קיים. הורד את תבנית ה-Excel, מלא את הנתונים והעלה.' },
                { heading: 'שחזור', body: 'ניתן להעלות קובץ JSON מגיבוי קודם לשחזור נתוני המערכת.' },
            ],
        },
    ],
    en: [
        {
            id: 'login',
            icon: '🔐',
            title: 'Getting Started',
            content: [
                { heading: 'Accessing the App', body: 'The system is accessible via browser at your school\'s dedicated URL.' },
                { heading: 'Username & PIN', body: 'Enter your username (usually your last name in Hebrew) and your 4-digit PIN given to you by the administrator.' },
                { heading: 'Access Levels', body: 'Admin — full management access. Teacher — view-only access to personal schedule.' },
            ],
        },
        {
            id: 'teachers',
            icon: '👥',
            title: 'Teacher Management',
            content: [
                { heading: 'Teachers Dashboard', body: 'Navigate to Admin › Teachers to view the full staff list. Regular teachers and substitutes are displayed separately.' },
                { heading: 'Teacher Profile', body: 'Click a teacher\'s name to open their profile card. You can update name, email, phone, and login username.' },
                { heading: 'PIN Management', body: 'Admins can view and change any teacher\'s login PIN from the profile card.' },
                { heading: 'Adding a Teacher', body: 'Click "Add Teacher" and fill in the details. You can flag a teacher as a "Substitute".' },
            ],
        },
        {
            id: 'schedule',
            icon: '📅',
            title: 'Schedule & Substitutions',
            content: [
                { heading: 'Weekly Template', body: 'In the teacher profile, click "+" in any cell to add a class. Select Subject, Class, and Period Type (Regular, Stay, Individual, or Team Meeting).' },
                { heading: 'Marking Absences', body: 'Go to the "Manage Substitutions" tab in the teacher profile. Select a week, click a class cell, and choose "Mark as Absent". The cell turns red 🔴.' },
                { heading: 'Assigning a Substitute', body: 'Click a red cell › "Assign Substitute" › pick a teacher › "Confirm". The cell turns green 🟢.' },
                { heading: 'Not for Pay', body: 'When assigning a substitute, check "לא לתשלום" (No Pay) if this substitution should not count for pay.' },
                { heading: 'Cancelling', body: 'Click a green cell › "Cancel Assignment / Revert to Normal" to undo a substitution.' },
            ],
        },
        {
            id: 'daily',
            icon: '⚡',
            title: 'Daily Organizer',
            content: [
                { heading: 'Access', body: 'Navigate to Admin › Daily Organizer. Use the date arrows to navigate between days.' },
                { heading: 'Marking Absence', body: 'Click a teacher\'s name in the left column. Select a reason (Sick / Vacation / On-Duty) then choose Daily or Hourly absence.' },
                { heading: 'Daily Absence', body: 'Marks all regular teaching periods as absent (red). Stay, Individual, and Meeting periods are not flagged.' },
                { heading: 'Hourly Absence', body: 'Click individual cells in the teacher\'s row to mark specific hours as absent.' },
                { heading: 'Assigning Substitutes', body: 'Click a red cell in the grid. A picker appears showing each available teacher\'s current workload and availability.' },
                { heading: 'No-Pay Filter', body: 'In the substitute picker, tick "לא לתשלום" before selecting the teacher if the hour should not be paid.' },
            ],
        },
        {
            id: 'reports',
            icon: '📊',
            title: 'Reports',
            content: [
                { heading: 'Daily Absence Report', body: 'Lists absent teachers for the selected day, split into Sick/Vacation and On-Duty tables. Each row shows daily (X) or hourly count.' },
                { heading: 'Monthly Absence Report', body: 'Monthly matrix with one column per day. X = daily absence, number = hourly count. Two separate tables (Sick/Vacation + On-Duty).' },
                { heading: 'Daily Sub Report', body: 'Lists substituting teachers for the selected day with their total paid substitution hours.' },
                { heading: 'Monthly Sub Report', body: 'Monthly matrix showing paid substitution hours per teacher per day.' },
                { heading: 'No-Pay Sub Report', body: 'Monthly matrix for unpaid substitutions only.' },
                { heading: 'Print / PDF', body: 'Click "Print / PDF" in the top right to export the current report.' },
            ],
        },
        {
            id: 'data',
            icon: '⚙️',
            title: 'Data Management',
            content: [
                { heading: 'Export Data', body: 'Navigate to Admin › Data Management to export the full database as a JSON backup file.' },
                { heading: 'Import from Excel', body: 'Import a schedule from an existing Excel file. Download the template, fill in the data, and upload.' },
                { heading: 'Restore', body: 'Upload a JSON backup file to restore system data from a previous state.' },
            ],
        },
    ],
};

export default function HelpPage() {
    const [lang, setLang] = useState<Lang>('he');
    const [expanded, setExpanded] = useState<string | null>(null);
    const data = sections[lang];
    const isHe = lang === 'he';

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6"
            dir={isHe ? 'rtl' : 'ltr'}
            style={{ colorScheme: 'light', color: '#111827' }}
        >
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {isHe ? '📚 מדריך למשתמש' : '📚 User Manual'}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {isHe ? 'מערכת ניהול שיעורים ומחליפים' : 'Teacher Schedule & Substitution Management System'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language Toggle */}
                        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setLang('he')}
                                className={`px-4 py-2 text-sm font-semibold transition-colors ${lang === 'he' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                עברית
                            </button>
                            <button
                                onClick={() => setLang('en')}
                                className={`px-4 py-2 text-sm font-semibold transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                English
                            </button>
                        </div>
                        <a
                            href="/admin/teachers"
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium"
                        >
                            {isHe ? '← חזרה' : '← Back'}
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
                        <div
                            key={section.id}
                            id={`section-${section.id}`}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{section.icon}</span>
                                    <span className="text-lg font-bold text-gray-800">{section.title}</span>
                                </div>
                                <span className={`text-gray-400 transition-transform duration-200 ${expanded === section.id ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* Section Content */}
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
                <div className="mt-8 text-center text-xs text-gray-400 pb-8">
                    {isHe ? 'לעזרה נוספת פנה למנהל המערכת.' : 'For further assistance, contact your system administrator.'}
                </div>
            </div>
        </div>
    );
}
