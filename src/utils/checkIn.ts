import { Profile } from '../types';
import { todayKey } from './date';

// Whether the morning check-in is covering the app right now.
//
// Two places need the answer and they must never disagree: the shell, which
// decides whether to show the overlay, and Aujourd'hui underneath, which holds
// its entrance animations back until it is actually being looked at. Written
// out twice, one of them would eventually drift and the screen would either
// animate behind a cover or never animate at all.
export function isCheckInDue(profile: Profile, loading: boolean): boolean {
  return !loading && profile.onboardingCompleted && profile.lastCheckInDate !== todayKey();
}
