-- PUPY operations seed
-- Generated at: 2026-04-09T12:51:28.560Z
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
(
    '45c21c42-5d57-8f9d-4347-e0bf67b9287e',
    'PUPY-MO-1775701144535',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('suli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('爪住集市') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.email) = lower('suli@pupy.app') OR lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    '上海',
    '主粮用品',
    '待审核',
    '已付款',
    '待拣货',
    188,
    1,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiLj+aglyIsInVzZXJFbWFpbCI6InN1bGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5aW25rK5Iiwic2VsbGVyTmFtZSI6IueIquS9j+mbhuW4giJ9
高蛋白主粮 + 关节营养包 + 飞盘补货。',
    '2026-04-09T02:19:04.535Z',
    '2026-04-09T02:19:04.535Z'
  ),
(
    '7ec15286-8ee7-245c-51da-3d6ff3e4abca',
    'PUPY-MO-240999',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('rhyssvv@gmail.com') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('Rhys 运营测试') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('爪住精选旗舰店') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('Pupy')
          AND (lower(u.email) = lower('rhyssvv@gmail.com') OR lower(u.username) = lower('Rhys 运营测试'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('Pupy') LIMIT 1)),
    '上海',
    '主粮用品',
    '已审核待发货',
    '已付款',
    '待拣货',
    399,
    2,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IlJoeXMg6L+Q6JCl5rWL6K+VIiwidXNlckVtYWlsIjoicmh5c3N2dkBnbWFpbC5jb20iLCJwZXROYW1lIjoiUHVweSIsInNlbGxlck5hbWUiOiLniKrkvY/nsr7pgInml5foiLDlupcifQ==
后台已完成审核流转验证。',
    '2026-04-09T01:43:42.836Z',
    '2026-04-09T01:43:42.884Z'
  ),
(
    'c1b0185c-5fcc-534c-c71c-1591c5a59534',
    'PUPY-MO-240901',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('suli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('爪住精选旗舰店') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.email) = lower('suli@pupy.app') OR lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    '上海',
    '主粮用品',
    '待发货',
    '已付款',
    '待拣货',
    428,
    3,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiLj+aglyIsInVzZXJFbWFpbCI6InN1bGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5aW25rK5Iiwic2VsbGVyTmFtZSI6IueIquS9j+eyvumAieaXl+iIsOW6lyJ9
高蛋白主粮 + 关节营养包 + 飞盘补货。',
    '2026-04-08T21:42:15.123Z',
    '2026-04-08T23:42:15.123Z'
  ),
(
    '6f3a9976-3185-b0f5-3178-daba037190d3',
    'PUPY-MO-240902',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('shenwu@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('沈雾') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('小爪营养仓') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('糯米')
          AND (lower(u.email) = lower('shenwu@pupy.app') OR lower(u.username) = lower('沈雾'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('糯米') LIMIT 1)),
    '上海',
    '主粮用品',
    '配送中',
    '已付款',
    '运输中',
    316,
    2,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuayiOmbviIsInVzZXJFbWFpbCI6InNoZW53dUBwdXB5LmFwcCIsInBldE5hbWUiOiLns6/nsbMiLCJzZWxsZXJOYW1lIjoi5bCP54iq6JCl5YW75LuTIn0=
晚间配送，前台可代收。',
    '2026-04-08T17:42:15.123Z',
    '2026-04-09T00:42:15.123Z'
  ),
(
    '0973db93-9510-8ae8-44d3-f4f8b9f6c237',
    'PUPY-MO-240903',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('qiaowan@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('乔晚') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('云端手作补给站') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.email) = lower('qiaowan@pupy.app') OR lower(u.username) = lower('乔晚'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)),
    '杭州',
    '主粮用品',
    '已完成',
    '已付款',
    '已签收',
    268,
    4,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuS5lOaZmiIsInVzZXJFbWFpbCI6InFpYW93YW5AcHVweS5hcHAiLCJwZXROYW1lIjoi5LiD5ZacIiwic2VsbGVyTmFtZSI6IuS6keerr+aJi+S9nOihpee7meermSJ9
回购款式，适合拍照出片。',
    '2026-04-08T11:42:15.123Z',
    '2026-04-08T19:42:15.123Z'
  ),
(
    'ea704ad9-2cfd-fd0a-e4b4-b0afe7eb76f7',
    'PUPY-MO-240904',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('linmeng@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('林檬') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('爪住集市 · 苏州门店') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('琥珀')
          AND (lower(u.email) = lower('linmeng@pupy.app') OR lower(u.username) = lower('林檬'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('琥珀') LIMIT 1)),
    '苏州',
    '主粮用品',
    '待客服确认',
    '待付款',
    '未出库',
    188,
    2,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6Iuael+aqrCIsInVzZXJFbWFpbCI6Imxpbm1lbmdAcHVweS5hcHAiLCJwZXROYW1lIjoi55Cl54+AIiwic2VsbGVyTmFtZSI6IueIquS9j+mbhuW4giDCtyDoi4/lt57pl6jlupcifQ==
用户希望改成周末自提。',
    '2026-04-08T07:42:15.123Z',
    '2026-04-08T15:42:15.123Z'
  ),
(
    '97eadf62-8f61-d91b-2551-195edef8198c',
    'PUPY-MO-240905',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('tangli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('唐梨') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('营养护理实验室') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('可颂')
          AND (lower(u.email) = lower('tangli@pupy.app') OR lower(u.username) = lower('唐梨'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('可颂') LIMIT 1)),
    '南京',
    '主粮用品',
    '售后处理中',
    '已退款中',
    '退货中',
    256,
    2,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuWUkOaiqCIsInVzZXJFbWFpbCI6InRhbmdsaUBwdXB5LmFwcCIsInBldE5hbWUiOiLlj6/pooIiLCJzZWxsZXJOYW1lIjoi6JCl5YW75oqk55CG5a6e6aqM5a6kIn0=
用户反馈尺码偏小，申请换货。',
    '2026-04-07T23:42:15.123Z',
    '2026-04-08T22:42:15.123Z'
  ),
(
    'c37a9aec-d53e-cadf-3a50-dad4a0a49130',
    'PUPY-MO-240906',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('xuting@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('许听') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('城市漫游装备铺') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('暖暖')
          AND (lower(u.email) = lower('xuting@pupy.app') OR lower(u.username) = lower('许听'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('暖暖') LIMIT 1)),
    '上海',
    '主粮用品',
    '已完成',
    '已付款',
    '已签收',
    539,
    5,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiuuOWQrCIsInVzZXJFbWFpbCI6Inh1dGluZ0BwdXB5LmFwcCIsInBldE5hbWUiOiLmmpbmmpYiLCJzZWxsZXJOYW1lIjoi5Z+O5biC5ryr5ri46KOF5aSH6ZO6In0=
作为云游地图活动礼包发放。',
    '2026-04-07T15:42:15.123Z',
    '2026-04-08T13:42:15.123Z'
  ),
(
    '68c7df13-76de-2cb3-72fb-3a51de51bcee',
    'PUPY-MO-240907',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('guqing@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('顾晴') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('社交训练补给仓') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('栗子')
          AND (lower(u.email) = lower('guqing@pupy.app') OR lower(u.username) = lower('顾晴'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('栗子') LIMIT 1)),
    '杭州',
    '主粮用品',
    '待发货',
    '已付款',
    '待拣货',
    299,
    3,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IumhvuaZtCIsInVzZXJFbWFpbCI6Imd1cWluZ0BwdXB5LmFwcCIsInBldE5hbWUiOiLmoJflrZAiLCJzZWxsZXJOYW1lIjoi56S+5Lqk6K6t57uD6KGl57uZ5LuTIn0=
备注活动价优先发。',
    '2026-04-07T07:42:15.123Z',
    '2026-04-08T07:42:15.123Z'
  ),
(
    'c663fb76-a5f6-89ee-c6b9-919143cb54e7',
    'PUPY-MO-240908',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('mengzhi@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('孟枝') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('海边补给铺') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('布丁')
          AND (lower(u.email) = lower('mengzhi@pupy.app') OR lower(u.username) = lower('孟枝'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('布丁') LIMIT 1)),
    '宁波',
    '主粮用品',
    '已完成',
    '已付款',
    '已签收',
    172,
    2,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuWtn+aenSIsInVzZXJFbWFpbCI6Im1lbmd6aGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5biD5LiBIiwic2VsbGVyTmFtZSI6Iua1t+i+ueihpee7memTuiJ9
沙滩出游用具已完成回购。',
    '2026-04-06T17:42:15.123Z',
    '2026-04-08T05:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    order_no = EXCLUDED.order_no,
    user_id = EXCLUDED.user_id,
    seller_id = EXCLUDED.seller_id,
    pet_id = EXCLUDED.pet_id,
    city = EXCLUDED.city,
    source = EXCLUDED.source,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    fulfillment_status = EXCLUDED.fulfillment_status,
    total = EXCLUDED.total,
    quantity = EXCLUDED.quantity,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

DELETE FROM public.market_order_items
WHERE order_id IN ('45c21c42-5d57-8f9d-4347-e0bf67b9287e', '7ec15286-8ee7-245c-51da-3d6ff3e4abca', 'c1b0185c-5fcc-534c-c71c-1591c5a59534', '6f3a9976-3185-b0f5-3178-daba037190d3', '0973db93-9510-8ae8-44d3-f4f8b9f6c237', 'ea704ad9-2cfd-fd0a-e4b4-b0afe7eb76f7', '97eadf62-8f61-d91b-2551-195edef8198c', 'c37a9aec-d53e-cadf-3a50-dad4a0a49130', '68c7df13-76de-2cb3-72fb-3a51de51bcee', 'c663fb76-a5f6-89ee-c6b9-919143cb54e7');

INSERT INTO public.market_order_items (
  id, order_id, product_id, title, image, unit_price, quantity, created_at
) VALUES
(
    'aff72d1a-5030-f17d-3e95-7b998d1edf86',
    '45c21c42-5d57-8f9d-4347-e0bf67b9287e',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('验证主粮订单') LIMIT 1),
    '验证主粮订单',
    '',
    188,
    1,
    '2026-04-09T02:19:04.535Z'
  ),
(
    'a524a15e-1f61-ce43-df18-38666c404fff',
    '7ec15286-8ee7-245c-51da-3d6ff3e4abca',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('后台验证主粮包') LIMIT 1),
    '后台验证主粮包',
    '',
    199.5,
    2,
    '2026-04-09T01:43:42.836Z'
  ),
(
    'a226713f-11de-bb4b-2c32-7dd99cc39d50',
    'c1b0185c-5fcc-534c-c71c-1591c5a59534',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('高适口冻干主粮') LIMIT 1),
    '高适口冻干主粮',
    '',
    199,
    1,
    '2026-04-08T21:42:15.123Z'
  ),
(
    'a4d90ff9-41d1-5de5-af29-ead7679a12c0',
    'c1b0185c-5fcc-534c-c71c-1591c5a59534',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('关节养护营养包') LIMIT 1),
    '关节养护营养包',
    '',
    129,
    1,
    '2026-04-08T21:42:15.123Z'
  ),
(
    'a0a8b8df-9b5d-17ca-cf44-812b712c7e56',
    'c1b0185c-5fcc-534c-c71c-1591c5a59534',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('飞盘训练套组') LIMIT 1),
    '飞盘训练套组',
    '',
    50,
    2,
    '2026-04-08T21:42:15.123Z'
  ),
(
    'cb85102e-6c42-8a75-9d19-3b16df836835',
    '6f3a9976-3185-b0f5-3178-daba037190d3',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('低敏羊肉主粮') LIMIT 1),
    '低敏羊肉主粮',
    '',
    158,
    2,
    '2026-04-08T17:42:15.123Z'
  ),
(
    'fb63834b-de15-6391-3943-02b54e2258ab',
    '0973db93-9510-8ae8-44d3-f4f8b9f6c237',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('毛绒牵引绳配件') LIMIT 1),
    '毛绒牵引绳配件',
    '',
    88,
    2,
    '2026-04-08T11:42:15.123Z'
  ),
(
    'e34ef396-9d28-86cc-99f1-850772c66684',
    '0973db93-9510-8ae8-44d3-f4f8b9f6c237',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('香波旅行装') LIMIT 1),
    '香波旅行装',
    '',
    46,
    2,
    '2026-04-08T11:42:15.123Z'
  ),
(
    'd0769294-42e9-54a3-f585-4a027072dfed',
    'ea704ad9-2cfd-fd0a-e4b4-b0afe7eb76f7',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('鲜肉主粮试吃礼盒') LIMIT 1),
    '鲜肉主粮试吃礼盒',
    '',
    128,
    1,
    '2026-04-08T07:42:15.123Z'
  ),
(
    '0571c2a1-7132-c028-3282-0327b5037767',
    'ea704ad9-2cfd-fd0a-e4b4-b0afe7eb76f7',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('耐咬发声球') LIMIT 1),
    '耐咬发声球',
    '',
    60,
    1,
    '2026-04-08T07:42:15.123Z'
  ),
(
    '3740739b-094a-b8ca-6e0c-13c9085249fa',
    '97eadf62-8f61-d91b-2551-195edef8198c',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('护毛精华喷雾') LIMIT 1),
    '护毛精华喷雾',
    '',
    128,
    2,
    '2026-04-07T23:42:15.123Z'
  ),
(
    '10a0ea38-9ef0-f22e-d5b5-c1f3c5cee62d',
    'c37a9aec-d53e-cadf-3a50-dad4a0a49130',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('夜光胸背套装') LIMIT 1),
    '夜光胸背套装',
    '',
    159,
    1,
    '2026-04-07T15:42:15.123Z'
  ),
(
    'dc975d5c-a2df-c0f8-055c-6016dfe8b704',
    'c37a9aec-d53e-cadf-3a50-dad4a0a49130',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('冻干零食组合') LIMIT 1),
    '冻干零食组合',
    '',
    95,
    4,
    '2026-04-07T15:42:15.123Z'
  ),
(
    '840e0e11-4dcf-e0dc-1ca1-0403653337be',
    '68c7df13-76de-2cb3-72fb-3a51de51bcee',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('飞盘进阶组合') LIMIT 1),
    '飞盘进阶组合',
    '',
    99,
    3,
    '2026-04-07T07:42:15.123Z'
  ),
(
    'e74d0e7d-a913-8334-6095-61e53a3392db',
    'c663fb76-a5f6-89ee-c6b9-919143cb54e7',
    (SELECT id FROM public.market_products WHERE lower(title) = lower('足部清洁泡沫') LIMIT 1),
    '足部清洁泡沫',
    '',
    86,
    2,
    '2026-04-06T17:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    order_id = EXCLUDED.order_id,
    product_id = EXCLUDED.product_id,
    title = EXCLUDED.title,
    image = EXCLUDED.image,
    unit_price = EXCLUDED.unit_price,
    quantity = EXCLUDED.quantity,
    created_at = EXCLUDED.created_at;

INSERT INTO public.walk_orders (
  id, order_no, user_id, pet_id, walker_name, city, service_zone, status, review_status,
  scheduled_at, duration_minutes, price, note, created_at, updated_at
) VALUES
(
    '35a39b5b-8e2c-f9f0-9044-d3dd804323ff',
    'PUPY-WK-1775701144713',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('suli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.email) = lower('suli@pupy.app') OR lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    '验证遛犬师',
    '上海',
    '徐汇滨江',
    '待确认',
    '待审核',
    '2026-04-11T06:00:00.000Z',
    90,
    168,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiLj+aglyIsInVzZXJFbWFpbCI6InN1bGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5aW25rK5In0=
希望带上飞盘并拍几张互动照。',
    '2026-04-09T02:19:04.713Z',
    '2026-04-09T02:19:04.713Z'
  ),
(
    '8711c133-c6a9-3937-73f5-fa9904a75ca2',
    'PUPY-WK-240901',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('suli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.email) = lower('suli@pupy.app') OR lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    '徐川 · 认证遛犬师',
    '上海',
    '徐汇滨江',
    '待确认',
    '待审核',
    '2026-04-09T13:42:15.123Z',
    60,
    168,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiLj+aglyIsInVzZXJFbWFpbCI6InN1bGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5aW25rK5In0=
希望带上飞盘并拍几张互动照。',
    '2026-04-08T22:42:15.123Z',
    '2026-04-08T23:42:15.123Z'
  ),
(
    '16024b32-e907-c848-c83a-037e51965ed0',
    'PUPY-WK-240902',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('shenwu@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('沈雾') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('糯米')
          AND (lower(u.email) = lower('shenwu@pupy.app') OR lower(u.username) = lower('沈雾'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('糯米') LIMIT 1)),
    'PUPY 城市陪伴官 Luna',
    '上海',
    '静安雕塑公园',
    '已接单',
    '已通过',
    '2026-04-09T07:42:15.123Z',
    45,
    138,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuayiOmbviIsInVzZXJFbWFpbCI6InNoZW53dUBwdXB5LmFwcCIsInBldE5hbWUiOiLns6/nsbMifQ==
偏安静路线，避免过多人流。',
    '2026-04-08T19:42:15.123Z',
    '2026-04-09T00:42:15.123Z'
  ),
(
    '170f61d7-2a67-7d71-a8b7-8d0d781e86aa',
    'PUPY-WK-240903',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('qiaowan@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('乔晚') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.email) = lower('qiaowan@pupy.app') OR lower(u.username) = lower('乔晚'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)),
    '摄影遛遛搭子 阿辰',
    '杭州',
    '西湖绿道',
    '已完成',
    '已通过',
    '2026-04-08T17:42:15.123Z',
    90,
    218,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuS5lOaZmiIsInVzZXJFbWFpbCI6InFpYW93YW5AcHVweS5hcHAiLCJwZXROYW1lIjoi5LiD5ZacIn0=
已补回 20 张精选照片。',
    '2026-04-08T05:42:15.123Z',
    '2026-04-08T21:42:15.123Z'
  ),
(
    '5154903e-ff3b-21ac-69db-2faaea45a8dd',
    'PUPY-WK-240904',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('linmeng@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('林檬') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('琥珀')
          AND (lower(u.email) = lower('linmeng@pupy.app') OR lower(u.username) = lower('林檬'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('琥珀') LIMIT 1)),
    '苏州草地局主理人',
    '苏州',
    '独墅湖公园',
    '已取消',
    '已拒绝',
    '2026-04-09T21:42:15.123Z',
    60,
    158,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6Iuael+aqrCIsInVzZXJFbWFpbCI6Imxpbm1lbmdAcHVweS5hcHAiLCJwZXROYW1lIjoi55Cl54+AIn0=
因天气原因取消，用户待重新下单。',
    '2026-04-08T09:42:15.123Z',
    '2026-04-08T20:42:15.123Z'
  ),
(
    'f43013d1-988a-eb6b-5597-09f26251362d',
    'PUPY-WK-240905',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('tangli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('唐梨') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('可颂')
          AND (lower(u.email) = lower('tangli@pupy.app') OR lower(u.username) = lower('唐梨'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('可颂') LIMIT 1)),
    '营养运动陪伴师 Mia',
    '南京',
    '玄武湖环线',
    '待服务',
    '已通过',
    '2026-04-10T05:42:15.123Z',
    75,
    198,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuWUkOaiqCIsInVzZXJFbWFpbCI6InRhbmdsaUBwdXB5LmFwcCIsInBldE5hbWUiOiLlj6/pooIifQ==
需同步记录运动心率与饮水频次。',
    '2026-04-08T01:42:15.123Z',
    '2026-04-08T18:42:15.123Z'
  ),
(
    '80fd4d43-9aaa-0049-8986-d373d3738da8',
    'PUPY-WK-240906',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('guqing@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('顾晴') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('栗子')
          AND (lower(u.email) = lower('guqing@pupy.app') OR lower(u.username) = lower('顾晴'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('栗子') LIMIT 1)),
    '飞盘陪练小组',
    '杭州',
    '滨江飞盘草坪',
    '已接单',
    '已通过',
    '2026-04-10T13:42:15.123Z',
    60,
    188,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IumhvuaZtCIsInVzZXJFbWFpbCI6Imd1cWluZ0BwdXB5LmFwcCIsInBldE5hbWUiOiLmoJflrZAifQ==
高活跃用户，优先安排社交训练型遛遛。',
    '2026-04-07T19:42:15.123Z',
    '2026-04-08T16:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    order_no = EXCLUDED.order_no,
    user_id = EXCLUDED.user_id,
    pet_id = EXCLUDED.pet_id,
    walker_name = EXCLUDED.walker_name,
    city = EXCLUDED.city,
    service_zone = EXCLUDED.service_zone,
    status = EXCLUDED.status,
    review_status = EXCLUDED.review_status,
    scheduled_at = EXCLUDED.scheduled_at,
    duration_minutes = EXCLUDED.duration_minutes,
    price = EXCLUDED.price,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.care_bookings (
  id, booking_no, user_id, pet_id, merchant_name, city, service_name, status, review_status,
  scheduled_at, price, note, created_at, updated_at
) VALUES
(
    '6ed51657-616f-2034-a4a8-e6ca02eb40da',
    'PUPY-CR-1775701144436',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('suli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.email) = lower('suli@pupy.app') OR lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    '爪住护理中心·验证店',
    '上海',
    '验证洗护预约',
    '待商家确认',
    '待审核',
    '2026-04-10T10:30:00.000Z',
    219,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiLj+aglyIsInVzZXJFbWFpbCI6InN1bGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5aW25rK5In0=
周末上午档，需温和香氛。',
    '2026-04-09T02:19:04.437Z',
    '2026-04-09T02:19:04.437Z'
  ),
(
    '3723cfc4-ca45-86f0-93e0-2ee5b7a21c5d',
    'PUPY-CR-240901',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('suli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.email) = lower('suli@pupy.app') OR lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    '爪住护理中心 · 徐汇店',
    '上海',
    '洗护 + 精修 + 香氛护理',
    '待到店',
    '已通过',
    '2026-04-09T11:42:15.123Z',
    299,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiLj+aglyIsInVzZXJFbWFpbCI6InN1bGlAcHVweS5hcHAiLCJwZXROYW1lIjoi5aW25rK5In0=
周末上午档，需温和香氛。',
    '2026-04-08T20:42:15.123Z',
    '2026-04-09T00:42:15.123Z'
  ),
(
    '2eaf7455-7db2-9e7c-f49d-2c1237bc4108',
    'PUPY-CR-240902',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('shenwu@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('沈雾') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('糯米')
          AND (lower(u.email) = lower('shenwu@pupy.app') OR lower(u.username) = lower('沈雾'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('糯米') LIMIT 1)),
    '安静系护理室',
    '上海',
    '低刺激精洗护理',
    '已确认',
    '已通过',
    '2026-04-09T19:42:15.123Z',
    236,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuayiOmbviIsInVzZXJFbWFpbCI6InNoZW53dUBwdXB5LmFwcCIsInBldE5hbWUiOiLns6/nsbMifQ==
门店已安排低噪护理位。',
    '2026-04-08T15:42:15.123Z',
    '2026-04-08T23:42:15.123Z'
  ),
(
    '376c5be9-6866-c55d-85ac-f1e0ae19aae6',
    'PUPY-CR-240903',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('qiaowan@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('乔晚') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.email) = lower('qiaowan@pupy.app') OR lower(u.username) = lower('乔晚'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)),
    '城市美容实验室',
    '杭州',
    '拍照造型护理',
    '已完成',
    '已通过',
    '2026-04-08T13:42:15.123Z',
    328,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuS5lOaZmiIsInVzZXJFbWFpbCI6InFpYW93YW5AcHVweS5hcHAiLCJwZXROYW1lIjoi5LiD5ZacIn0=
用户已追加下次造型预约。',
    '2026-04-08T03:42:15.123Z',
    '2026-04-08T19:42:15.123Z'
  ),
(
    'beb8b8a5-418b-faff-d977-8cc4d36df0e0',
    'PUPY-CR-240904',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('linmeng@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('林檬') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('琥珀')
          AND (lower(u.email) = lower('linmeng@pupy.app') OR lower(u.username) = lower('林檬'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('琥珀') LIMIT 1)),
    '草地局合作门店',
    '苏州',
    '运动后舒缓护理',
    '待审核',
    '待审核',
    '2026-04-10T07:42:15.123Z',
    188,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6Iuael+aqrCIsInVzZXJFbWFpbCI6Imxpbm1lbmdAcHVweS5hcHAiLCJwZXROYW1lIjoi55Cl54+AIn0=
新增合作商家，等待运营复核资质。',
    '2026-04-07T21:42:15.123Z',
    '2026-04-08T13:42:15.123Z'
  ),
(
    '6a9d5160-65c5-c04b-ca28-c32980c0e430',
    'PUPY-CR-240905',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('tangli@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('唐梨') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('可颂')
          AND (lower(u.email) = lower('tangli@pupy.app') OR lower(u.username) = lower('唐梨'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('可颂') LIMIT 1)),
    '营养护理研究所',
    '南京',
    '皮毛修复疗程',
    '待到店',
    '已通过',
    '2026-04-10T19:42:15.123Z',
    468,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuWUkOaiqCIsInVzZXJFbWFpbCI6InRhbmdsaUBwdXB5LmFwcCIsInBldE5hbWUiOiLlj6/pooIifQ==
需同步上传护理前后对比图。',
    '2026-04-07T17:42:15.123Z',
    '2026-04-08T17:42:15.123Z'
  ),
(
    '3544625f-e270-874e-ddda-f3d022a7ef24',
    'PUPY-CR-240906',
    COALESCE((SELECT id FROM public.users WHERE lower(email) = lower('xuting@pupy.app') LIMIT 1), (SELECT id FROM public.users WHERE lower(username) = lower('许听') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('暖暖')
          AND (lower(u.email) = lower('xuting@pupy.app') OR lower(u.username) = lower('许听'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('暖暖') LIMIT 1)),
    '城市漫步美容站',
    '上海',
    '旅行清洁护理',
    '已完成',
    '已通过',
    '2026-04-08T05:42:15.123Z',
    208,
    '__PUPY_META__:eyJ1c2VyTmFtZSI6IuiuuOWQrCIsInVzZXJFbWFpbCI6Inh1dGluZ0BwdXB5LmFwcCIsInBldE5hbWUiOiLmmpbmmpYifQ==
已带动 3 位用户跟单预约。',
    '2026-04-07T13:42:15.123Z',
    '2026-04-08T16:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    booking_no = EXCLUDED.booking_no,
    user_id = EXCLUDED.user_id,
    pet_id = EXCLUDED.pet_id,
    merchant_name = EXCLUDED.merchant_name,
    city = EXCLUDED.city,
    service_name = EXCLUDED.service_name,
    status = EXCLUDED.status,
    review_status = EXCLUDED.review_status,
    scheduled_at = EXCLUDED.scheduled_at,
    price = EXCLUDED.price,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.pet_love_records (
  id, owner_a_id, owner_b_id, pet_a_id, pet_b_id, city, status, review_status,
  romance_stage, compatibility_score, note, created_at, updated_at
) VALUES
(
    '49ac4feb-6a0d-c645-ecea-37ab1f75cfc4',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('白溪') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('云朵')
          AND (lower(u.username) = lower('白溪'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('云朵') LIMIT 1)),
    '上海',
    '高热匹配',
    '已通过',
    '已互相关注',
    0.96,
    '__PUPY_META__:eyJvd25lckFOYW1lIjoi6IuP5qCXIiwib3duZXJCTmFtZSI6IueZvea6qiIsInBldEFOYW1lIjoi5aW25rK5IiwicGV0Qk5hbWUiOiLkupHmnLUifQ==
用户双方都连续三天打开了聊天会话。',
    '2026-04-08T20:42:15.123Z',
    '2026-04-09T00:42:15.123Z'
  ),
(
    '5c2bd711-fbb9-90ae-d975-d926b8ea263f',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('沈雾') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('唐梨') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('糯米')
          AND (lower(u.username) = lower('沈雾'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('糯米') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('可颂')
          AND (lower(u.username) = lower('唐梨'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('可颂') LIMIT 1)),
    '上海',
    '待进一步观察',
    '待审核',
    '资料互看中',
    0.82,
    '__PUPY_META__:eyJvd25lckFOYW1lIjoi5rKI6Zu+Iiwib3duZXJCTmFtZSI6IuWUkOaiqCIsInBldEFOYW1lIjoi57Ov57GzIiwicGV0Qk5hbWUiOiLlj6/pooIifQ==
建议先安排线下遛遛局再推进。',
    '2026-04-08T13:42:15.123Z',
    '2026-04-08T21:42:15.123Z'
  ),
(
    '2d25fd68-73ae-f27c-ecb3-86c7941ac113',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('乔晚') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('顾晴') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.username) = lower('乔晚'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('栗子')
          AND (lower(u.username) = lower('顾晴'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('栗子') LIMIT 1)),
    '杭州',
    '已进入聊天',
    '已通过',
    '约线下局',
    0.88,
    '__PUPY_META__:eyJvd25lckFOYW1lIjoi5LmU5pmaIiwib3duZXJCTmFtZSI6IumhvuaZtCIsInBldEFOYW1lIjoi5LiD5ZacIiwicGV0Qk5hbWUiOiLmoJflrZAifQ==
两位主人都属于高内容活跃用户。',
    '2026-04-08T07:42:15.123Z',
    '2026-04-08T19:42:15.123Z'
  ),
(
    'c64a7c56-be67-6d05-47eb-fc1e149edbe1',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('许听') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('叶澄') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('暖暖')
          AND (lower(u.username) = lower('许听'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('暖暖') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('泡芙')
          AND (lower(u.username) = lower('叶澄'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('泡芙') LIMIT 1)),
    '上海',
    '平台推荐位',
    '已通过',
    '双向右滑',
    0.91,
    '__PUPY_META__:eyJvd25lckFOYW1lIjoi6K645ZCsIiwib3duZXJCTmFtZSI6IuWPtua+hCIsInBldEFOYW1lIjoi5pqW5pqWIiwicGV0Qk5hbWUiOiLms6HoipkifQ==
推荐给重度测试用户展示热闹氛围。',
    '2026-04-08T01:42:15.123Z',
    '2026-04-08T18:42:15.123Z'
  ),
(
    '5cb33b09-8839-770b-d045-f55a0095b305',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('孟枝') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('周翎') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('布丁')
          AND (lower(u.username) = lower('孟枝'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('布丁') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('蜜豆')
          AND (lower(u.username) = lower('周翎'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('蜜豆') LIMIT 1)),
    '成都',
    '内容热度高',
    '已通过',
    '日记互评中',
    0.86,
    '__PUPY_META__:eyJvd25lckFOYW1lIjoi5a2f5p6dIiwib3duZXJCTmFtZSI6IuWRqOe/jiIsInBldEFOYW1lIjoi5biD5LiBIiwicGV0Qk5hbWUiOiLonJzosYYifQ==
双方最近互动频次显著上升。',
    '2026-04-07T19:42:15.123Z',
    '2026-04-08T15:42:15.123Z'
  ),
(
    '97c56dcb-fc5c-90bc-fb19-1169fcf67993',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('林檬') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('袁澈') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('琥珀')
          AND (lower(u.username) = lower('林檬'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('琥珀') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('拿铁')
          AND (lower(u.username) = lower('袁澈'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('拿铁') LIMIT 1)),
    '上海',
    '运营关注中',
    '待复核',
    '约第一次见面',
    0.79,
    '__PUPY_META__:eyJvd25lckFOYW1lIjoi5p6X5qqsIiwib3duZXJCTmFtZSI6Iuiigea+iCIsInBldEFOYW1lIjoi55Cl54+AIiwicGV0Qk5hbWUiOiLmi7/pk4EifQ==
需要补充健康记录后再放量展示。',
    '2026-04-07T09:42:15.123Z',
    '2026-04-08T11:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    owner_a_id = EXCLUDED.owner_a_id,
    owner_b_id = EXCLUDED.owner_b_id,
    pet_a_id = EXCLUDED.pet_a_id,
    pet_b_id = EXCLUDED.pet_b_id,
    city = EXCLUDED.city,
    status = EXCLUDED.status,
    review_status = EXCLUDED.review_status,
    romance_stage = EXCLUDED.romance_stage,
    compatibility_score = EXCLUDED.compatibility_score,
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.chat_sessions (
  id, session_no, type, title, city, status, user_a_id, user_b_id, pet_a_id, pet_b_id,
  unread_count, latest_snippet, created_at, updated_at
) VALUES
(
    '093115dd-603a-023d-c060-20f96a376ccb',
    'PUPY-CH-249999',
    'owner',
    'Rhys × 苏栗 · 后台验证会话',
    '上海',
    '待运营复核',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('Rhys') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('Pupy')
          AND (lower(u.username) = lower('Rhys'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('Pupy') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    0,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsiUmh5cyIsIuiLj+aglyJdLCJyZWxhdGVkUGV0cyI6WyJQdXB5Iiwi5aW25rK5Il19
前端联调验证消息。',
    '2026-04-09T01:43:42.897Z',
    '2026-04-09T02:19:05.497Z'
  ),
(
    '9f08fe9c-36c2-4979-6a64-6bf873489e2c',
    'PUPY-CH-240901',
    'owner',
    '苏栗 × 白溪 · 主人聊天',
    '上海',
    '活跃',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('苏栗') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('白溪') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.username) = lower('苏栗'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('云朵')
          AND (lower(u.username) = lower('白溪'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('云朵') LIMIT 1)),
    2,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsi6IuP5qCXIiwi55m95rqqIl0sInJlbGF0ZWRQZXRzIjpbIuWltuayuSIsIuS6keactSJdfQ==
这周末可以先一起去滨江遛一圈。',
    '2026-04-08T13:42:15.123Z',
    '2026-04-08T23:42:15.123Z'
  ),
(
    '32b75aec-79fe-b64a-4191-57a18cd3a753',
    'PUPY-CH-240902',
    'owner',
    '乔晚 × 顾晴 · 主人聊天',
    '杭州',
    '高频互动',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('乔晚') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('顾晴') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.username) = lower('乔晚'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('栗子')
          AND (lower(u.username) = lower('顾晴'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('栗子') LIMIT 1)),
    0,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsi5LmU5pmaIiwi6aG+5pm0Il0sInJlbGF0ZWRQZXRzIjpbIuS4g+WWnCIsIuagl+WtkCJdfQ==
活动海报我今晚做好发给你。',
    '2026-04-08T07:42:15.123Z',
    '2026-04-08T20:42:15.123Z'
  ),
(
    '113ff8d6-0919-1843-32b1-b4346d51b1b0',
    'PUPY-PC-240901',
    'pet',
    '奶油 × 云朵 · 宠物私语',
    '上海',
    '热聊中',
    (SELECT p.user_id FROM public.pets p WHERE p.id = COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.username) = lower('奶油'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)) LIMIT 1),
    (SELECT p.user_id FROM public.pets p WHERE p.id = COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('云朵')
          AND (lower(u.username) = lower('云朵'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('云朵') LIMIT 1)) LIMIT 1),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('奶油')
          AND (lower(u.username) = lower('奶油'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('奶油') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('云朵')
          AND (lower(u.username) = lower('云朵'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('云朵') LIMIT 1)),
    1,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsi5aW25rK5Iiwi5LqR5py1Il0sInJlbGF0ZWRQZXRzIjpbIuWltuayuSIsIuS6keactSJdfQ==
下次见面我要带上我最喜欢的球。',
    '2026-04-08T09:42:15.123Z',
    '2026-04-08T21:42:15.123Z'
  ),
(
    '3495650d-7a4b-f490-7164-0d756474ae4c',
    'PUPY-PC-240902',
    'pet',
    '暖暖 × 泡芙 · 宠物私语',
    '上海',
    '已建立默契',
    (SELECT p.user_id FROM public.pets p WHERE p.id = COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('暖暖')
          AND (lower(u.username) = lower('暖暖'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('暖暖') LIMIT 1)) LIMIT 1),
    (SELECT p.user_id FROM public.pets p WHERE p.id = COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('泡芙')
          AND (lower(u.username) = lower('泡芙'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('泡芙') LIMIT 1)) LIMIT 1),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('暖暖')
          AND (lower(u.username) = lower('暖暖'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('暖暖') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('泡芙')
          AND (lower(u.username) = lower('泡芙'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('泡芙') LIMIT 1)),
    0,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsi5pqW5pqWIiwi5rOh6IqZIl0sInJlbGF0ZWRQZXRzIjpbIuaaluaaliIsIuazoeiKmSJdfQ==
云端森林里见，我带上散步靴。',
    '2026-04-08T05:42:15.123Z',
    '2026-04-08T17:42:15.123Z'
  ),
(
    '73dd711b-e70d-44cb-bb47-a46c66a670e7',
    'PUPY-CH-240903',
    'owner',
    '唐梨 × 叶澄 · 主人聊天',
    '上海',
    '待回复',
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('唐梨') LIMIT 1)),
    COALESCE((SELECT id FROM public.users WHERE lower(username) = lower('叶澄') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('可颂')
          AND (lower(u.username) = lower('唐梨'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('可颂') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('泡芙')
          AND (lower(u.username) = lower('叶澄'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('泡芙') LIMIT 1)),
    3,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsi5ZSQ5qKoIiwi5Y+25r6EIl0sInJlbGF0ZWRQZXRzIjpbIuWPr+migiIsIuazoeiKmSJdfQ==
我把体检记录发你，你方便看下吗？',
    '2026-04-08T03:42:15.123Z',
    '2026-04-09T00:42:15.123Z'
  ),
(
    '6f3dba41-80ec-abfc-24ec-4e1e6745b0a1',
    'PUPY-PC-240903',
    'pet',
    '栗子 × 七喜 · 宠物私语',
    '杭州',
    '待审核展示',
    (SELECT p.user_id FROM public.pets p WHERE p.id = COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('栗子')
          AND (lower(u.username) = lower('栗子'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('栗子') LIMIT 1)) LIMIT 1),
    (SELECT p.user_id FROM public.pets p WHERE p.id = COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.username) = lower('七喜'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)) LIMIT 1),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('栗子')
          AND (lower(u.username) = lower('栗子'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('栗子') LIMIT 1)),
    COALESCE((SELECT p.id
        FROM public.pets p
        LEFT JOIN public.users u ON u.id = p.user_id
        WHERE lower(p.name) = lower('七喜')
          AND (lower(u.username) = lower('七喜'))
        LIMIT 1), (SELECT p.id FROM public.pets p WHERE lower(p.name) = lower('七喜') LIMIT 1)),
    0,
    '__PUPY_META__:eyJwYXJ0aWNpcGFudHMiOlsi5qCX5a2QIiwi5LiD5ZacIl0sInJlbGF0ZWRQZXRzIjpbIuagl+WtkCIsIuS4g+WWnCJdfQ==
我今天又拍了超多照片。',
    '2026-04-07T23:42:15.123Z',
    '2026-04-08T18:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    session_no = EXCLUDED.session_no,
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    city = EXCLUDED.city,
    status = EXCLUDED.status,
    user_a_id = EXCLUDED.user_a_id,
    user_b_id = EXCLUDED.user_b_id,
    pet_a_id = EXCLUDED.pet_a_id,
    pet_b_id = EXCLUDED.pet_b_id,
    unread_count = EXCLUDED.unread_count,
    latest_snippet = EXCLUDED.latest_snippet,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

DELETE FROM public.chat_session_messages
WHERE session_id IN ('093115dd-603a-023d-c060-20f96a376ccb', '9f08fe9c-36c2-4979-6a64-6bf873489e2c', '32b75aec-79fe-b64a-4191-57a18cd3a753', '113ff8d6-0919-1843-32b1-b4346d51b1b0', '3495650d-7a4b-f490-7164-0d756474ae4c', '73dd711b-e70d-44cb-bb47-a46c66a670e7', '6f3dba41-80ec-abfc-24ec-4e1e6745b0a1');

INSERT INTO public.chat_session_messages (
  id, session_id, sender_label, sender_role, content, moderation_status, created_at
) VALUES
(
    'c95c7a6d-c5f7-e9b2-8d99-1f4332adc81a',
    '093115dd-603a-023d-c060-20f96a376ccb',
    'Rhys',
    'owner',
    '这里是后台新建会话验证。',
    '正常',
    '2026-04-09T09:00:00.000Z'
  ),
(
    '2cb3d5f7-8ba0-784f-ecc2-5992a7cfc44a',
    '093115dd-603a-023d-c060-20f96a376ccb',
    '苏栗',
    'owner',
    '前端联调验证消息。',
    '正常',
    '2026-04-09T02:19:05.497Z'
  ),
(
    '29b49b08-5f8d-d5d7-172a-f24c405ea68f',
    '9f08fe9c-36c2-4979-6a64-6bf873489e2c',
    '苏栗',
    'owner',
    '我看云朵最近的日记真的很治愈。',
    '正常',
    '2026-04-08T18:42:15.123Z'
  ),
(
    '170724c5-e696-69bb-cff8-71033b751928',
    '9f08fe9c-36c2-4979-6a64-6bf873489e2c',
    '白溪',
    'owner',
    '奶油也太会接飞盘了，周末要不要一起遛？',
    '正常',
    '2026-04-08T19:42:15.123Z'
  ),
(
    '731e2a00-936c-a09c-bea4-e292c91e194d',
    '9f08fe9c-36c2-4979-6a64-6bf873489e2c',
    '苏栗',
    'owner',
    '可以，我把时间空出来。',
    '正常',
    '2026-04-08T23:42:15.123Z'
  ),
(
    '7815494c-ca9a-841a-b34d-3833086afde2',
    '32b75aec-79fe-b64a-4191-57a18cd3a753',
    '顾晴',
    'owner',
    '线下局的人数已经快满了。',
    '正常',
    '2026-04-08T14:42:15.123Z'
  ),
(
    '044357e9-4375-9590-aa61-f142dd2f2b9b',
    '32b75aec-79fe-b64a-4191-57a18cd3a753',
    '乔晚',
    'owner',
    '我来做一版海报，七喜当封面。',
    '正常',
    '2026-04-08T20:42:15.123Z'
  ),
(
    'e34ecf7c-4dd3-d8b1-2a35-7174f143d59c',
    '113ff8d6-0919-1843-32b1-b4346d51b1b0',
    '奶油',
    'pet',
    '汪，我听说你家窗边很适合晒太阳。',
    '正常',
    '2026-04-08T16:42:15.123Z'
  ),
(
    'b554af34-06d3-6786-8afd-3c770b2d3dfb',
    '113ff8d6-0919-1843-32b1-b4346d51b1b0',
    '云朵',
    'pet',
    '喵，那你来时记得带上会发声的小球。',
    '正常',
    '2026-04-08T21:42:15.123Z'
  ),
(
    '9175db4d-3543-b80a-9537-83b779aa3b81',
    '3495650d-7a4b-f490-7164-0d756474ae4c',
    '暖暖',
    'pet',
    '我已经学会怎么从雾雨深林跑去半岛午后了。',
    '正常',
    '2026-04-08T12:42:15.123Z'
  ),
(
    '8d32cead-3bed-8efb-8334-6eb5d062743f',
    '3495650d-7a4b-f490-7164-0d756474ae4c',
    '泡芙',
    'pet',
    '那我在入口等你，一起冲。',
    '正常',
    '2026-04-08T17:42:15.123Z'
  ),
(
    'f8278d84-121d-39a0-5139-c642e377906d',
    '73dd711b-e70d-44cb-bb47-a46c66a670e7',
    '唐梨',
    'owner',
    '我把最近的体检记录整理好了。',
    '正常',
    '2026-04-08T15:42:15.123Z'
  ),
(
    '5753707a-98ea-3839-442a-5233d8c3206f',
    '73dd711b-e70d-44cb-bb47-a46c66a670e7',
    '叶澄',
    'owner',
    '收到，我今晚会认真看。',
    '正常',
    '2026-04-08T16:42:15.123Z'
  ),
(
    'dab28b58-b19d-b473-f624-3aabc218ad16',
    '73dd711b-e70d-44cb-bb47-a46c66a670e7',
    '唐梨',
    'owner',
    '也想顺便聊聊主粮换粮计划。',
    '正常',
    '2026-04-09T00:42:15.123Z'
  ),
(
    '806cd4f2-0d4f-770c-4147-be51bfe528e9',
    '6f3dba41-80ec-abfc-24ec-4e1e6745b0a1',
    '栗子',
    'pet',
    '我今天跑得可快了。',
    '正常',
    '2026-04-08T10:42:15.123Z'
  ),
(
    '0ce28e6b-bff4-973d-874a-54d6dee24266',
    '6f3dba41-80ec-abfc-24ec-4e1e6745b0a1',
    '七喜',
    'pet',
    '那下次要记得站好让我拍照。',
    '正常',
    '2026-04-08T18:42:15.123Z'
  )
ON CONFLICT (id) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    sender_label = EXCLUDED.sender_label,
    sender_role = EXCLUDED.sender_role,
    content = EXCLUDED.content,
    moderation_status = EXCLUDED.moderation_status,
    created_at = EXCLUDED.created_at;

NOTIFY pgrst, 'reload schema';

COMMIT;
