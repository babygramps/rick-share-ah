/* eslint-disable */
// Hand-written GraphQL operations for the AI chat feature.
// These mirror what amplify codegen will eventually emit, but live in their own
// file so the frontend builds before `amplify push` runs.

export const listChatMessages = /* GraphQL */ `
  query ChatMessagesByThread(
    $threadId: ID!
    $limit: Int
    $nextToken: String
  ) {
    chatMessagesByThread(
      threadId: $threadId
      sortDirection: ASC
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

export const createChatThread = /* GraphQL */ `
  mutation CreateChatThread($input: CreateChatThreadInput!) {
    createChatThread(input: $input) {
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

export const sendChatMessage = /* GraphQL */ `
  mutation SendChatMessage($groupId: ID!, $threadId: ID!, $content: String!) {
    sendChatMessage(groupId: $groupId, threadId: $threadId, content: $content) {
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
