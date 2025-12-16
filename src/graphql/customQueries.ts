// Custom GraphQL queries for user preferences
// These are minimal queries to reduce payload size

export const getUserPreferencesByUserId = /* GraphQL */ `
  query GetUserPreferencesByUserId($userId: String!) {
    userPreferencesByUserId(userId: $userId, limit: 1) {
      items {
        id
        theme
      }
    }
  }
`;

export const createUserPreferences = /* GraphQL */ `
  mutation CreateUserPreferences($input: CreateUserPreferencesInput!) {
    createUserPreferences(input: $input) {
      id
      userId
      theme
    }
  }
`;

export const updateUserPreferences = /* GraphQL */ `
  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
    updateUserPreferences(input: $input) {
      id
      userId
      theme
    }
  }
`;
