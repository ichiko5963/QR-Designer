-- ============================================
-- Update Pricing Plans based on money.md
-- ============================================

-- 既存のプランを削除
DELETE FROM subscription_plans;

-- 新しいプランを挿入
INSERT INTO subscription_plans (name, display_name, price_monthly, features, sort_order) VALUES
-- Free (ログインあり): 無制限生成、履歴保存、WiFi QR、短縮URL
('free', 'Free', 0, '{
  "qr_limit_per_month": -1,
  "max_resolution": 1024,
  "svg_pdf_export": false,
  "template_limit": 0,
  "csv_batch_limit": 0,
  "dynamic_qr_limit": 0,
  "scan_analytics": false,
  "team_seats": 1,
  "custom_domain": 0,
  "logo_storage_mb": 0,
  "watermark_removable": true,
  "priority_support": false,
  "api_access": false,
  "wifi_qr": true,
  "short_url": true,
  "history_save": true
}', 0),

-- Personal: ¥499/月、2048px、スマートダッシュボード、テンプレート保存10件
('personal', 'Personal', 499, '{
  "qr_limit_per_month": -1,
  "max_resolution": 2048,
  "svg_pdf_export": false,
  "template_limit": 10,
  "csv_batch_limit": 0,
  "dynamic_qr_limit": 0,
  "scan_analytics": false,
  "team_seats": 1,
  "custom_domain": 0,
  "logo_storage_mb": 10,
  "watermark_removable": true,
  "priority_support": false,
  "api_access": false,
  "wifi_qr": true,
  "short_url": true,
  "short_url_custom_slug": true,
  "history_save": true,
  "smart_dashboard": true,
  "link_checker": true,
  "email_qr": true,
  "phone_qr": true,
  "sms_qr": true,
  "text_qr": true,
  "vcard_qr": true,
  "location_qr": true
}', 1),

-- Pro: ¥980/月、4096px、SVG/PDF、動的QR無制限、高度な分析機能
('pro', 'Pro', 980, '{
  "qr_limit_per_month": -1,
  "max_resolution": 4096,
  "svg_pdf_export": true,
  "template_limit": -1,
  "csv_batch_limit": 500,
  "dynamic_qr_limit": -1,
  "scan_analytics": true,
  "team_seats": 1,
  "custom_domain": 0,
  "logo_storage_mb": 50,
  "watermark_removable": true,
  "priority_support": false,
  "api_access": false,
  "wifi_qr": true,
  "short_url": true,
  "short_url_custom_slug": true,
  "history_save": true,
  "smart_dashboard": true,
  "smart_dashboard_advanced": true,
  "link_checker": true,
  "email_qr": true,
  "phone_qr": true,
  "sms_qr": true,
  "text_qr": true,
  "vcard_qr": true,
  "location_qr": true,
  "event_qr": true,
  "multi_url": true,
  "app_store_qr": true,
  "social_profile_qr": true,
  "qr_expiry": true,
  "qr_scan_limit": true,
  "password_protected_qr": true,
  "menu_qr": true,
  "review_qr": true,
  "redirect_ab_test": true,
  "redirect_geo": true,
  "redirect_time": true,
  "redirect_device": true,
  "conversion_tracking": true,
  "cohort_analysis": true,
  "custom_dashboard": true,
  "realtime_analytics": true
}', 2);
