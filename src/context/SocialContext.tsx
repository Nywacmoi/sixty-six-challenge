import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  subscribeToAuthUser,
  claimUsername,
  syncMyStats,
  getProfile,
  findUserByUsername,
  followUser,
  unfollowUser,
  listFollowingIds,
  createGroup,
  joinGroupByCode,
  joinGroupById,
  listPublicGroups,
  subscribeToMyGroups,
  PublicProfile,
  SocialGroup,
} from '../firebase/social';
import {
  signUpWithEmail,
  logInWithEmail,
  logOut as logOutAccount,
  resetPassword as resetPasswordAccount,
  subscribeToAccount,
  trialDaysLeft,
  Account,
} from '../firebase/account';
import { useApp } from './AppContext';
import { storage } from '../storage/storage';

type SocialContextValue = {
  ready: boolean;
  uid: string | null;
  username: string | null;
  setUsername: (name: string) => Promise<void>;
  following: PublicProfile[];
  groups: SocialGroup[];
  refreshing: boolean;
  refresh: () => Promise<void>;
  addFriend: (username: string) => Promise<void>;
  removeFriend: (uid: string) => Promise<void>;
  makeGroup: (name: string, emoji: string, isPublic: boolean) => Promise<SocialGroup>;
  joinGroup: (code: string) => Promise<SocialGroup | null>;
  publicGroups: SocialGroup[];
  discoveringGroups: boolean;
  discoverPublicGroups: () => Promise<void>;
  joinPublicGroup: (groupId: string) => Promise<SocialGroup | null>;
  hasUnread: (groupId: string) => boolean;
  hasAnyUnread: boolean;
  markGroupRead: (groupId: string) => void;
  setActiveChatGroupId: (groupId: string | null) => void;
  notificationsEnabled: boolean;
  notificationsSupported: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  hasAccount: boolean;
  accountEmail: string | null;
  account: Account | null;
  accountTrialDaysLeft: number;
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { currentDay, getStreak, getLongestStreak, getTotalCompletions, habits, levelInfo, profile } = useApp();
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [following, setFollowing] = useState<PublicProfile[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<SocialGroup[]>([]);
  const [discoveringGroups, setDiscoveringGroups] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [groupReads, setGroupReads] = useState<Record<string, number>>({});
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const activeChatGroupIdRef = useRef<string | null>(null);
  const knownLastMessageRef = useRef<Record<string, number> | null>(null);
  const notificationsSupported = Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;

  // Persistent — not one-shot — so logging in/out (switching identity)
  // propagates: a fresh uid re-triggers the effects below that load the
  // username, groups and account status for whoever is signed in now.
  useEffect(() => {
    const unsub = subscribeToAuthUser(async (user) => {
      if (!user) {
        setReady(true);
        return;
      }
      setUid(user.uid);
      setHasAccount(!user.isAnonymous);
      try {
        const existing = await getProfile(user.uid);
        setUsernameState(existing?.username ?? null);
      } catch {
        // offline or blocked — social features just stay unavailable
      } finally {
        setReady(true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    storage.getGroupReads().then(setGroupReads);
    storage.getGroupNotificationsEnabled().then(setNotificationsEnabledState);
  }, []);

  useEffect(() => {
    if (!uid || !hasAccount) {
      setAccount(null);
      return;
    }
    return subscribeToAccount(uid, setAccount);
  }, [uid, hasAccount]);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setRefreshing(true);
    try {
      const followingIds = await listFollowingIds(uid);
      const profiles = await Promise.all(followingIds.map((id) => getProfile(id)));
      setFollowing(profiles.filter((p): p is PublicProfile => p !== null));
    } finally {
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid && username) refresh();
  }, [uid, username]);

  // Realtime: keeps `groups` (including lastMessageAt/lastMessageText) live
  // so unread badges and the chat preview update without a manual refresh.
  useEffect(() => {
    if (!uid || !username) return;
    const unsub = subscribeToMyGroups(uid, (myGroups) => {
      setGroups(myGroups);

      const known = knownLastMessageRef.current;
      const nextKnown: Record<string, number> = {};
      myGroups.forEach((g) => {
        nextKnown[g.id] = g.lastMessageAt ?? 0;
      });

      if (known) {
        myGroups.forEach((g) => {
          const prevAt = known[g.id] ?? 0;
          const isNewMessage = (g.lastMessageAt ?? 0) > prevAt;
          const fromSomeoneElse = g.lastMessageSenderId && g.lastMessageSenderId !== uid;
          const viewingThisChat = activeChatGroupIdRef.current === g.id;
          if (isNewMessage && fromSomeoneElse && !viewingThisChat) {
            notifyNewMessage(g);
          }
        });
      }
      knownLastMessageRef.current = nextKnown;
    });
    return unsub;
  }, [uid, username]);

  function notifyNewMessage(group: SocialGroup) {
    if (!notificationsEnabled || !notificationsSupported) return;
    try {
      if (Notification.permission !== 'granted') return;
      const preview = group.lastMessageText ?? '';
      new Notification(`${group.emoji} ${group.name}`, {
        body: preview.length > 120 ? `${preview.slice(0, 117)}...` : preview,
        tag: `group-${group.id}`,
      });
    } catch {
      // Notification constructor can throw in some contexts (e.g. no SW on
      // some browsers) — a missed notification isn't worth surfacing an error.
    }
  }

  const hasUnread = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group || !group.lastMessageAt) return false;
      if (group.lastMessageSenderId === uid) return false;
      const readAt = groupReads[groupId] ?? 0;
      return group.lastMessageAt > readAt;
    },
    [groups, groupReads, uid]
  );

  const hasAnyUnread = groups.some((g) => hasUnread(g.id));

  const markGroupRead = useCallback(
    (groupId: string) => {
      const at = Date.now();
      setGroupReads((prev) => {
        const next = { ...prev, [groupId]: at };
        storage.setGroupReads(next);
        return next;
      });
    },
    []
  );

  const setActiveChatGroupId = useCallback((groupId: string | null) => {
    activeChatGroupIdRef.current = groupId;
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabledState(false);
      await storage.setGroupNotificationsEnabled(false);
      return false;
    }
    if (!notificationsSupported) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabledState(granted);
      await storage.setGroupNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  }, [notificationsSupported]);

  const activeHabits = habits.filter((h) => !h.archived);
  const bestCurrentStreak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);
  const bestLongestStreak = activeHabits.reduce((max, h) => Math.max(max, getLongestStreak(h.id)), 0);

  useEffect(() => {
    if (!uid || !username) return;
    syncMyStats(uid, {
      currentDay,
      currentStreak: bestCurrentStreak,
      longestStreak: bestLongestStreak,
      totalCompletions: getTotalCompletions(),
      level: levelInfo.level,
    }).catch(() => {});
  }, [uid, username, currentDay, bestCurrentStreak, bestLongestStreak, levelInfo.level]);

  const setUsername = useCallback(
    async (name: string) => {
      if (!uid) throw new Error('Pas encore connecté, réessaie dans un instant.');
      await claimUsername(uid, name, profile.avatarColor);
      setUsernameState(name.trim());
    },
    [uid, profile.avatarColor]
  );

  const addFriend = useCallback(
    async (name: string) => {
      if (!uid) return;
      const found = await findUserByUsername(name);
      if (!found) throw new Error("Personne n'a ce pseudo.");
      if (found.uid === uid) throw new Error("C'est toi !");
      await followUser(uid, found.uid);
      await refresh();
    },
    [uid, refresh]
  );

  const removeFriend = useCallback(
    async (targetUid: string) => {
      if (!uid) return;
      await unfollowUser(uid, targetUid);
      await refresh();
    },
    [uid, refresh]
  );

  const makeGroup = useCallback(
    async (name: string, emoji: string, isPublic: boolean) => {
      if (!uid) throw new Error('Pas encore connecté.');
      // No manual refresh needed — the realtime groups subscription above
      // picks this up as soon as Firestore confirms the write.
      return createGroup(uid, name, emoji, isPublic);
    },
    [uid]
  );

  const joinGroup = useCallback(
    async (code: string) => {
      if (!uid) throw new Error('Pas encore connecté.');
      return joinGroupByCode(uid, code);
    },
    [uid]
  );

  const discoverPublicGroups = useCallback(async () => {
    setDiscoveringGroups(true);
    try {
      const groups = await listPublicGroups();
      setPublicGroups(groups);
    } finally {
      setDiscoveringGroups(false);
    }
  }, []);

  const joinPublicGroup = useCallback(
    async (groupId: string) => {
      if (!uid) throw new Error('Pas encore connecté.');
      const joined = await joinGroupById(uid, groupId);
      setPublicGroups((prev) => prev.filter((g) => g.id !== groupId));
      return joined;
    },
    [uid]
  );

  const signUp = useCallback(async (email: string, password: string) => {
    const created = await signUpWithEmail(email, password);
    setHasAccount(true);
    setAccount(created);
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    // The uid/username/account state below all update on their own once
    // this resolves — the persistent auth listener above picks up the
    // (different) uid Firebase switches to and re-fetches everything.
    await logInWithEmail(email, password);
  }, []);

  const logOut = useCallback(async () => {
    await logOutAccount();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await resetPasswordAccount(email);
  }, []);

  const accountTrialDaysLeft = trialDaysLeft(account);

  const value: SocialContextValue = {
    ready,
    uid,
    username,
    setUsername,
    following,
    groups,
    refreshing,
    refresh,
    addFriend,
    removeFriend,
    makeGroup,
    joinGroup,
    publicGroups,
    discoveringGroups,
    discoverPublicGroups,
    joinPublicGroup,
    hasUnread,
    hasAnyUnread,
    markGroupRead,
    setActiveChatGroupId,
    notificationsEnabled,
    notificationsSupported,
    setNotificationsEnabled,
    hasAccount,
    accountEmail: account?.email ?? null,
    account,
    accountTrialDaysLeft,
    signUp,
    logIn,
    logOut,
    resetPassword,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}
