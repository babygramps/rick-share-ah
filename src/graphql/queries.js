/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getCouple = /* GraphQL */ `
  query GetCouple($id: ID!) {
    getCouple(id: $id) {
      id
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
      createdAt
      updatedAt
      owner
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
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        createdAt
        updatedAt
        owner
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
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        createdAt
        updatedAt
        owner
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
      coupleId
      couple {
        id
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        createdAt
        updatedAt
        owner
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
      owner
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
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const expensesByCoupleId = /* GraphQL */ `
  query ExpensesByCoupleId(
    $coupleId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    expensesByCoupleId(
      coupleId: $coupleId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
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
        owner
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
      coupleId
      couple {
        id
        name
        partner1Id
        partner1Name
        partner1Email
        partner2Id
        partner2Name
        partner2Email
        inviteCode
        defaultSplitPercent
        createdAt
        updatedAt
        owner
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
      owner
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
        coupleId
        amount
        paidBy
        paidTo
        date
        note
        createdAt
        updatedAt
        coupleSettlementsId
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const settlementsByCoupleId = /* GraphQL */ `
  query SettlementsByCoupleId(
    $coupleId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSettlementFilterInput
    $limit: Int
    $nextToken: String
  ) {
    settlementsByCoupleId(
      coupleId: $coupleId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        coupleId
        amount
        paidBy
        paidTo
        date
        note
        createdAt
        updatedAt
        coupleSettlementsId
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;
