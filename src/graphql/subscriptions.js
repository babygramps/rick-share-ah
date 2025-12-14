/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateCouple = /* GraphQL */ `
  subscription OnCreateCouple($filter: ModelSubscriptionCoupleFilterInput) {
    onCreateCouple(filter: $filter) {
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
export const onUpdateCouple = /* GraphQL */ `
  subscription OnUpdateCouple($filter: ModelSubscriptionCoupleFilterInput) {
    onUpdateCouple(filter: $filter) {
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
export const onDeleteCouple = /* GraphQL */ `
  subscription OnDeleteCouple($filter: ModelSubscriptionCoupleFilterInput) {
    onDeleteCouple(filter: $filter) {
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
export const onCreateExpense = /* GraphQL */ `
  subscription OnCreateExpense($filter: ModelSubscriptionExpenseFilterInput) {
    onCreateExpense(filter: $filter) {
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
export const onUpdateExpense = /* GraphQL */ `
  subscription OnUpdateExpense($filter: ModelSubscriptionExpenseFilterInput) {
    onUpdateExpense(filter: $filter) {
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
export const onDeleteExpense = /* GraphQL */ `
  subscription OnDeleteExpense($filter: ModelSubscriptionExpenseFilterInput) {
    onDeleteExpense(filter: $filter) {
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
export const onCreateSettlement = /* GraphQL */ `
  subscription OnCreateSettlement(
    $filter: ModelSubscriptionSettlementFilterInput
  ) {
    onCreateSettlement(filter: $filter) {
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
export const onUpdateSettlement = /* GraphQL */ `
  subscription OnUpdateSettlement(
    $filter: ModelSubscriptionSettlementFilterInput
  ) {
    onUpdateSettlement(filter: $filter) {
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
export const onDeleteSettlement = /* GraphQL */ `
  subscription OnDeleteSettlement(
    $filter: ModelSubscriptionSettlementFilterInput
  ) {
    onDeleteSettlement(filter: $filter) {
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
