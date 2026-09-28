/**
 * "Open an account" — Figma `16058:37255`. Opened by the dashed "＋ Open a new
 * account" button at the foot of the Accounts tab.
 *
 * Same presentation as `account-detail` and for the same reasons; see the
 * comment there.
 */
import { router } from 'expo-router';

import { AccountSheetShell } from '@/components/rightbank/account/AccountSheetShell';
import { OpenAccountSheet } from '@/components/rightbank/account/OpenAccountSheet';
import {
  accountSheet as s,
  accountSheetCopy,
  openAccountSheet as o,
} from '@/constants/rightbank-theme';
import { useAppMode } from '@/theme/app-mode';

export default function OpenAccountRoute() {
  const { mode } = useAppMode();

  return (
    <AccountSheetShell
      mode={mode}
      title={accountSheetCopy.open.title}
      height={o.height}
      onClose={() => router.back()}>
      {/* Neither the product rows nor Continue have anywhere to go yet: the
          frame draws no next screen and there is no account-opening flow in
          the app. They are left unwired rather than pointed somewhere
          plausible. */}
      <OpenAccountSheet t={s[mode]} />
    </AccountSheetShell>
  );
}
