/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getGroup = /* GraphQL */ `
  query GetGroup($id: ID!) {
    getGroup(id: $id) {
      id
      type
      name
      inviteCode
      members {
        nextToken
        __typename
      }
      expenses {
        nextToken
        __typename
      }
      settlements {
        nextToken
        __typename
      }
      ownerId
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listGroups = /* GraphQL */ `
  query ListGroups(
    $filter: ModelGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroups(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        type
        name
        inviteCode
        ownerId
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
export const groupsByInviteCode = /* GraphQL */ `
  query GroupsByInviteCode(
    $inviteCode: String!
    $sortDirection: ModelSortDirection
    $filter: ModelGroupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    groupsByInviteCode(
      inviteCode: $inviteCode
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        type
        name
        inviteCode
        ownerId
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
export const getGroupMember = /* GraphQL */ `
  query GetGroupMember($id: ID!) {
    getGroupMember(id: $id) {
      id
      groupId
      group {
        id
        type
        name
        inviteCode
        ownerId
        createdAt
        updatedAt
        owner
        __typename
      }
      userId
      name
      email
      role
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listGroupMembers = /* GraphQL */ `
  query ListGroupMembers(
    $filter: ModelGroupMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroupMembers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        groupId
        userId
        name
        email
        role
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
export const groupMembersByGroupId = /* GraphQL */ `
  query GroupMembersByGroupId(
    $groupId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelGroupMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    groupMembersByGroupId(
      groupId: $groupId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        groupId
        userId
        name
        email
        role
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
export const groupMembersByUserId = /* GraphQL */ `
  query GroupMembersByUserId(
    $userId: String!
    $sortDirection: ModelSortDirection
    $filter: ModelGroupMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    groupMembersByUserId(
      userId: $userId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        groupId
        userId
        name
        email
        role
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
      groupId
      group {
        id
        type
        name
        inviteCode
        ownerId
        createdAt
        updatedAt
        owner
        __typename
      }
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
      shares
      category
      date
      note
      createdAt
      updatedAt
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
        groupId
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        shares
        category
        date
        note
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
export const expensesByGroupId = /* GraphQL */ `
  query ExpensesByGroupId(
    $groupId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelExpenseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    expensesByGroupId(
      groupId: $groupId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        groupId
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        shares
        category
        date
        note
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
        groupId
        coupleId
        description
        amount
        paidBy
        splitType
        partner1Share
        partner2Share
        shares
        category
        date
        note
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
export const getSettlement = /* GraphQL */ `
  query GetSettlement($id: ID!) {
    getSettlement(id: $id) {
      id
      groupId
      group {
        id
        type
        name
        inviteCode
        ownerId
        createdAt
        updatedAt
        owner
        __typename
      }
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
        groupId
        coupleId
        amount
        paidBy
        paidTo
        date
        note
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
export const settlementsByGroupId = /* GraphQL */ `
  query SettlementsByGroupId(
    $groupId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSettlementFilterInput
    $limit: Int
    $nextToken: String
  ) {
    settlementsByGroupId(
      groupId: $groupId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        groupId
        coupleId
        amount
        paidBy
        paidTo
        date
        note
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
        groupId
        coupleId
        amount
        paidBy
        paidTo
        date
        note
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
export const getUserPreferences = /* GraphQL */ `
  query GetUserPreferences($id: ID!) {
    getUserPreferences(id: $id) {
      id
      userId
      theme
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const listUserPreferences = /* GraphQL */ `
  query ListUserPreferences(
    $filter: ModelUserPreferencesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserPreferences(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        theme
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
export const userPreferencesByUserId = /* GraphQL */ `
  query UserPreferencesByUserId(
    $userId: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserPreferencesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    userPreferencesByUserId(
      userId: $userId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        theme
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
