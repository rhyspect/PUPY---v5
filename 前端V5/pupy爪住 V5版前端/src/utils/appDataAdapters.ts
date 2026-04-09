import type {
  AppMemberAssets,
  AppRuntimeCareBooking,
  AppRuntimeChatSession,
  AppRuntimeMarketOrder,
  AppRuntimeWalkOrder,
} from '../services/api';
import type { Owner } from '../types';
import { createOwnerFromApi } from './adapters';
import type { MarketOrder } from './marketAssets';

function toShoppingOrder(order: AppRuntimeMarketOrder): MarketOrder {
  return {
    id: order.id,
    kind: 'shopping',
    title: order.items?.[0]?.title || order.source || order.orderNo,
    image: order.items?.[0]?.image || '',
    sellerName: order.sellerName,
    status: order.status || order.fulfillmentStatus || order.paymentStatus,
    total: order.total,
    quantity: order.quantity,
    createdAt: order.createdAt,
    note: order.note,
    items: order.items,
  };
}

function toCareOrder(booking: AppRuntimeCareBooking): MarketOrder {
  return {
    id: booking.id,
    kind: 'booking',
    title: booking.serviceName,
    image: '',
    sellerName: booking.merchantName,
    status: booking.status || booking.reviewStatus,
    total: booking.price,
    quantity: 1,
    createdAt: booking.createdAt,
    appointmentSlot: booking.scheduledAt,
    note: booking.note,
    items: [
      {
        productId: booking.bookingNo,
        title: booking.serviceName,
        image: '',
        unitPrice: booking.price,
        quantity: 1,
      },
    ],
  };
}

function toWalkOrder(order: AppRuntimeWalkOrder): MarketOrder {
  return {
    id: order.id,
    kind: 'booking',
    title: `帮忙溜溜 · ${order.walkerName}`,
    image: '',
    sellerName: order.walkerName,
    status: order.status || order.reviewStatus,
    total: order.price,
    quantity: 1,
    createdAt: order.createdAt,
    appointmentSlot: order.scheduledAt,
    note: order.note,
    items: [
      {
        productId: order.orderNo,
        title: `帮忙溜溜 · ${order.serviceZone}`,
        image: '',
        unitPrice: order.price,
        quantity: 1,
      },
    ],
  };
}

export function createMemberOrdersFromAssets(assets?: AppMemberAssets | null) {
  if (!assets) return [] as MarketOrder[];
  return [
    ...(assets.marketOrders || []).map(toShoppingOrder),
    ...(assets.careBookings || []).map(toCareOrder),
    ...(assets.walkOrders || []).map(toWalkOrder),
  ].sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
}

export function createOwnerFromRuntimeSession(session: AppRuntimeChatSession): Owner {
  return createOwnerFromApi({
    username: session.counterpart?.username || session.title,
    avatar_url: session.counterpart?.avatar_url,
    resident_city: session.counterpart?.resident_city || session.city,
    signature: session.counterpart?.signature || session.latestSnippet,
    photos: session.counterpart?.photos,
    gender: session.counterpart?.gender,
    age: session.counterpart?.age,
    mbti: session.counterpart?.mbti,
    is_verified: session.counterpart?.is_verified,
  });
}
