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
export const getChatThread = /* GraphQL */ `
  query GetChatThread($id: ID!) {
    getChatThread(id: $id) {
      id
      userId
      groupId
      title
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listChatThreads = /* GraphQL */ `
  query ListChatThreads(
    $filter: ModelChatThreadFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChatThreads(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        groupId
        title
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getChatMessage = /* GraphQL */ `
  query GetChatMessage($id: ID!) {
    getChatMessage(id: $id) {
      id
      userId
      groupId
      threadId
      role
      content
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listChatMessages = /* GraphQL */ `
  query ListChatMessages(
    $filter: ModelChatMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChatMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        groupId
        threadId
        role
        content
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getChatJob = /* GraphQL */ `
  query GetChatJob($id: ID!) {
    getChatJob(id: $id) {
      id
      userId
      groupId
      threadId
      userMessageId
      assistantMessageId
      status
      statusText
      error
      createdAt
      updatedAt
      startedAt
      completedAt
      __typename
    }
  }
`;
export const listChatJobs = /* GraphQL */ `
  query ListChatJobs(
    $filter: ModelChatJobFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChatJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        groupId
        threadId
        userMessageId
        assistantMessageId
        status
        statusText
        error
        createdAt
        updatedAt
        startedAt
        completedAt
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
export const chatThreadsByUserAndGroup = /* GraphQL */ `
  query ChatThreadsByUserAndGroup(
    $userId: String!
    $groupIdUpdatedAt: ModelChatThreadByUserAndGroupCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelChatThreadFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chatThreadsByUserAndGroup(
      userId: $userId
      groupIdUpdatedAt: $groupIdUpdatedAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        groupId
        title
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const chatMessagesByUserAndGroup = /* GraphQL */ `
  query ChatMessagesByUserAndGroup(
    $userId: String!
    $groupIdCreatedAt: ModelChatMessageByUserAndGroupCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelChatMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chatMessagesByUserAndGroup(
      userId: $userId
      groupIdCreatedAt: $groupIdCreatedAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        groupId
        threadId
        role
        content
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const chatMessagesByThread = /* GraphQL */ `
  query ChatMessagesByThread(
    $threadId: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelChatMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chatMessagesByThread(
      threadId: $threadId
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        groupId
        threadId
        role
        content
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const chatJobsByUserAndGroup = /* GraphQL */ `
  query ChatJobsByUserAndGroup(
    $userId: String!
    $groupIdCreatedAt: ModelChatJobByUserAndGroupCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelChatJobFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chatJobsByUserAndGroup(
      userId: $userId
      groupIdCreatedAt: $groupIdCreatedAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        groupId
        threadId
        userMessageId
        assistantMessageId
        status
        statusText
        error
        createdAt
        updatedAt
        startedAt
        completedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const chatJobsByThread = /* GraphQL */ `
  query ChatJobsByThread(
    $threadId: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelChatJobFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chatJobsByThread(
      threadId: $threadId
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        groupId
        threadId
        userMessageId
        assistantMessageId
        status
        statusText
        error
        createdAt
        updatedAt
        startedAt
        completedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
