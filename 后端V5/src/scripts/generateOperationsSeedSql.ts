import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdminRuntimeConfig } from '../services/adminRuntimeStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const META_MARKER = '__PUPY_META__:';

function deterministicUuid(seed: string) {
  const hex = createHash('sha1').update(seed).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sqlString(value: string | null | undefined) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return 'NULL';
  const next = Number(value);
  return Number.isFinite(next) ? String(next) : 'NULL';
}

function resolveHumanTimestamp(value: string | null | undefined) {
  const raw = normalizeText(value);
  if (!raw) return null;

  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }

  const explicitTimeMatch = raw.match(/^(今天|明天|后天|周末)\s*(\d{1,2}):(\d{2})$/);
  if (!explicitTimeMatch) return null;

  const [, label, hourText, minuteText] = explicitTimeMatch;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const next = new Date();
  next.setSeconds(0, 0);

  if (label === '明天') {
    next.setDate(next.getDate() + 1);
  } else if (label === '后天') {
    next.setDate(next.getDate() + 2);
  } else if (label === '周末') {
    const day = next.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntilSaturday);
  }

  next.setHours(hour, minute, 0, 0);
  return next.toISOString();
}

function sqlTimestamp(value: string | null | undefined, fallback?: string | null | undefined) {
  const resolved = resolveHumanTimestamp(value) || resolveHumanTimestamp(fallback);
  return resolved ? sqlString(resolved) : 'CURRENT_TIMESTAMP';
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function encodeMetaText(text: string | null | undefined, meta: Record<string, unknown>) {
  const visible = String(text || '').trim();
  const normalizedMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && String(value).trim() !== '';
    }),
  );

  if (!Object.keys(normalizedMeta).length) {
    return visible;
  }

  const encoded = Buffer.from(JSON.stringify(normalizedMeta), 'utf8').toString('base64');
  return `${META_MARKER}${encoded}\n${visible}`;
}

function userRefSql(options: { email?: string | null; username?: string | null }) {
  const clauses: string[] = [];
  if (normalizeText(options.email)) {
    clauses.push(`(SELECT id FROM public.users WHERE lower(email) = lower(${sqlString(normalizeText(options.email))}) LIMIT 1)`);
  }
  if (normalizeText(options.username)) {
    clauses.push(`(SELECT id FROM public.users WHERE lower(username) = lower(${sqlString(normalizeText(options.username))}) LIMIT 1)`);
  }
  return clauses.length ? `COALESCE(${clauses.join(', ')})` : 'NULL';
}

function petRefSql(options: {
  petName?: string | null;
  ownerEmail?: string | null;
  ownerUsername?: string | null;
}) {
  const petName = normalizeText(options.petName);
  if (!petName) return 'NULL';

  const ownerChecks: string[] = [];
  if (normalizeText(options.ownerEmail)) {
    ownerChecks.push(`lower(u.email) = lower(${sqlString(normalizeText(options.ownerEmail))})`);
  }
  if (normalizeText(options.ownerUsername)) {
    ownerChecks.push(`lower(u.username) = lower(${sqlString(normalizeText(options.ownerUsername))})`);
  }

  const scoped = ownerChecks.length
    ? `(SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower(${sqlString(petName)})
          AND (${ownerChecks.join(' OR ')})
        LIMIT 1)`
    : 'NULL';

  const fallback = `(SELECT p.id FROM public.pets p WHERE lower(p.name) = lower(${sqlString(petName)}) LIMIT 1)`;
  return ownerChecks.length ? `COALESCE(${scoped}, ${fallback})` : fallback;
}

function productRefSql(title: string | null | undefined) {
  const value = normalizeText(title);
  if (!value) return 'NULL';
  return `(SELECT id FROM public.market_products WHERE lower(title) = lower(${sqlString(value)}) LIMIT 1)`;
}

function buildUpdateAssignments(columns: string[]) {
  return columns.map((column) => `${column} = EXCLUDED.${column}`).join(',\n    ');
}

async function main() {
  const runtime = getAdminRuntimeConfig();
  const generatedAt = new Date().toISOString();

  const marketOrderRows: string[] = [];
  const marketOrderItemRows: string[] = [];
  const walkOrderRows: string[] = [];
  const careBookingRows: string[] = [];
  const petLoveRows: string[] = [];
  const chatSessionRows: string[] = [];
  const chatMessageRows: string[] = [];
  const sampleMarketOrderIds: string[] = [];
  const sampleChatSessionIds: string[] = [];

  for (const order of runtime.marketOrders) {
    const orderId = deterministicUuid(`market-order:${order.id}`);
    sampleMarketOrderIds.push(orderId);
    const note = encodeMetaText(order.note, {
      userName: order.userName,
      userEmail: order.userEmail,
      petName: order.petName,
      sellerName: order.sellerName,
    });

    marketOrderRows.push(`(
    ${sqlString(orderId)},
    ${sqlString(order.orderNo)},
    ${userRefSql({ email: order.userEmail, username: order.userName })},
    ${userRefSql({ username: order.sellerName })},
    ${petRefSql({ petName: order.petName, ownerEmail: order.userEmail, ownerUsername: order.userName })},
    ${sqlString(order.city)},
    ${sqlString(order.source)},
    ${sqlString(order.status)},
    ${sqlString(order.paymentStatus)},
    ${sqlString(order.fulfillmentStatus)},
    ${sqlNumber(order.total)},
    ${sqlNumber(order.quantity)},
    ${sqlString(note)},
    ${sqlTimestamp(order.createdAt)},
    ${sqlTimestamp(order.updatedAt)}
  )`);

    order.items.forEach((item, index) => {
      const itemId = deterministicUuid(`market-order-item:${order.id}:${index}:${item.title}`);
      marketOrderItemRows.push(`(
    ${sqlString(itemId)},
    ${sqlString(orderId)},
    ${productRefSql(item.title)},
    ${sqlString(item.title)},
    ${sqlString(item.image)},
    ${sqlNumber(item.unitPrice)},
    ${sqlNumber(item.quantity)},
    ${sqlTimestamp(order.createdAt)}
  )`);
    });
  }

  for (const order of runtime.walkOrders) {
    const orderId = deterministicUuid(`walk-order:${order.id}`);
    const note = encodeMetaText(order.note, {
      userName: order.userName,
      userEmail: order.userEmail,
      petName: order.petName,
      scheduledLabel: resolveHumanTimestamp(order.scheduledAt) ? '' : order.scheduledAt,
    });

    walkOrderRows.push(`(
    ${sqlString(orderId)},
    ${sqlString(order.orderNo)},
    ${userRefSql({ email: order.userEmail, username: order.userName })},
    ${petRefSql({ petName: order.petName, ownerEmail: order.userEmail, ownerUsername: order.userName })},
    ${sqlString(order.walkerName)},
    ${sqlString(order.city)},
    ${sqlString(order.serviceZone)},
    ${sqlString(order.status)},
    ${sqlString(order.reviewStatus)},
    ${sqlTimestamp(order.scheduledAt, order.createdAt)},
    ${sqlNumber(order.durationMinutes)},
    ${sqlNumber(order.price)},
    ${sqlString(note)},
    ${sqlTimestamp(order.createdAt)},
    ${sqlTimestamp(order.updatedAt)}
  )`);
  }

  for (const booking of runtime.careBookings) {
    const bookingId = deterministicUuid(`care-booking:${booking.id}`);
    const note = encodeMetaText(booking.note, {
      userName: booking.userName,
      userEmail: booking.userEmail,
      petName: booking.petName,
      scheduledLabel: resolveHumanTimestamp(booking.scheduledAt) ? '' : booking.scheduledAt,
    });

    careBookingRows.push(`(
    ${sqlString(bookingId)},
    ${sqlString(booking.bookingNo)},
    ${userRefSql({ email: booking.userEmail, username: booking.userName })},
    ${petRefSql({ petName: booking.petName, ownerEmail: booking.userEmail, ownerUsername: booking.userName })},
    ${sqlString(booking.merchantName)},
    ${sqlString(booking.city)},
    ${sqlString(booking.serviceName)},
    ${sqlString(booking.status)},
    ${sqlString(booking.reviewStatus)},
    ${sqlTimestamp(booking.scheduledAt, booking.createdAt)},
    ${sqlNumber(booking.price)},
    ${sqlString(note)},
    ${sqlTimestamp(booking.createdAt)},
    ${sqlTimestamp(booking.updatedAt)}
  )`);
  }

  for (const record of runtime.petLoveRecords) {
    const recordId = deterministicUuid(`pet-love:${record.id}`);
    const note = encodeMetaText(record.note, {
      ownerAName: record.ownerAName,
      ownerBName: record.ownerBName,
      petAName: record.petAName,
      petBName: record.petBName,
    });

    petLoveRows.push(`(
    ${sqlString(recordId)},
    ${userRefSql({ username: record.ownerAName })},
    ${userRefSql({ username: record.ownerBName })},
    ${petRefSql({ petName: record.petAName, ownerUsername: record.ownerAName })},
    ${petRefSql({ petName: record.petBName, ownerUsername: record.ownerBName })},
    ${sqlString(record.city)},
    ${sqlString(record.status)},
    ${sqlString(record.reviewStatus)},
    ${sqlString(record.romanceStage)},
    ${sqlNumber(record.compatibilityScore)},
    ${sqlString(note)},
    ${sqlTimestamp(record.createdAt)},
    ${sqlTimestamp(record.updatedAt)}
  )`);
  }

  for (const session of runtime.chatSessions) {
    const sessionId = deterministicUuid(`chat-session:${session.id}`);
    sampleChatSessionIds.push(sessionId);
    const isPetSession = session.type === 'pet';
    const participantA = normalizeText(session.participants[0]);
    const participantB = normalizeText(session.participants[1]);
    const petA = normalizeText(session.relatedPets[0] || session.participants[0]);
    const petB = normalizeText(session.relatedPets[1] || session.participants[1]);
    const userARef = isPetSession
      ? userRefSql({ username: participantA }) === 'NULL'
        ? userRefSql({ username: participantA })
        : userRefSql({ username: participantA })
      : userRefSql({ username: participantA });
    const userBRef = isPetSession
      ? userRefSql({ username: participantB }) === 'NULL'
        ? userRefSql({ username: participantB })
        : userRefSql({ username: participantB })
      : userRefSql({ username: participantB });
    const petARef = isPetSession
      ? petRefSql({ petName: petA, ownerUsername: participantA })
      : petRefSql({ petName: petA, ownerUsername: participantA });
    const petBRef = isPetSession
      ? petRefSql({ petName: petB, ownerUsername: participantB })
      : petRefSql({ petName: petB, ownerUsername: participantB });
    const latestSnippet = encodeMetaText(session.latestSnippet, {
      participants: session.participants,
      relatedPets: session.relatedPets,
    });

    chatSessionRows.push(`(
    ${sqlString(sessionId)},
    ${sqlString(session.sessionNo)},
    ${sqlString(session.type)},
    ${sqlString(session.title)},
    ${sqlString(session.city)},
    ${sqlString(session.status)},
    ${isPetSession ? `(SELECT p.user_id FROM public.pets p WHERE p.id = ${petARef} LIMIT 1)` : userARef},
    ${isPetSession ? `(SELECT p.user_id FROM public.pets p WHERE p.id = ${petBRef} LIMIT 1)` : userBRef},
    ${petARef},
    ${petBRef},
    ${sqlNumber(session.unreadCount)},
    ${sqlString(latestSnippet)},
    ${sqlTimestamp(session.createdAt)},
    ${sqlTimestamp(session.updatedAt)}
  )`);

    session.messages.forEach((message, index) => {
      const messageId = deterministicUuid(`chat-message:${session.id}:${message.id || index}:${message.createdAt || index}`);
      chatMessageRows.push(`(
    ${sqlString(messageId)},
    ${sqlString(sessionId)},
    ${sqlString(message.senderName)},
    ${sqlString(message.role)},
    ${sqlString(message.content)},
    ${sqlString(message.moderationStatus)},
    ${sqlTimestamp(message.createdAt)}
  )`);
    });
  }

  const sql = `-- PUPY operations seed
-- Generated at: ${generatedAt}
-- Source: 后端V5/data/admin-runtime.json
-- Purpose: 在 PostgREST schema cache 尚未及时刷新的情况下，直接通过 SQL Editor 把运营样本数据写入新表。

BEGIN;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON TABLE
  public.market_orders,
  public.market_order_items,
  public.walk_orders,
  public.care_bookings,
  public.pet_love_records,
  public.chat_sessions,
  public.chat_session_messages
TO service_role;

INSERT INTO public.market_orders (
  id, order_no, user_id, seller_id, pet_id, city, source, status, payment_status, fulfillment_status,
  total, quantity, note, created_at, updated_at
) VALUES
${marketOrderRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['order_no', 'user_id', 'seller_id', 'pet_id', 'city', 'source', 'status', 'payment_status', 'fulfillment_status', 'total', 'quantity', 'note', 'created_at', 'updated_at'])};

DELETE FROM public.market_order_items
WHERE order_id IN (${sampleMarketOrderIds.map(sqlString).join(', ')});

INSERT INTO public.market_order_items (
  id, order_id, product_id, title, image, unit_price, quantity, created_at
) VALUES
${marketOrderItemRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['order_id', 'product_id', 'title', 'image', 'unit_price', 'quantity', 'created_at'])};

INSERT INTO public.walk_orders (
  id, order_no, user_id, pet_id, walker_name, city, service_zone, status, review_status,
  scheduled_at, duration_minutes, price, note, created_at, updated_at
) VALUES
${walkOrderRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['order_no', 'user_id', 'pet_id', 'walker_name', 'city', 'service_zone', 'status', 'review_status', 'scheduled_at', 'duration_minutes', 'price', 'note', 'created_at', 'updated_at'])};

INSERT INTO public.care_bookings (
  id, booking_no, user_id, pet_id, merchant_name, city, service_name, status, review_status,
  scheduled_at, price, note, created_at, updated_at
) VALUES
${careBookingRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['booking_no', 'user_id', 'pet_id', 'merchant_name', 'city', 'service_name', 'status', 'review_status', 'scheduled_at', 'price', 'note', 'created_at', 'updated_at'])};

INSERT INTO public.pet_love_records (
  id, owner_a_id, owner_b_id, pet_a_id, pet_b_id, city, status, review_status,
  romance_stage, compatibility_score, note, created_at, updated_at
) VALUES
${petLoveRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['owner_a_id', 'owner_b_id', 'pet_a_id', 'pet_b_id', 'city', 'status', 'review_status', 'romance_stage', 'compatibility_score', 'note', 'created_at', 'updated_at'])};

INSERT INTO public.chat_sessions (
  id, session_no, type, title, city, status, user_a_id, user_b_id, pet_a_id, pet_b_id,
  unread_count, latest_snippet, created_at, updated_at
) VALUES
${chatSessionRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['session_no', 'type', 'title', 'city', 'status', 'user_a_id', 'user_b_id', 'pet_a_id', 'pet_b_id', 'unread_count', 'latest_snippet', 'created_at', 'updated_at'])};

DELETE FROM public.chat_session_messages
WHERE session_id IN (${sampleChatSessionIds.map(sqlString).join(', ')});

INSERT INTO public.chat_session_messages (
  id, session_id, sender_label, sender_role, content, moderation_status, created_at
) VALUES
${chatMessageRows.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    ${buildUpdateAssignments(['session_id', 'sender_label', 'sender_role', 'content', 'moderation_status', 'created_at'])};

NOTIFY pgrst, 'reload schema';

COMMIT;
`;

  const outputPath = path.join(__dirname, '../database/operations_seed.sql');
  writeFileSync(outputPath, sql, 'utf8');
  console.log(`Generated operations seed SQL at ${outputPath}`);
}

main().catch((error) => {
  console.error('Generate operations seed SQL failed:', error);
  process.exit(1);
});
