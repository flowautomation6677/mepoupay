export interface DateRange {
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
    currentMonth: number;
    currentYear: number;
}

export interface DashboardParams {
    startDate?: string;
    endDate?: string;
    month?: string;
    year?: string;
}

export function getDashboardRange(params: DashboardParams): DateRange {
    const today = new Date();

    const customStart = params?.startDate;
    const customEnd = params?.endDate;

    let startDate: string;
    let endDate: string;
    let currentMonth = today.getMonth() + 1;
    let currentYear = today.getFullYear();
    let prevStartDate: string;
    let prevEndDate: string;

    if (customStart && customEnd) {
        // Custom Range Mode
        startDate = new Date(customStart + 'T00:00:00').toISOString();
        endDate = new Date(customEnd + 'T23:59:59').toISOString();

        // Context: Previous period with same duration (Simplified: Previous month relative to start)
        const startD = new Date(startDate);
        prevStartDate = new Date(startD.getFullYear(), startD.getMonth() - 1, 1).toISOString();
        prevEndDate = new Date(startD.getFullYear(), startD.getMonth(), 0, 23, 59, 59).toISOString();
    } else {
        // Monthly Mode (Default)
        const year = params?.year ? parseInt(params.year) : currentYear;
        const month = params?.month ? parseInt(params.month) : currentMonth;

        currentMonth = month;
        currentYear = year;

        startDate = new Date(year, month - 1, 1).toISOString();
        endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

        // Previous Month
        prevStartDate = new Date(year, month - 2, 1).toISOString();
        prevEndDate = new Date(year, month - 1, 0, 23, 59, 59).toISOString();
    }

    return {
        startDate,
        endDate,
        prevStartDate,
        prevEndDate,
        currentMonth,
        currentYear
    };
}
