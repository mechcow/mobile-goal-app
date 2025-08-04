import { Goal, ValidationErrors } from "../types/goals";

// Validation functions for each field
export const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
        return 'Goal name is required';
    }
    if (name.trim().length > 50) {
        return 'Goal name too long, must be less than 50 characters';
    }
    return undefined;
};

export const validateDescription = (description: string): string | undefined => {
    if (description.trim().length > 200) {
        return 'Goal description too long, must be less than 200 characters';
    }
    return undefined;
};

export const validateTargetDate = (targetDate: string): string | undefined => {
    if (!targetDate) {
        return 'Target date is required';
    }
    const date = new Date(targetDate);
    if (isNaN(date.getTime())) {
        return 'Invalid date format';
    }
    if (date < new Date()) {
        return 'Target date cannot be in the past';
    }
    return undefined;
};

export const validateTargetNumber = (targetNumber: number): string | undefined => {
    if (targetNumber <= 0) {
        return 'Target number must be greater than 0';
    }
    return undefined;
};

export const validateTargetUnit = (targetUnit: string): string | undefined => {
    if (!targetUnit.trim()) {
        return 'Target unit is required';
    }
    return undefined;
};

export const validateGoal = (goal: Goal): ValidationErrors => {
    return {
        name: validateName(goal.name),
        description: validateDescription(goal.description),
        targetDate: validateTargetDate(goal.targetDate),
        targetNumber: validateTargetNumber(goal.targetNumber),
        targetUnit: validateTargetUnit(goal.targetUnit),
    };
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
    return Object.values(errors).some(error => error !== undefined);
};