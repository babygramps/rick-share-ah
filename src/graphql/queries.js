/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getCouple = /* GraphQL */ `
  query GetCouple($id: ID!) {
    getCouple(id: $id) {
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
export const listCouples = /* GraphQL */ `
  query ListCouples(
    $filter: ModelCoupleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCouples(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const couplesByInviteCode = /* GraphQL */ `
  query CouplesByInviteCode(
    $inviteCode: String!
    $sortDirection: ModelSortDirection
    $filter: ModelCoupleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    couplesByInviteCode(
      inviteCode: $inviteCode
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getExpense = /* GraphQL */ `
  query GetExpense($id: ID!) {
    getExpense(id: $id) {
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
export const listExpenses = /* GraphQL */ `
  query ListExpenses(
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExpenses(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const expensesByCoupleIdAndDate = /* GraphQL */ `
  query ExpensesByCoupleIdAndDate(
    $coupleId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    expensesByCoupleIdAndDate(
      coupleId: $coupleId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSettlement = /* GraphQL */ `
  query GetSettlement($id: ID!) {
    getSettlement(id: $id) {
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
export const listSettlements = /* GraphQL */ `
  query ListSettlements(
    $filter: ModelSettlementFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSettlements(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const settlementsByCoupleIdAndDate = /* GraphQL */ `
  query SettlementsByCoupleIdAndDate(
    $coupleId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelSettlementFilterInput
    $limit: Int
    $nextToken: String
  ) {
    settlementsByCoupleIdAndDate(
      coupleId: $coupleId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
