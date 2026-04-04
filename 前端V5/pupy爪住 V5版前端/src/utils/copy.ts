import type { AppLocale } from './locale';
import { getStoredLocale } from './locale';

export interface AppCopy {
  shell: {
    hydrating: string;
    apiOnline: string;
    localFallback: string;
    settings: string;
    localSession: string;
    filters: string;
    breeding: string;
    diary: string;
    prayer: string;
    adminPanel: string;
    systemSettings: string;
    runtime: string;
    healthy: string;
    fallback: string;
    notificationCenter: string;
    notificationDescription: string;
    notificationEmpty: string;
    sessionAndControls: string;
  };
  nav: {
    home: string;
    tour: string;
    messages: string;
    market: string;
    profile: string;
  };
  toast: {
    synced: string;
    localMode: string;
    matched: string;
    switchedZh: string;
    switchedEn: string;
  };
  backend: {
    waiting: string;
    apiReady: string;
    healthFailed: string;
  };
  settings: {
    title: string;
    petProfile: string;
    noPetProfile: string;
    realPetProfile: string;
    digitalProfile: string;
    notLoggedIn: string;
    backendStatus: string;
    apiConnection: string;
    online: string;
    degraded: string;
    environment: string;
    unknown: string;
    admin: string;
    openAdminPanel: string;
    general: string;
    risk: string;
    reset: string;
    configuredShell: string;
    notifications: string;
    privacy: string;
    language: string;
    theme: string;
    notificationsDescription: string;
    privacyDescription: string;
    themeDescription: string;
    notificationsItems: string[];
    privacyItems: string[];
    themeItems: string[];
    languageTitle: string;
    languageDescription: string;
    currentSuffix: string;
    switchToEnglish: string;
    switchToChinese: string;
    close: string;
  };
}

const zhCN: AppCopy = {
  shell: {
    hydrating: '正在启动 PUPY',
    apiOnline: 'API 在线',
    localFallback: '本地降级',
    settings: '设置',
    localSession: '本地会话',
    filters: '筛选器',
    breeding: '繁育配对',
    diary: '日记空间',
    prayer: 'AI 祈愿',
    adminPanel: '后端面板',
    systemSettings: '系统设置',
    runtime: '运行状态',
    healthy: '健康',
    fallback: '降级',
    notificationCenter: '通知中心',
    notificationDescription: '以下是当前已同步的真实通知。',
    notificationEmpty: '没有新的匹配、聊天或系统提醒。',
    sessionAndControls: '会话与控制',
  },
  nav: {
    home: '首页',
    tour: '云游',
    messages: '消息',
    market: '集市',
    profile: '我的',
  },
  toast: {
    synced: '资料已同步到后端。',
    localMode: '已进入本地体验模式。',
    matched: '已送出喜欢，等待系统匹配。',
    switchedZh: '已切换为中文。',
    switchedEn: '已切换为英文。',
  },
  backend: {
    waiting: '等待 API 健康检查。',
    apiReady: 'API 已在线。',
    healthFailed: '健康检查失败。',
  },
  settings: {
    title: '设置中心',
    petProfile: '宠物档案',
    noPetProfile: '还没有宠物档案',
    realPetProfile: '已连接真实宠物档案',
    digitalProfile: '当前为数字体验档案',
    notLoggedIn: '当前未登录账号',
    backendStatus: '后端状态',
    apiConnection: 'API 连接',
    online: '在线',
    degraded: '降级',
    environment: '环境',
    unknown: '未知',
    admin: '后台',
    openAdminPanel: '打开后端面板',
    general: '通用设置',
    risk: '风险操作',
    reset: '重置应用与引导流程',
    configuredShell: 'PUPY V5 已配置外壳',
    notifications: '通知中心',
    privacy: '隐私与安全',
    language: '语言设置',
    theme: '主题样式',
    notificationsDescription: '这里会统一接入配对提醒、聊天未读、繁育进度和系统消息。',
    privacyDescription: '下一步会在这里接入资料可见范围、拉黑名单、聊天风控和登录安全。',
    themeDescription: '主题样式会在后续支持浅色、深色和品牌色板的切换。',
    notificationsItems: ['未读消息聚合', '匹配成功提醒', '订单与繁育节点通知'],
    privacyItems: ['资料可见范围', '拉黑与举报', '登录与设备安全'],
    themeItems: ['品牌色变量预览', '卡片圆角与阴影配置', '夜间模式预留'],
    languageTitle: '语言设置',
    languageDescription: '前后端默认使用中文，同时保留英文作为第二语言。切换后新的请求会携带语言偏好。',
    currentSuffix: '当前',
    switchToEnglish: '切换为 English',
    switchToChinese: '切换为中文',
    close: '关闭',
  },
};

const enUS: AppCopy = {
  shell: {
    hydrating: 'Starting PUPY',
    apiOnline: 'API Online',
    localFallback: 'Local Fallback',
    settings: 'Settings',
    localSession: 'Local Session',
    filters: 'Filters',
    breeding: 'Breeding',
    diary: 'Diary',
    prayer: 'AI Wishes',
    adminPanel: 'Admin Panel',
    systemSettings: 'System Settings',
    runtime: 'Runtime',
    healthy: 'Healthy',
    fallback: 'Fallback',
    notificationCenter: 'Notification Center',
    notificationDescription: 'These are the live notifications currently synced from the backend.',
    notificationEmpty: 'No new matches, chats, or system reminders yet.',
    sessionAndControls: 'Session and controls',
  },
  nav: {
    home: 'Home',
    tour: 'Tour',
    messages: 'Messages',
    market: 'Market',
    profile: 'Profile',
  },
  toast: {
    synced: 'Your profile has been synced to the backend.',
    localMode: 'Switched to local experience mode.',
    matched: 'Like sent. Waiting for system matching.',
    switchedZh: 'Switched to Chinese.',
    switchedEn: 'Switched to English.',
  },
  backend: {
    waiting: 'Waiting for API health check.',
    apiReady: 'API is online.',
    healthFailed: 'Health check failed.',
  },
  settings: {
    title: 'Settings Center',
    petProfile: 'Pet Profile',
    noPetProfile: 'No pet profile yet',
    realPetProfile: 'Connected to a real pet profile',
    digitalProfile: 'Currently using a digital demo profile',
    notLoggedIn: 'No account is logged in',
    backendStatus: 'Backend Status',
    apiConnection: 'API Connection',
    online: 'Online',
    degraded: 'Degraded',
    environment: 'Environment',
    unknown: 'Unknown',
    admin: 'Admin',
    openAdminPanel: 'Open backend panel',
    general: 'General Settings',
    risk: 'Risk Actions',
    reset: 'Reset app and onboarding flow',
    configuredShell: 'PUPY V5 configured shell',
    notifications: 'Notification Center',
    privacy: 'Privacy and Safety',
    language: 'Language',
    theme: 'Theme',
    notificationsDescription: 'This area will centralize match alerts, unread chats, breeding progress, and system messages.',
    privacyDescription: 'Next, this will include profile visibility, block lists, chat moderation, and login safety.',
    themeDescription: 'Theme controls will support light, dark, and branded palettes in a later pass.',
    notificationsItems: ['Unread message digest', 'Successful match alerts', 'Order and breeding milestone updates'],
    privacyItems: ['Profile visibility', 'Block and report', 'Login and device security'],
    themeItems: ['Brand color variable preview', 'Card radius and shadow controls', 'Night mode reserve'],
    languageTitle: 'Language',
    languageDescription: 'Chinese is the primary language across frontend and backend, with English available as the secondary option. New requests will carry the selected language preference.',
    currentSuffix: 'Current',
    switchToEnglish: 'Switch to English',
    switchToChinese: 'Switch to Chinese',
    close: 'Close',
  },
};

export function getAppCopy(locale: AppLocale = getStoredLocale()): AppCopy {
  return locale === 'en-US' ? enUS : zhCN;
}

