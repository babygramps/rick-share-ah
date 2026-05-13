import test from 'node:test';
import assert from 'node:assert/strict';

import { invokeChatWorker, runChatJob } from './index.js';

test('runChatJob completes a queued job and persists the assistant reply', async () => {
  const statusUpdates = [];
  const persistedMessages = [];

  const result = await runChatJob({
    job: {
      id: 'job_1',
      userId: 'user_1',
      groupId: 'group_1',
      threadId: 'thread_1',
      userMessageId: 'msg_user_1',
      status: 'queued',
    },
    requestId: 'test-request',
    loadContext: async () => ({
      group: { id: 'group_1', name: 'Test Group', type: 'GROUP' },
      members: [{ userId: 'user_1', name: 'Ada' }],
      expenses: [],
      settlements: [],
      history: [{ role: 'user', content: 'How much did we spend?' }],
      userMessage: { content: 'How much did we spend?' },
    }),
    updateJob: async (jobId, patch) => {
      statusUpdates.push({ jobId, patch });
      return { id: jobId, ...patch };
    },
    persistAssistantMessage: async (message) => {
      persistedMessages.push(message);
      return { id: 'msg_assistant_1', ...message };
    },
    generate: async ({ systemInstruction, contents }) => {
      assert.match(systemInstruction, /Rick & Share-ah/);
      assert.equal(contents.at(-1).parts[0].text, 'How much did we spend?');
      return { text: 'No spending data is available yet.', inputTokens: 42, outputTokens: 9, latencyMs: 25 };
    },
  });

  assert.equal(result.status, 'complete');
  assert.equal(result.assistantMessage.id, 'msg_assistant_1');
  assert.deepEqual(statusUpdates.map((update) => update.patch.status), ['running', 'complete']);
  assert.equal(persistedMessages[0].role, 'assistant');
  assert.equal(persistedMessages[0].content, 'No spending data is available yet.');
});

test('runChatJob marks timed_out when Gemini aborts', async () => {
  const statusUpdates = [];
  const abortError = new Error('The operation was aborted');
  abortError.name = 'AbortError';

  const result = await runChatJob({
    job: {
      id: 'job_2',
      userId: 'user_1',
      groupId: 'group_1',
      threadId: 'thread_1',
      userMessageId: 'msg_user_2',
      status: 'queued',
    },
    requestId: 'test-timeout',
    loadContext: async () => ({
      group: { id: 'group_1', name: 'Test Group', type: 'GROUP' },
      members: [{ userId: 'user_1', name: 'Ada' }],
      expenses: [],
      settlements: [],
      history: [],
      userMessage: { content: 'What changed?' },
    }),
    updateJob: async (jobId, patch) => {
      statusUpdates.push({ jobId, patch });
      return { id: jobId, ...patch };
    },
    persistAssistantMessage: async () => {
      throw new Error('assistant message should not be persisted on timeout');
    },
    generate: async () => {
      throw abortError;
    },
  });

  assert.equal(result.status, 'timed_out');
  assert.deepEqual(statusUpdates.map((update) => update.patch.status), ['running', 'timed_out']);
  assert.match(statusUpdates.at(-1).patch.error, /aborted/i);
});

test('invokeChatWorker asynchronously invokes this Lambda in worker mode', async () => {
  const sentCommands = [];

  await invokeChatWorker({
    jobId: 'job_queued_1',
    requestId: 'queue-request-1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:aiChat-dev',
    send: async (command) => {
      sentCommands.push(command.input);
      return { StatusCode: 202 };
    },
  });

  assert.equal(sentCommands.length, 1);
  assert.equal(sentCommands[0].FunctionName, 'arn:aws:lambda:us-east-1:123456789012:function:aiChat-dev');
  assert.equal(sentCommands[0].InvocationType, 'Event');
  assert.deepEqual(JSON.parse(Buffer.from(sentCommands[0].Payload).toString('utf8')), {
    mode: 'processJob',
    jobId: 'job_queued_1',
    queuedByRequestId: 'queue-request-1',
  });
});
