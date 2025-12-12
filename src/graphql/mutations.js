/* eslint-disable */
// this is an auto generated file. This will be overwritten

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
export const createExpense = /* GraphQL */ `
  mutation CreateExpense(
    $input: CreateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    createExpense(input: $input, condition: $condition) {
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
export const updateExpense = /* GraphQL */ `
  mutation UpdateExpense(
    $input: UpdateExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    updateExpense(input: $input, condition: $condition) {
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
export const deleteExpense = /* GraphQL */ `
  mutation DeleteExpense(
    $input: DeleteExpenseInput!
    $condition: ModelExpenseConditionInput
  ) {
    deleteExpense(input: $input, condition: $condition) {
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
export const createSettlement = /* GraphQL */ `
  mutation CreateSettlement(
    $input: CreateSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    createSettlement(input: $input, condition: $condition) {
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
export const updateSettlement = /* GraphQL */ `
  mutation UpdateSettlement(
    $input: UpdateSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    updateSettlement(input: $input, condition: $condition) {
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
export const deleteSettlement = /* GraphQL */ `
  mutation DeleteSettlement(
    $input: DeleteSettlementInput!
    $condition: ModelSettlementConditionInput
  ) {
    deleteSettlement(input: $input, condition: $condition) {
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
      rawText
      imageUrl
      __typename
    }
  }
`;
