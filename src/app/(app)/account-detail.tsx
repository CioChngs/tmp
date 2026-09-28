/**
 * "Account detail" — Figma `15338:61406`. Opened by tapping an account card on
 * the Accounts tab.
 *
 * A route rather than an overlay inside the tab, for the reason `(app)/_layout`
 * gives: the floating tab bar is the tab navigator's own `tabBar` and a sibling
 * of the screen, so nothing rendered inside a tab can cover it. One level up it
 * can. Being a route also gets the Android back button and a real dismissal for
 * free, and the transparent presentation keeps the tab visible behind the
 * scrim.
 *
 * The account is passed by index into `figmaAccountsList` rather than as a bag
 * of strings: the list is the only source there is, and a URL that can name a
 * balance is a URL that can lie about one.
 */
import { router, useLocalSearchParams } from 'expo-router';

import {
  AccountDetailSheet,
  type AccountDetailIdentity,
} from '@/components/rightbank/account/AccountDetailSheet';
import { AccountSheetShell } from '@/components/rightbank/account/AccountSheetShell';
import {
  accountDetailSheet as d,
  accountSheet as s,
  accountSheetCopy,
  figmaAccountsList,
} from '@/constants/rightbank-theme';
import { useAppMode } from '@/theme/app-mode';

const copy = accountSheetCopy.detail;

export default function AccountDetailRoute() {
  const { mode } = useAppMode();
  const params = useLocalSearchParams<{ index?: string; hidden?: string }>();

  const account = figmaAccountsList[Number(params.index)] as
    | (typeof figmaAccountsList)[number]
    | undefined;

  // Opened without a valid index — deep link, or a list that has since
  // changed. The frame's own literals are the honest thing to show: they are
  // what the design says, and they are not somebody's real balance.
  const identity: AccountDetailIdentity = account
    ? {
        name: account.name,
        type: account.type,
        iban: account.iban.prefix + account.iban.number,
        amount: account.amount,
        cents: account.cents,
        currency: account.currency,
        verified: account.verified,
      }
    : { ...copy.fallback, verified: true };

  return (
    <AccountSheetShell
      mode={mode}
      title={copy.title}
      height={d.height}
      onClose={() => router.back()}>
      <AccountDetailSheet t={s[mode]} account={identity} hidden={params.hidden === '1'} />
    </AccountSheetShell>
  );
}
