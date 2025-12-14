/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createCouple = /* GraphQL */ `
  mutation CreateCouple(
    $input: CreateCoupleInput!
    $condition: ModelCoupleConditionInput
  ) {
    createCouple(input: $input, condition: $condition) {
      id
      owners
      name
      partner1Id
      partner1Name
      partner1Email
      partner2Id
      partner2Name
      partner2Email
      inviteCode
      defaultSplitPercent
      expenses {
        nextToken
        __typename
      }
      settlements {
        nextToken
        __typename
      }
      expenseCount
      settlementCount
      partner1TotalPaid
      partner2TotalPaid
      partner1TotalOwes
      partner2TotalOwes
      netBalance
      lastCalculatedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateCouple = /* GraphQL */ `
  mutation UpdateCouple(
    $input: UpdateCoupleInput!
    $condition: ModelCoupleConditionInput
  ) {
    updateCouple(input: $input, condition: $condition) {
      id
      owners
      name
      partner1Id
      partner1Name
      partner1Email
      partner2Id
      partner2Name
      partner2Email
      inviteCode
      defaultSplitPercent
      expenses {
        nextToken
        __typename
      }
      settlements {
        nextToken
        __typename
      }
      expenseCount
      settlementCount
      partner1TotalPaid
      partner2TotalPaid
      partner1TotalOwes
      partner2TotalOwes
      netBalance
      lastCalculatedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteCouple = /* GraphQL */ `
  mutation DeleteCouple(
    $input: DeleteCoupleInput!
    $condition: ModelCoupleConditionInput
  ) {
    deleteCouple(input: $input, condition: $condition) {
      id
      owners
      name
      partner1Id
      partner1Name
      partner1Email
      partner2Id
      partner2Name
      partner2Email
      inviteCode
      defaultSplitPercent
      expenses {
        nextToken
        __typename
      }
      settlements {
        nextToken
        __typename
      }
      expenseCount
      settlementCount
      partner1TotalPaid
      partner2TotalPaid
      partner1TotalOwes
      partner2TotalOwes
      netBalance
      lastCalculatedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createExpense = /* GraphQL */ `
  mutation CreateExpense(
    $input: CreateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    createExpense(input: $input, condition: $condition) {
      id
      owners
      coupleId
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      description
      amount
      paidBy
      splitType
      partner1Share
      partner2Share
      category
      date
      note
      createdAt
      updatedAt
      coupleExpensesId
      __typename
    }
  }
`;
export const updateExpense = /* GraphQL */ `
  mutation UpdateExpense(
    $input: UpdateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    updateExpense(input: $input, condition: $condition) {
      id
      owners
      coupleId
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      description
      amount
      paidBy
      splitType
      partner1Share
      partner2Share
      category
      date
      note
      createdAt
      updatedAt
      coupleExpensesId
      __typename
    }
  }
`;
export const deleteExpense = /* GraphQL */ `
  mutation DeleteExpense(
    $input: DeleteExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    deleteExpense(input: $input, condition: $condition) {
      id
      owners
      coupleId
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      description
      amount
      paidBy
      splitType
      partner1Share
      partner2Share
      category
      date
      note
      createdAt
      updatedAt
      coupleExpensesId
      __typename
    }
  }
`;
export const createSettlement = /* GraphQL */ `
  mutation CreateSettlement(
    $input: CreateSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    createSettlement(input: $input, condition: $condition) {
      id
      owners
      coupleId
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      amount
      paidBy
      paidTo
      date
      note
      createdAt
      updatedAt
      coupleSettlementsId
      __typename
    }
  }
`;
export const updateSettlement = /* GraphQL */ `
  mutation UpdateSettlement(
    $input: UpdateSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    updateSettlement(input: $input, condition: $condition) {
      id
      owners
      coupleId
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      amount
      paidBy
      paidTo
      date
      note
      createdAt
      updatedAt
      coupleSettlementsId
      __typename
    }
  }
`;
export const deleteSettlement = /* GraphQL */ `
  mutation DeleteSettlement(
    $input: DeleteSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    deleteSettlement(input: $input, condition: $condition) {
      id
      owners
      coupleId
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      amount
      paidBy
      paidTo
      date
      note
      createdAt
      updatedAt
      coupleSettlementsId
      __typename
    }
  }
`;
export const processReceipt = /* GraphQL */ `
  mutation ProcessReceipt($imageKey: String!) {
    processReceipt(imageKey: $imageKey) {
      id
      status
      merchantName
      totalAmount
      date
      category
      confidence
      lineItems {
        description
        price
        quantity
        __typename
      }
      rawText
      imageUrl
      __typename
    }
  }
`;
export const createCoupleTrusted = /* GraphQL */ `
  mutation CreateCoupleTrusted($input: CreateCoupleInput!) {
    createCoupleTrusted(input: $input) {
      success
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const joinCoupleByInviteCode = /* GraphQL */ `
  mutation JoinCoupleByInviteCode($input: JoinCoupleInput!) {
    joinCoupleByInviteCode(input: $input) {
      success
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const createExpenseTrusted = /* GraphQL */ `
  mutation CreateExpenseTrusted($input: CreateExpenseInput!) {
    createExpenseTrusted(input: $input) {
      success
      expense {
        id
        owners
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        category
        date
        note
        createdAt
        updatedAt
        coupleExpensesId
        __typename
      }
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const updateExpenseTrusted = /* GraphQL */ `
  mutation UpdateExpenseTrusted($input: UpdateExpenseInput!) {
    updateExpenseTrusted(input: $input) {
      success
      expense {
        id
        owners
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        category
        date
        note
        createdAt
        updatedAt
        coupleExpensesId
        __typename
      }
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const deleteExpenseTrusted = /* GraphQL */ `
  mutation DeleteExpenseTrusted($input: DeleteExpenseInput!) {
    deleteExpenseTrusted(input: $input) {
      success
      expense {
        id
        owners
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        category
        date
        note
        createdAt
        updatedAt
        coupleExpensesId
        __typename
      }
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const createSettlementTrusted = /* GraphQL */ `
  mutation CreateSettlementTrusted($input: CreateSettlementInput!) {
    createSettlementTrusted(input: $input) {
      success
      settlement {
        id
        owners
        coupleId
        amount
        paidBy
        paidTo
        date
        note
        createdAt
        updatedAt
        coupleSettlementsId
        __typename
      }
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const updateSettlementTrusted = /* GraphQL */ `
  mutation UpdateSettlementTrusted($input: UpdateSettlementInput!) {
    updateSettlementTrusted(input: $input) {
      success
      settlement {
        id
        owners
        coupleId
        amount
        paidBy
        paidTo
        date
        note
        createdAt
        updatedAt
        coupleSettlementsId
        __typename
      }
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const deleteSettlementTrusted = /* GraphQL */ `
  mutation DeleteSettlementTrusted($input: DeleteSettlementInput!) {
    deleteSettlementTrusted(input: $input) {
      success
      settlement {
        id
        owners
        coupleId
        amount
        paidBy
        paidTo
        date
        note
        createdAt
        updatedAt
        coupleSettlementsId
        __typename
      }
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      clientMutationId
      __typename
    }
  }
`;
export const recalculateCoupleAggregates = /* GraphQL */ `
  mutation RecalculateCoupleAggregates($coupleId: ID!) {
    recalculateCoupleAggregates(coupleId: $coupleId) {
      success
      couple {
        id
        owners
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        expenseCount
        settlementCount
        partner1TotalPaid
        partner2TotalPaid
        partner1TotalOwes
        partner2TotalOwes
        netBalance
        lastCalculatedAt
        createdAt
        updatedAt
        __typename
      }
      error
      __typename
    }
  }
`;
