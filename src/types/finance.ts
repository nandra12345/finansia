export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: TransactionType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export interface Goal {
  id: string;
  title: string;
  category: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  expectedAnnualReturn: number;
  createdAt: string;
  updatedAt: string;
}

export type GoalInput = Omit<Goal, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export interface DiaryNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date: string;
  relatedGoalIds: string[];
  relatedTransactionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type DiaryNoteInput = Omit<
  DiaryNote,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

export const TRANSACTION_CATEGORIES = [
  "Food",
  "Bills",
  "Transport",
  "Entertainment",
  "Education",
  "Shopping",
  "Healthcare",
  "Travel",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
] as const;

export const GOAL_CATEGORIES = [
  "House",
  "Business",
  "Vacation",
  "Emergency Fund",
  "Gadget",
  "Vehicle",
  "Education",
  "Retirement",
  "Other",
] as const;

