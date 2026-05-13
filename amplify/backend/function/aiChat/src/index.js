import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ssm = new SSMClient({});

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 24_000;
const GEMINI_MAX_ATTEMPTS = 2;

let cachedGeminiKey = null;
async function getGeminiKey() {
  if (cachedGeminiKey) return cachedGeminiKey;
  const paramName = process.env.GEMINI_API_KEY;
  if (!paramName) throw new Error('GEMINI_API_KEY env var is not set (it should hold the SSM parameter name)');
  const resp = await ssm.send(new GetParametersCommand({
    Names: [paramName],
    WithDecryption: true,
  }));
  const param = resp.Parameters?.[0];
  if (!param?.Value) throw new Error(`SSM parameter ${paramName} returned no value`);
  cachedGeminiKey = param.Value;
  return cachedGeminiKey;
}

function log(level, message, meta) {
  console.log(JSON.stringify({
    level,
    message,
    ...(meta ? { meta } : {}),
    ts: new Date().toISOString(),
  }));
}

function tableName(modelName) {
  const apiId = process.env.API_RICKSHAREAH_GRAPHQLAPIIDOUTPUT;
  const env = process.env.ENV;
  if (!apiId || !env) {
    throw new Error(`Missing API_RICKSHAREAH_GRAPHQLAPIIDOUTPUT or ENV env var (apiId=${apiId}, env=${env})`);
  }
  return `${modelName}-${apiId}-${env}`;
}

function formatCents(c) {
  if (typeof c !== 'number' || !Number.isFinite(c)) return String(c);
  const sign = c < 0 ? '-' : '';
  const abs = Math.abs(c);
  const dollars = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  return `${sign}$${dollars}.${cents}`;
}

function truncateText(value, max = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function compactExpense(e) {
  const out = [
    e.date,
    e.category,
    e.amount,
    e.paidBy,
    truncateText(e.description, 80),
  ];
  if (e.shares) out.push(e.shares);
  return out;
}

function compactSettlement(s) {
  return [
    s.date,
    s.amount,
    s.paidBy,
    s.paidTo,
    s.note ? truncateText(s.note, 80) : undefined,
  ].filter((value) => value !== undefined);
}

function monthKey(date) {
  return typeof date === 'string' && date.length >= 7 ? date.slice(0, 7) : 'unknown';
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function buildExpenseAggregates(expenses) {
  const byMonthCategory = {};
  const byCategory = {};
  const byPayer = {};
  for (const e of expenses) {
    const month = monthKey(e.date);
    const category = e.category || 'uncategorized';
    const amount = typeof e.amount === 'number' ? e.amount : 0;
    byMonthCategory[month] ||= {};
    byMonthCategory[month][category] ||= { total: 0, count: 0 };
    byMonthCategory[month][category].total += amount;
    byMonthCategory[month][category].count += 1;
    byCategory[category] ||= { total: 0, count: 0 };
    byCategory[category].total += amount;
    byCategory[category].count += 1;
    byPayer[e.paidBy] ||= { total: 0, count: 0 };
    byPayer[e.paidBy].total += amount;
    byPayer[e.paidBy].count += 1;
  }
  return { byMonthCategory, byCategory, byPayer };
}

function selectRelevantExpenses(expenses, question, limit = 60) {
  const q = normalize(question);
  const terms = q
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3 && !['how', 'much', 'did', 'the', 'was', 'were', 'this', 'that', 'what', 'with'].includes(term));
  return [...expenses]
    .map((e) => {
      const haystack = normalize(`${e.description} ${e.category} ${e.date}`);
      let score = 0;
      for (const term of terms) {
        if (haystack.includes(term)) score += 4;
      }
      if (q.includes('biggest') || q.includes('largest')) score += Math.min(Math.floor((e.amount || 0) / 1000), 25);
      if (q.includes('food') && ['food', 'restaurant', 'restaurants', 'dining', 'groceries', 'grocery'].some((term) => haystack.includes(term))) score += 20;
      if (q.includes('transport') && ['transport', 'uber', 'lyft', 'gas', 'parking', 'transit'].some((term) => haystack.includes(term))) score += 20;
      return { expense: e, score };
    })
    .sort((a, b) => b.score - a.score || String(b.expense.date || '').localeCompare(String(a.expense.date || '')))
    .slice(0, limit)
    .map(({ expense }) => compactExpense(expense));
}

async function isUserInGroup(userId, groupId) {
  const resp = await dynamo.send(new QueryCommand({
    TableName: tableName('GroupMember'),
    IndexName: 'byGroup',
    KeyConditionExpression: 'groupId = :g',
    ExpressionAttributeValues: { ':g': groupId },
  }));
  const items = resp.Items || [];
  return items.some((m) => m.userId === userId);
}

async function loadGroup(groupId) {
  const resp = await dynamo.send(new GetCommand({
    TableName: tableName('Group'),
    Key: { id: groupId },
  }));
  return resp.Item || null;
}

async function loadGroupMembers(groupId) {
  const resp = await dynamo.send(new QueryCommand({
    TableName: tableName('GroupMember'),
    IndexName: 'byGroup',
    KeyConditionExpression: 'groupId = :g',
    ExpressionAttributeValues: { ':g': groupId },
  }));
  return resp.Items || [];
}

async function loadThread(threadId) {
  const resp = await dynamo.send(new GetCommand({
    TableName: tableName('ChatThread'),
    Key: { id: threadId },
  }));
  return resp.Item || null;
}

async function loadAllByGroup(modelName, groupId) {
  const out = [];
  let lastKey;
  do {
    const resp = await dynamo.send(new QueryCommand({
      TableName: tableName(modelName),
      IndexName: 'byGroup',
      KeyConditionExpression: 'groupId = :g',
      ExpressionAttributeValues: { ':g': groupId },
      ExclusiveStartKey: lastKey,
    }));
    out.push(...(resp.Items || []));
    lastKey = resp.LastEvaluatedKey;
  } while (lastKey);
  return out;
}

async function loadRecentThreadMessages(userId, threadId, limit = 20) {
  const resp = await dynamo.send(new QueryCommand({
    TableName: tableName('ChatMessage'),
    IndexName: 'byThread',
    KeyConditionExpression: 'threadId = :t',
    ExpressionAttributeValues: { ':t': threadId },
    ScanIndexForward: false,
    Limit: limit * 4,
  }));
  const items = (resp.Items || []).filter((m) => m.userId === userId).slice(0, limit);
  return items.reverse(); // oldest-first for prompt construction
}

async function persistMessage({ userId, groupId, threadId, role, content }) {
  const now = new Date().toISOString();
  const id = `cm_${now}_${Math.random().toString(16).slice(2, 10)}`;
  const item = {
    id,
    userId,
    groupId,
    threadId,
    role,
    content,
    createdAt: now,
    updatedAt: now,
    __typename: 'ChatMessage',
    owner: userId,
  };
  await dynamo.send(new PutCommand({
    TableName: tableName('ChatMessage'),
    Item: item,
  }));
  return item;
}

async function touchThread({ thread, content }) {
  const now = new Date().toISOString();
  const shouldRetitle = !thread.title || thread.title === 'New chat';
  const nextTitle = shouldRetitle ? truncateText(content, 48) || 'New chat' : thread.title;
  await dynamo.send(new UpdateCommand({
    TableName: tableName('ChatThread'),
    Key: { id: thread.id },
    UpdateExpression: 'SET updatedAt = :updatedAt, title = :title',
    ConditionExpression: 'userId = :userId AND groupId = :groupId',
    ExpressionAttributeValues: {
      ':updatedAt': now,
      ':title': nextTitle,
      ':userId': thread.userId,
      ':groupId': thread.groupId,
    },
  }));
  return { ...thread, title: nextTitle, updatedAt: now };
}

function buildSystemPrompt({ user, group, members, expenses, settlements, question }) {
  const today = new Date().toISOString().slice(0, 10);
  const userName = members.find((m) => m.userId === user.userId)?.name || 'the user';
  const aggregates = buildExpenseAggregates(expenses);
  const relevantExpenses = selectRelevantExpenses(expenses, question);
  return [
    `You are an analyst built into Rick & Share-ah, an expense-splitting app for couples and groups.`,
    `You help ${userName} understand their group's spending. Answer ONLY using the data below — never invent expenses.`,
    `If the data doesn't contain the answer, say so.`,
    ``,
    `CRITICAL CONVENTIONS:`,
    `- All amounts are integers in CENTS. $12.34 is stored as 1234.`,
    `- When showing money to the user, format as "$12.34" (divide by 100).`,
    `- Data uses compact rows to reduce latency.`,
    `- Expense row format: [date, category, amountCents, paidByUserId, description, optionalSharesJson].`,
    `- Settlement row format: [date, amountCents, paidByUserId, paidToUserId, optionalNote].`,
    `- Resolve user ids to names using MEMBERS.`,
    `- Today's date is ${today}.`,
    ``,
    `GROUP: ${JSON.stringify({ name: group?.name, type: group?.type })}`,
    `MEMBERS: ${JSON.stringify(members.map((m) => [m.userId, m.name]))}`,
    `EXPENSE_AGGREGATES_EXACT: ${JSON.stringify(aggregates)}`,
    `RELEVANT_EXPENSE_ROWS: ${JSON.stringify(relevantExpenses)}`,
    `SETTLEMENTS: ${JSON.stringify(settlements.map(compactSettlement))}`,
    ``,
    `When asked for totals or breakdowns, compute them from the data. Show your work briefly`,
    `(e.g. "March food = ${formatCents(12450)} across 12 expenses"). Keep replies concise — the user is on mobile.`,
  ].join('\n');
}

function buildGeminiContents(history, newUserContent) {
  // Gemini uses roles "user" and "model"; map "assistant" -> "model".
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts: [{ text: newUserContent }] });
  return contents;
}

async function callGemini({ systemInstruction, contents }) {
  const apiKey = await getGeminiKey();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    let lastError;
    for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
      const resp = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 384,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
        signal: controller.signal,
      });
      const latencyMs = Date.now() - t0;
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        lastError = new Error(`Gemini HTTP ${resp.status}: ${errBody.slice(0, 500)}`);
        if ((resp.status === 429 || resp.status === 503) && attempt < GEMINI_MAX_ATTEMPTS && latencyMs < GEMINI_TIMEOUT_MS - 6_000) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          continue;
        }
        throw lastError;
      }
      const json = await resp.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') || '';
      const inputTokens = json?.usageMetadata?.promptTokenCount ?? null;
      const outputTokens = json?.usageMetadata?.candidatesTokenCount ?? null;
      return { text, inputTokens, outputTokens, latencyMs };
    }
    throw lastError || new Error('Gemini request failed');
  } finally {
    clearTimeout(timer);
  }
}

export const handler = async (event, context) => {
  const requestId = context?.awsRequestId;
  const userId = event?.identity?.sub;
  const groupId = event?.arguments?.groupId;
  const threadId = event?.arguments?.threadId;
  const content = event?.arguments?.content;

  log('info', 'aiChat.start', { requestId, userId, groupId, threadId, contentLen: content?.length });

  if (!userId || !groupId || !threadId || !content) {
    log('warn', 'aiChat.missingArgs', {
      requestId,
      hasUserId: !!userId,
      hasGroupId: !!groupId,
      hasThreadId: !!threadId,
      hasContent: !!content,
    });
    throw new Error('Unauthorized or missing arguments');
  }

  try {
    const allowed = await isUserInGroup(userId, groupId);
    if (!allowed) {
      log('warn', 'aiChat.unauthorized', { requestId, userId, groupId });
      throw new Error('Unauthorized');
    }

    const thread = await loadThread(threadId);
    if (!thread || thread.userId !== userId || thread.groupId !== groupId) {
      log('warn', 'aiChat.invalidThread', {
        requestId,
        userId,
        groupId,
        threadId,
        foundUserId: thread?.userId,
        foundGroupId: thread?.groupId,
      });
      throw new Error('Unauthorized');
    }

    const [group, members, expenses, settlements, history] = await Promise.all([
      loadGroup(groupId),
      loadGroupMembers(groupId),
      loadAllByGroup('Expense', groupId),
      loadAllByGroup('Settlement', groupId),
      loadRecentThreadMessages(userId, threadId, 20),
    ]);

    log('info', 'aiChat.dataLoaded', {
      requestId,
      threadId,
      members: members.length,
      expenses: expenses.length,
      settlements: settlements.length,
      historyMessages: history.length,
    });

    const userMessage = await persistMessage({ userId, groupId, threadId, role: 'user', content });
    await touchThread({ thread, content });

    const systemInstruction = buildSystemPrompt({
      user: { userId },
      group,
      members,
      expenses,
      settlements,
      question: content,
    });
    const contents = buildGeminiContents(history, content);

    log('info', 'aiChat.promptBuilt', {
      requestId,
      threadId,
      model: GEMINI_MODEL,
      promptChars: systemInstruction.length,
      expenses: expenses.length,
      settlements: settlements.length,
      historyMessages: history.length,
    });

    let assistantText;
    let usage = { inputTokens: null, outputTokens: null, latencyMs: null };
    let geminiStatus = 'ok';
    try {
      const result = await callGemini({ systemInstruction, contents });
      assistantText = result.text?.trim();
      usage = { inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: result.latencyMs };
      if (!assistantText) {
        geminiStatus = 'empty_response';
        assistantText = "⚠️ I didn't get a usable response from the AI. Please try again.";
      }
    } catch (geminiErr) {
      geminiStatus = 'gemini_error';
      log('error', 'aiChat.geminiFailed', {
        requestId,
        model: GEMINI_MODEL,
        errorName: geminiErr?.name,
        errorMessage: geminiErr?.message,
      });
      assistantText = "⚠️ Couldn't reach the AI right now. Tap to retry.";
    }

    const assistantMessage = await persistMessage({
      userId,
      groupId,
      threadId,
      role: 'assistant',
      content: assistantText,
    });

    log('info', 'aiChat.done', {
      requestId,
      userId,
      groupId,
      threadId,
      status: geminiStatus,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      latencyMs: usage.latencyMs,
      model: GEMINI_MODEL,
    });

    void userMessage;

    return assistantMessage;
  } catch (err) {
    log('error', 'aiChat.failed', {
      requestId,
      errorName: err?.name,
      errorMessage: err?.message,
    });
    throw err;
  }
};
