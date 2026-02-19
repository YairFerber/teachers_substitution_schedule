export interface Teacher {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
}

export interface Class {
    id: string;
    name: string;
}

export interface Substitution {
    id: string;
    date: string; // ISO date string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    substituteTeacherId?: string;
}

export interface ScheduleItem {
    id: string;
    teacherId: string;
    dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
    hourIndex: number; // 1-10
    classId: string | null;
    class?: Class | null;
    subject?: string | null;
    type: 'REGULAR' | 'FREE' | 'TEAM_MEETING' | 'STAY' | 'INDIVIDUAL' | 'MEETING' | 'ABSENT_DISPLAY' | 'COVERED_ABSENCE_DISPLAY' | 'COVERED_DISPLAY';
    substitutions?: Substitution[];
}

export interface Period {
    index: number;
    startTime: string;
    endTime: string;
}
