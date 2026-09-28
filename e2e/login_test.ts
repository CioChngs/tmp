/// <reference types="jest" />

import { by, device, element, expect } from 'detox';

describe('Login module', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('keeps the user on login when both credentials are empty', async () => {
    await element(by.id('login_submit_button')).tap();

    await expect(element(by.id('login_username_input'))).toBeVisible();
    await expect(element(by.id('login_password_input'))).toBeVisible();
    await expect(element(by.id('login_submit_button'))).toBeVisible();
  });

  it('rejects an empty password without leaving login', async () => {
    await element(by.id('login_username_input')).typeText('valid.user');
    await element(by.id('login_submit_button')).tap();

    await expect(element(by.id('login_password_input'))).toBeVisible();
    await expect(element(by.id('login_submit_button'))).toBeVisible();
  });

  it('rejects an empty username without leaving login', async () => {
    await element(by.id('login_password_input')).typeText('valid-password');
    await element(by.id('login_submit_button')).tap();

    await expect(element(by.id('login_username_input'))).toBeVisible();
    await expect(element(by.id('login_submit_button'))).toBeVisible();
  });

  it('supports revealing and hiding the password', async () => {
    await element(by.id('login_password_input')).typeText('valid-password');
    await element(by.id('login_password_input_toggle')).tap();
    await expect(element(by.id('login_password_input_toggle'))).toBeVisible();
    await element(by.id('login_password_input_toggle')).tap();
    await expect(element(by.id('login_password_input_toggle'))).toBeVisible();
  });

  it('signs in with valid credentials and leaves the login module', async () => {
    await element(by.id('login_username_input')).typeText('valid.user');
    await element(by.id('login_password_input')).typeText('valid-password');
    await element(by.id('login_submit_button')).tap();

    await expect(element(by.id('login_submit_button'))).not.toBeVisible();
    await expect(element(by.id('login_username_input'))).not.toBeVisible();
  });
});
