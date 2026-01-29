/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createGroup = /* GraphQL */ `
  mutation CreateGroup(
    $input: CreateGroupInput!
    $condition: ModelGroupConditionInput
  ) {
    createGroup(input: $input, condition: $condition) {
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
export const updateGroup = /* GraphQL */ `
  mutation UpdateGroup(
    $input: UpdateGroupInput!
    $condition: ModelGroupConditionInput
  ) {
    updateGroup(input: $input, condition: $condition) {
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
export const deleteGroup = /* GraphQL */ `
  mutation DeleteGroup(
    $input: DeleteGroupInput!
    $condition: ModelGroupConditionInput
  ) {
    deleteGroup(input: $input, condition: $condition) {
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
export const createCouple = /* GraphQL */ `
  mutation CreateCouple(
    $input: CreateCoupleInput!
    $condition: ModelCoupleConditionInput
  ) {
    createCouple(input: $input, condition: $condition) {
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
export const updateCouple = /* GraphQL */ `
  mutation UpdateCouple(
    $input: UpdateCoupleInput!
    $condition: ModelCoupleConditionInput
  ) {
    updateCouple(input: $input, condition: $condition) {
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
export const deleteCouple = /* GraphQL */ `
  mutation DeleteCouple(
    $input: DeleteCoupleInput!
    $condition: ModelCoupleConditionInput
  ) {
    deleteCouple(input: $input, condition: $condition) {
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
export const createGroupMember = /* GraphQL */ `
  mutation CreateGroupMember(
    $input: CreateGroupMemberInput!
    $condition: ModelGroupMemberConditionInput
  ) {
    createGroupMember(input: $input, condition: $condition) {
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
export const updateGroupMember = /* GraphQL */ `
  mutation UpdateGroupMember(
    $input: UpdateGroupMemberInput!
    $condition: ModelGroupMemberConditionInput
  ) {
    updateGroupMember(input: $input, condition: $condition) {
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
export const deleteGroupMember = /* GraphQL */ `
  mutation DeleteGroupMember(
    $input: DeleteGroupMemberInput!
    $condition: ModelGroupMemberConditionInput
  ) {
    deleteGroupMember(input: $input, condition: $condition) {
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
export const createExpense = /* GraphQL */ `
  mutation CreateExpense(
    $input: CreateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    createExpense(input: $input, condition: $condition) {
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
export const updateExpense = /* GraphQL */ `
  mutation UpdateExpense(
    $input: UpdateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    updateExpense(input: $input, condition: $condition) {
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
export const deleteExpense = /* GraphQL */ `
  mutation DeleteExpense(
    $input: DeleteExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    deleteExpense(input: $input, condition: $condition) {
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
export const createSettlement = /* GraphQL */ `
  mutation CreateSettlement(
    $input: CreateSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    createSettlement(input: $input, condition: $condition) {
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
export const updateSettlement = /* GraphQL */ `
  mutation UpdateSettlement(
    $input: UpdateSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    updateSettlement(input: $input, condition: $condition) {
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
export const deleteSettlement = /* GraphQL */ `
  mutation DeleteSettlement(
    $input: DeleteSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    deleteSettlement(input: $input, condition: $condition) {
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
export const createUserPreferences = /* GraphQL */ `
  mutation CreateUserPreferences(
    $input: CreateUserPreferencesInput!
    $condition: ModelUserPreferencesConditionInput
  ) {
    createUserPreferences(input: $input, condition: $condition) {
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
export const updateUserPreferences = /* GraphQL */ `
  mutation UpdateUserPreferences(
    $input: UpdateUserPreferencesInput!
    $condition: ModelUserPreferencesConditionInput
  ) {
    updateUserPreferences(input: $input, condition: $condition) {
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
export const deleteUserPreferences = /* GraphQL */ `
  mutation DeleteUserPreferences(
    $input: DeleteUserPreferencesInput!
    $condition: ModelUserPreferencesConditionInput
  ) {
    deleteUserPreferences(input: $input, condition: $condition) {
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
        amount
        qty
      }
      rawText
      imageUrl
    }
  }
`;