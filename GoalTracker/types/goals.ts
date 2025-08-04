export interface Goal {
    id: number;
    name: string;
    description: string;
    targetDate: string;
    targetNumber: number;
    targetUnit: string;
    completed?: number; // 0 = not completed, 1 = completed
    photos?: string[]; // array of photo paths
}

export interface ValidationErrors {
    name?: string;
    description?: string;
    targetDate?: string;
    targetNumber?: string;
    targetUnit?: string;
}