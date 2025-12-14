// Standard mutations (direct DynamoDB access - deprecated, use trusted mutations)
export const createCouple: string;
export const updateCouple: string;
export const deleteCouple: string;
export const createExpense: string;
export const updateExpense: string;
export const deleteExpense: string;
export const createSettlement: string;
export const updateSettlement: string;
export const deleteSettlement: string;
export const processReceipt: string;

// Trusted mutations (go through Lambda write service with aggregate updates)
export const createCoupleTrusted: string;
export const joinCoupleByInviteCode: string;
export const createExpenseTrusted: string;
export const updateExpenseTrusted: string;
export const deleteExpenseTrusted: string;
export const createSettlementTrusted: string;
export const updateSettlementTrusted: string;
export const deleteSettlementTrusted: string;
export const recalculateCoupleAggregates: string;
