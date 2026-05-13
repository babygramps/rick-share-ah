/* eslint-disable */
// Hand-written GraphQL operations for the AI chat feature.
// These mirror what amplify codegen will eventually emit, but live in their own
// file so the frontend builds before `amplify push` runs.

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

export const sendChatMessage = /* GraphQL */ `
  mutation SendChatMessage($groupId: ID!, $content: String!) {
    sendChatMessage(groupId: $groupId, content: $content) {
      id
      userId
      groupId
      role
      content
      createdAt
      updatedAt
      __typename
    }
  }
`;
