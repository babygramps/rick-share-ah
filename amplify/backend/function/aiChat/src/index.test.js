import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGeminiGenerationConfig, extractGeminiResult, getResolverFieldName, invokeChatWorker, runChatJob } from './index.js';

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
      assert.match(systemInstruction, /chart-json/);
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

test('buildGeminiGenerationConfig leaves enough room for full markdown responses', () => {
  const config = buildGeminiGenerationConfig();

  assert.equal(config.temperature, 0.3);
  assert.ok(config.maxOutputTokens >= 1024);
});

test('extractGeminiResult returns text length and finish reason for truncation diagnostics', () => {
  const text = 'Your biggest expense was **$526.16** for **rent**.';
  const result = extractGeminiResult({
    candidates: [{
      finishReason: 'MAX_TOKENS',
      content: {
        parts: [
          { text: 'Your biggest expense was **$526.16** for **' },
          { text: 'rent**.' },
        ],
      },
    }],
    usageMetadata: {
      promptTokenCount: 120,
      candidatesTokenCount: 384,
    },
  }, 250);

  assert.equal(result.text, text);
  assert.equal(result.finishReason, 'MAX_TOKENS');
  assert.equal(result.textLength, text.length);
  assert.equal(result.inputTokens, 120);
  assert.equal(result.outputTokens, 384);
  assert.equal(result.latencyMs, 250);
});

test('runChatJob exposes completion diagnostics from Gemini result', async () => {
  const persistedMessages = [];
  const text = 'Your biggest expense was **$526.16** for **rent**.';

  const result = await runChatJob({
    job: {
      id: 'job_diagnostics',
      userId: 'user_1',
      groupId: 'group_1',
      threadId: 'thread_1',
      userMessageId: 'msg_user_diagnostics',
      status: 'queued',
    },
    requestId: 'test-diagnostics',
    loadContext: async () => ({
      group: { id: 'group_1', name: 'Test Group', type: 'GROUP' },
      members: [{ userId: 'user_1', name: 'Ada' }],
      expenses: [],
      settlements: [],
      history: [],
      userMessage: { content: 'What was the biggest expense?' },
    }),
    updateJob: async (jobId, patch) => ({ id: jobId, ...patch }),
    persistAssistantMessage: async (message) => {
      persistedMessages.push(message);
      return { id: 'msg_assistant_diagnostics', ...message };
    },
    generate: async () => ({
      text,
      finishReason: 'STOP',
      textLength: text.length,
      inputTokens: 120,
      outputTokens: 20,
      latencyMs: 30,
    }),
  });

  assert.equal(result.status, 'complete');
  assert.equal(result.finishReason, 'STOP');
  assert.equal(result.textLength, text.length);
  assert.equal(persistedMessages[0].content, text);
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

test('getResolverFieldName reads Amplify function payload fieldName', () => {
  assert.equal(getResolverFieldName({
    typeName: 'Mutation',
    fieldName: 'queueChatMessage',
    arguments: {},
  }), 'queueChatMessage');
});
