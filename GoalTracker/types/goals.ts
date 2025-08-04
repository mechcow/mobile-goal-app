export interface Goal {
    id: number;
    name: string;
    description: string;
    targetDate: string;
    completed: number; // 0 = not completed, 1 = completed
}