/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateGroup = /* GraphQL */ `
  subscription OnCreateGroup(
    $filter: ModelSubscriptionGroupFilterInput
    $owner: String
  ) {
    onCreateGroup(filter: $filter, owner: $owner) {
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
export const onUpdateGroup = /* GraphQL */ `
  subscription OnUpdateGroup(
    $filter: ModelSubscriptionGroupFilterInput
    $owner: String
  ) {
    onUpdateGroup(filter: $filter, owner: $owner) {
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
export const onDeleteGroup = /* GraphQL */ `
  subscription OnDeleteGroup(
    $filter: ModelSubscriptionGroupFilterInput
    $owner: String
  ) {
    onDeleteGroup(filter: $filter, owner: $owner) {
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
export const onCreateCouple = /* GraphQL */ `
  subscription OnCreateCouple(
    $filter: ModelSubscriptionCoupleFilterInput
    $owner: String
  ) {
    onCreateCouple(filter: $filter, owner: $owner) {
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
export const onUpdateCouple = /* GraphQL */ `
  subscription OnUpdateCouple(
    $filter: ModelSubscriptionCoupleFilterInput
    $owner: String
  ) {
    onUpdateCouple(filter: $filter, owner: $owner) {
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
export const onDeleteCouple = /* GraphQL */ `
  subscription OnDeleteCouple(
    $filter: ModelSubscriptionCoupleFilterInput
    $owner: String
  ) {
    onDeleteCouple(filter: $filter, owner: $owner) {
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
export const onCreateGroupMember = /* GraphQL */ `
  subscription OnCreateGroupMember(
    $filter: ModelSubscriptionGroupMemberFilterInput
    $owner: String
  ) {
    onCreateGroupMember(filter: $filter, owner: $owner) {
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
export const onUpdateGroupMember = /* GraphQL */ `
  subscription OnUpdateGroupMember(
    $filter: ModelSubscriptionGroupMemberFilterInput
    $owner: String
  ) {
    onUpdateGroupMember(filter: $filter, owner: $owner) {
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
export const onDeleteGroupMember = /* GraphQL */ `
  subscription OnDeleteGroupMember(
    $filter: ModelSubscriptionGroupMemberFilterInput
    $owner: String
  ) {
    onDeleteGroupMember(filter: $filter, owner: $owner) {
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
export const onCreateExpense = /* GraphQL */ `
  subscription OnCreateExpense(
    $filter: ModelSubscriptionExpenseFilterInput
    $owner: String
  ) {
    onCreateExpense(filter: $filter, owner: $owner) {
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
export const onUpdateExpense = /* GraphQL */ `
  subscription OnUpdateExpense(
    $filter: ModelSubscriptionExpenseFilterInput
    $owner: String
  ) {
    onUpdateExpense(filter: $filter, owner: $owner) {
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
export const onDeleteExpense = /* GraphQL */ `
  subscription OnDeleteExpense(
    $filter: ModelSubscriptionExpenseFilterInput
    $owner: String
  ) {
    onDeleteExpense(filter: $filter, owner: $owner) {
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
export const onCreateSettlement = /* GraphQL */ `
  subscription OnCreateSettlement(
    $filter: ModelSubscriptionSettlementFilterInput
    $owner: String
  ) {
    onCreateSettlement(filter: $filter, owner: $owner) {
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
export const onUpdateSettlement = /* GraphQL */ `
  subscription OnUpdateSettlement(
    $filter: ModelSubscriptionSettlementFilterInput
    $owner: String
  ) {
    onUpdateSettlement(filter: $filter, owner: $owner) {
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
export const onDeleteSettlement = /* GraphQL */ `
  subscription OnDeleteSettlement(
    $filter: ModelSubscriptionSettlementFilterInput
    $owner: String
  ) {
    onDeleteSettlement(filter: $filter, owner: $owner) {
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
export const onCreateUserPreferences = /* GraphQL */ `
  subscription OnCreateUserPreferences(
    $filter: ModelSubscriptionUserPreferencesFilterInput
    $owner: String
  ) {
    onCreateUserPreferences(filter: $filter, owner: $owner) {
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
export const onUpdateUserPreferences = /* GraphQL */ `
  subscription OnUpdateUserPreferences(
    $filter: ModelSubscriptionUserPreferencesFilterInput
    $owner: String
  ) {
    onUpdateUserPreferences(filter: $filter, owner: $owner) {
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
export const onDeleteUserPreferences = /* GraphQL */ `
  subscription OnDeleteUserPreferences(
    $filter: ModelSubscriptionUserPreferencesFilterInput
    $owner: String
  ) {
    onDeleteUserPreferences(filter: $filter, owner: $owner) {
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
