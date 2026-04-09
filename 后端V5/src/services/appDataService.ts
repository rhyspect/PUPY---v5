import { randomUUID } from 'crypto';
import config from '../config/index.js';
import { supabaseAdmin } from '../config/supabase.js';
import {
  getAdminRuntimeConfig,
  saveAdminRuntimeConfig,
  type AdminCareBooking,
  type AdminChatMessage,
  type AdminChatSession,
  type AdminMarketOrder,
  type AdminWalkOrder,
} from './adminRuntimeStore.js';
import type { ApiResponse } from '../types/index.js';

const DEFAULT_OWNER_AVATAR =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400';
const DEFAULT_PET_AVATAR =
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400';

interface ViewerContext {
  userId: string;
  email: string;
  username: string;
  residentCity: string;
  avatarUrl: string;
  petNames: string[];
  primaryPetName: string;
  petAvatarUrl: string;
  isAdminViewer: boolean;
}

interface RuntimeCounterpart {
  username: string;
  avatar_url: string;
  resident_city: string;
  signature: string;
  photos: string[];
  gender: string;
  age: number;
  mbti: string;
  is_verified: boolean;
}

export interface AppMemberAssets {
  marketOrders: AdminMarketOrder[];
  careBookings: AdminCareBooking[];
  walkOrders: AdminWalkOrder[];
}

export interface AppChatSessionView extends AdminChatSession {
  counterpart: RuntimeCounterpart;
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();
const toNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const uniqueStrings = (values: Array<unknown>) => Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)));

const sortByLatest = <T extends { updatedAt?: string; createdAt?: string }>(rows: T[]) =>
  [...rows].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt || '') || 0;
    const bTime = Date.parse(b.updatedAt || b.createdAt || '') || 0;
    return bTime - aTime;
  });

async function resolveViewerContext(userId: string, fallbackEmail: string, fallbackUsername: string): Promise<ViewerContext> {
  const [userRes, petsRes] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, email, username, resident_city, avatar_url')
      .eq('id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('pets')
      .select('name, images')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  if (userRes.error) {
    throw userRes.error;
  }
  if (petsRes.error) {
    throw petsRes.error;
  }

  const user = userRes.data;
  const pets = petsRes.data || [];
  const petNames = uniqueStrings(pets.map((pet) => pet.name));
  const primaryPetName = petNames[0] || 'Pupy';
  const petAvatarUrl =
    pets.find((pet) => Array.isArray(pet.images) && pet.images.length)?.images?.[0] || DEFAULT_PET_AVATAR;
  const email = String(user?.email || fallbackEmail || '').trim();

  return {
    userId,
    email,
    username: String(user?.username || fallbackUsername || 'PUPY 用户').trim() || 'PUPY 用户',
    residentCity: String(user?.resident_city || '上海').trim() || '上海',
    avatarUrl: String(user?.avatar_url || DEFAULT_OWNER_AVATAR).trim() || DEFAULT_OWNER_AVATAR,
    petNames,
    primaryPetName,
    petAvatarUrl,
    isAdminViewer: config.admin.allowedEmails.includes(email.toLowerCase()),
  };
}

function recordBelongsToViewer(values: Array<unknown>, viewer: ViewerContext) {
  const normalizedValues = values.map(normalizeText).filter(Boolean);
  const directNeedles = [viewer.email, viewer.username, ...viewer.petNames].map(normalizeText).filter(Boolean);
  return directNeedles.some((needle) => normalizedValues.includes(needle));
}

function buildCounterpart(session: AdminChatSession, viewer: ViewerContext): RuntimeCounterpart {
  const normalizedViewerName = normalizeText(viewer.username);
  const normalizedPetNames = viewer.petNames.map(normalizeText);
  const counterpartName =
    uniqueStrings([...session.participants, ...session.relatedPets]).find((item) => {
      const normalized = normalizeText(item);
      return normalized && normalized !== normalizedViewerName && !normalizedPetNames.includes(normalized);
    }) || (session.type === 'pet' ? '云端小伙伴' : '新朋友');

  const avatar = session.type === 'pet' ? DEFAULT_PET_AVATAR : DEFAULT_OWNER_AVATAR;

  return {
    username: counterpartName,
    avatar_url: avatar,
    resident_city: session.city || viewer.residentCity,
    signature: session.latestSnippet || session.title || '来自 PUPY 的真实会话',
    photos: [avatar],
    gender: session.type === 'pet' ? '未知' : '其他',
    age: session.type === 'pet' ? 1 : 0,
    mbti: session.type === 'pet' ? 'PUPY' : 'ENFP',
    is_verified: true,
  };
}

function viewerVisibleSessions(runtimeSessions: AdminChatSession[], viewer: ViewerContext, type: 'owner' | 'pet') {
  const filtered = sortByLatest(runtimeSessions.filter((session) => session.type === type && session.status !== '已归档'));
  if (viewer.isAdminViewer) {
    return filtered;
  }

  const visible = filtered.filter((session) =>
    recordBelongsToViewer([...session.participants, ...session.relatedPets], viewer),
  );

  return visible.length ? visible : filtered.slice(0, 6);
}

function hydrateSession(session: AdminChatSession, viewer: ViewerContext): AppChatSessionView {
  return {
    ...session,
    counterpart: buildCounterpart(session, viewer),
  };
}

export class AppDataService {
  static async getMemberAssets(userId: string, email: string, username: string): Promise<ApiResponse<AppMemberAssets>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();

      const marketOrders = sortByLatest(runtime.marketOrders.filter((order) =>
        recordBelongsToViewer([order.userEmail, order.userName, order.petName], viewer),
      ));
      const careBookings = sortByLatest(runtime.careBookings.filter((booking) =>
        recordBelongsToViewer([booking.userEmail, booking.userName, booking.petName], viewer),
      ));
      const walkOrders = sortByLatest(runtime.walkOrders.filter((order) =>
        recordBelongsToViewer([order.userEmail, order.userName, order.petName], viewer),
      ));

      return {
        success: true,
        data: {
          marketOrders,
          careBookings,
          walkOrders,
        },
        message: '会员资产已同步到真实后台数据。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '加载会员资产失败。',
        code: 500,
      };
    }
  }

  static async createMarketOrder(
    userId: string,
    email: string,
    username: string,
    payload: {
      title: string;
      image?: string;
      sellerName?: string;
      total?: number;
      quantity?: number;
      note?: string;
      items?: AdminMarketOrder['items'];
      city?: string;
      source?: string;
    },
  ): Promise<ApiResponse<AdminMarketOrder>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const nextOrder: AdminMarketOrder = {
        id: randomUUID(),
        orderNo: `PUPY-MO-${Date.now()}`,
        userName: viewer.username,
        userEmail: viewer.email,
        petName: viewer.primaryPetName,
        sellerName: String(payload.sellerName || '爪住集市').trim() || '爪住集市',
        city: String(payload.city || viewer.residentCity).trim() || viewer.residentCity,
        status: '待审核',
        paymentStatus: '已付款',
        fulfillmentStatus: '待拣货',
        total: toNumber(payload.total),
        quantity: Math.max(1, toNumber(payload.quantity, 1)),
        note: String(payload.note || '').trim(),
        source: String(payload.source || '主粮用品').trim() || '主粮用品',
        items: Array.isArray(payload.items) ? payload.items : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = saveAdminRuntimeConfig({ marketOrders: [nextOrder, ...runtime.marketOrders] });
      const created = saved.marketOrders.find((item) => item.id === nextOrder.id) || nextOrder;
      return {
        success: true,
        data: created,
        message: '商城订单已写入后台审核队列。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建商城订单失败。',
        code: 500,
      };
    }
  }

  static async createCareBooking(
    userId: string,
    email: string,
    username: string,
    payload: {
      merchantName?: string;
      serviceName?: string;
      scheduledAt?: string;
      price?: number;
      note?: string;
      city?: string;
    },
  ): Promise<ApiResponse<AdminCareBooking>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const nextBooking: AdminCareBooking = {
        id: randomUUID(),
        bookingNo: `PUPY-CR-${Date.now()}`,
        userName: viewer.username,
        userEmail: viewer.email,
        petName: viewer.primaryPetName,
        merchantName: String(payload.merchantName || '爪住护理中心').trim() || '爪住护理中心',
        city: String(payload.city || viewer.residentCity).trim() || viewer.residentCity,
        serviceName: String(payload.serviceName || '护理服务').trim() || '护理服务',
        status: '待商家确认',
        reviewStatus: '待审核',
        scheduledAt: String(payload.scheduledAt || new Date().toISOString()),
        price: toNumber(payload.price),
        note: String(payload.note || '').trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = saveAdminRuntimeConfig({ careBookings: [nextBooking, ...runtime.careBookings] });
      const created = saved.careBookings.find((item) => item.id === nextBooking.id) || nextBooking;
      return {
        success: true,
        data: created,
        message: '护理预约已写入后台审核队列。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建护理预约失败。',
        code: 500,
      };
    }
  }

  static async createWalkOrder(
    userId: string,
    email: string,
    username: string,
    payload: {
      walkerName?: string;
      serviceZone?: string;
      scheduledAt?: string;
      durationMinutes?: number;
      price?: number;
      note?: string;
      city?: string;
    },
  ): Promise<ApiResponse<AdminWalkOrder>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const nextOrder: AdminWalkOrder = {
        id: randomUUID(),
        orderNo: `PUPY-WK-${Date.now()}`,
        userName: viewer.username,
        userEmail: viewer.email,
        petName: viewer.primaryPetName,
        walkerName: String(payload.walkerName || '待确认服务者').trim() || '待确认服务者',
        city: String(payload.city || viewer.residentCity).trim() || viewer.residentCity,
        serviceZone: String(payload.serviceZone || viewer.residentCity).trim() || viewer.residentCity,
        status: '待确认',
        reviewStatus: '待审核',
        scheduledAt: String(payload.scheduledAt || new Date().toISOString()),
        durationMinutes: Math.max(30, toNumber(payload.durationMinutes, 60)),
        price: toNumber(payload.price),
        note: String(payload.note || '').trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = saveAdminRuntimeConfig({ walkOrders: [nextOrder, ...runtime.walkOrders] });
      const created = saved.walkOrders.find((item) => item.id === nextOrder.id) || nextOrder;
      return {
        success: true,
        data: created,
        message: '帮忙溜溜订单已写入后台审核队列。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建帮忙溜溜订单失败。',
        code: 500,
      };
    }
  }

  static async getChatSessions(
    userId: string,
    email: string,
    username: string,
    type: 'owner' | 'pet',
  ): Promise<ApiResponse<AppChatSessionView[]>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const sessions = viewerVisibleSessions(runtime.chatSessions, viewer, type).map((session) => hydrateSession(session, viewer));
      return {
        success: true,
        data: sessions,
        message: type === 'owner' ? '主人聊天会话加载成功。' : '宠物聊天会话加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '加载聊天会话失败。',
        code: 500,
      };
    }
  }

  static async getChatSession(
    userId: string,
    email: string,
    username: string,
    sessionId: string,
  ): Promise<ApiResponse<AppChatSessionView>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const session = runtime.chatSessions.find((item) => item.id === sessionId);
      if (!session) {
        return {
          success: false,
          error: '聊天会话不存在。',
          code: 404,
        };
      }

      return {
        success: true,
        data: hydrateSession(session, viewer),
        message: '聊天会话详情加载成功。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '加载聊天会话详情失败。',
        code: 500,
      };
    }
  }

  static async ensureOwnerSession(
    userId: string,
    email: string,
    username: string,
    payload: {
      counterpartName?: string;
      counterpartCity?: string;
      counterpartPetName?: string;
    },
  ): Promise<ApiResponse<AppChatSessionView>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const counterpartName = String(payload.counterpartName || '').trim() || '新朋友';
      const counterpartPetName = String(payload.counterpartPetName || '').trim();
      const counterpartCity = String(payload.counterpartCity || viewer.residentCity).trim() || viewer.residentCity;

      const existing = runtime.chatSessions.find((session) => {
        if (session.type !== 'owner') return false;
        const participants = session.participants.map(normalizeText);
        return participants.includes(normalizeText(viewer.username)) && participants.includes(normalizeText(counterpartName));
      });

      if (existing) {
        return {
          success: true,
          data: hydrateSession(existing, viewer),
          message: '已接入现有主人聊天会话。',
        };
      }

      const nextSession: AdminChatSession = {
        id: randomUUID(),
        sessionNo: `PUPY-CH-${Date.now()}`,
        type: 'owner',
        title: `${viewer.username} × ${counterpartName}`,
        participants: uniqueStrings([viewer.username, counterpartName]),
        relatedPets: uniqueStrings([viewer.primaryPetName, counterpartPetName]),
        city: counterpartCity,
        status: '热聊中',
        unreadCount: 0,
        latestSnippet: '新的主人聊天已经接入。',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = saveAdminRuntimeConfig({ chatSessions: [nextSession, ...runtime.chatSessions] });
      const created = saved.chatSessions.find((item) => item.id === nextSession.id) || nextSession;
      return {
        success: true,
        data: hydrateSession(created, viewer),
        message: '新的主人聊天会话已创建。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建主人聊天会话失败。',
        code: 500,
      };
    }
  }

  static async appendChatMessage(
    userId: string,
    email: string,
    username: string,
    sessionId: string,
    payload: {
      content: string;
      role?: 'owner' | 'pet';
      senderName?: string;
    },
  ): Promise<ApiResponse<AppChatSessionView>> {
    try {
      const viewer = await resolveViewerContext(userId, email, username);
      const runtime = getAdminRuntimeConfig();
      const existing = runtime.chatSessions.find((item) => item.id === sessionId);
      if (!existing) {
        return {
          success: false,
          error: '聊天会话不存在。',
          code: 404,
        };
      }

      const nextMessage: AdminChatMessage = {
        id: randomUUID(),
        senderName:
          String(payload.senderName || '').trim() ||
          (payload.role === 'pet' ? viewer.primaryPetName : viewer.username),
        role: payload.role === 'pet' ? 'pet' : 'owner',
        content: String(payload.content || '').trim(),
        createdAt: new Date().toISOString(),
        moderationStatus: '正常',
      };

      const nextSession: AdminChatSession = {
        ...existing,
        latestSnippet: nextMessage.content,
        unreadCount: 0,
        messages: [...existing.messages, nextMessage],
        updatedAt: new Date().toISOString(),
      };

      const nextSessions = runtime.chatSessions.map((item) => (item.id === existing.id ? nextSession : item));
      const saved = saveAdminRuntimeConfig({ chatSessions: nextSessions });
      const updated = saved.chatSessions.find((item) => item.id === existing.id) || nextSession;
      return {
        success: true,
        data: hydrateSession(updated, viewer),
        message: '消息已写入后台会话。',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '发送消息失败。',
        code: 500,
      };
    }
  }
}

export default AppDataService;
