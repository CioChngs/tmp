# Automation Test IDs

IDs follow `screen_action_type` where possible. Dynamic IDs use `{name}`, `{index}`, `{key}`, or `{label}` placeholders; replace the placeholder with the rendered value.

## Login

- `login_username_input`
- `login_password_input`
- `login_password_input_toggle`
- `login_forgot_password_button`
- `login_submit_button`
- `login_join_button`
- `login_face_id_button`
- `login_use_another_account_button`

## Navigation

- `navigation_home_tab`
- `navigation_account_tab`
- `navigation_card_tab`
- `navigation_more_tab`
- `navigation_scan_tab`

## Home

- `home_notifications_button`
- `home_appearance_button`
- `home_balance_visibility_button`
- `home_change_account_button`
- `home_copy_account_number_button`
- `home_statement_button`
- `home_promo_overdue_card`
- `home_promo_expiry_card`
- `home_banner_{index}`
- `home_quick_action_button_{label}`
- `home_activity_button_{index}`
- `home_section_{title}_action`
- `home_add_payee_button`
- `home_send_again_button_{name}`

## Account

- `account_view_button_{name}`
- `account_copy_iban_button_{name}`
- `account_view_statement_button_{name}`
- `account_detail_copy_iban_button`
- `account_detail_statements_button`
- `account_detail_reference_button`
- `account_sheet_close_button`
- `account_balance_visibility_button`
- `account_balance_visibility_switch`
- `account_add_money_button`
- `account_open_button`
- `account_tool_{title}_button`
- `account_tab_{key}`
- `deposit_daily_saving_edit_button`
- `deposit_save_today_button`
- `deposit_top_up_{title}_button`
- `deposit_open_button`
- `loan_offers_button`
- `open_account_select_product_button_{key}`
- `open_account_continue_button`

## Card

- `card_balance_visibility_button`
- `card_new_card_button`
- `card_freeze_switch`
- `card_choose_delivery_button`
- `card_online_payments_switch`
- `card_atm_withdrawals_switch`
- `card_payments_abroad_switch`
- `card_add_to_wallet_button`
- `card_details_visibility_button`

## QR And Scanner

- `qr_scan_tab`
- `qr_my_qr_tab`
- `scan_camera_permission_button`
- `scan_torch_button`
- `scan_gallery_button`
- `myqr_share_button`
- `myqr_copy_button`

## More And Notifications

- `more_edit_profile_button`
- `more_sign_out_button`
- `more_face_id_switch`
- `more_two_factor_switch`
- `more_notifications_switch`
- `notifications_back_button`
- `settings_open_button_{title}`

## Overlays And Shared Controls

- `security_warning_got_it_button`
- `biometric_decline_button`
- `biometric_accept_button`
- `theme_toggle`
- `settings_theme_toggle`
- `auth_{label}_button`

Controls intentionally without IDs are non-interactive scrims, decorative layers, or layout containers. Do not use visible text selectors when one of these IDs is available.
