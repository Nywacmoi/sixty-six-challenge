import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  waitForAuthUser,
  claimUsername,
  syncMyStats,
  getProfile,
  findUserByUsername,
  followUser,
  unfollowUser,
  listFollowingIds,
  createGroup,
  joinGroupByCode,
  subscribeToMyGroups,
  PublicProfile,
  SocialGroup,
} from '../firebase/social';
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
  makeGroup: (name: string, emoji: string) => Promise<SocialGroup>;
  joinGroup: (code: string) => Promise<SocialGroup | null>;
  hasUnread: (groupId: string) => boolean;
  hasAnyUnread: boolean;
  markGroupRead: (groupId: string) => void;
  setActiveChatGroupId: (groupId: string | null) => void;
  notificationsEnabled: boolean;
  notificationsSupported: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
};

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { currentDay, getStreak, getLongestStreak, getTotalCompletions, habits, levelInfo, profile } = useApp();
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [following, setFollowing] = useState<PublicProfile[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [groupReads, setGroupReads] = useState<Record<string, number>>({});
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const activeChatGroupIdRef = useRef<string | null>(null);
  const knownLastMessageRef = useRef<Record<string, number> | null>(null);
  const notificationsSupported = Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    (async () => {
      try {
        const user = await waitForAuthUser();
        setUid(user.uid);
        const existing = await getProfile(user.uid);
        if (existing) setUsernameState(existing.username);
      } catch {
        // offline or blocked — social features just stay unavailable
      } finally {
        setReady(true);
      }
    })();
    storage.getGroupReads().then(setGroupReads);
    storage.getGroupNotificationsEnabled().then(setNotificationsEnabledState);
  }, []);

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
    async (name: string, emoji: string) => {
      if (!uid) throw new Error('Pas encore connecté.');
      // No manual refresh needed — the realtime groups subscription above
      // picks this up as soon as Firestore confirms the write.
      return createGroup(uid, name, emoji);
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
    hasUnread,
    hasAnyUnread,
    markGroupRead,
    setActiveChatGroupId,
    notificationsEnabled,
    notificationsSupported,
    setNotificationsEnabled,
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}
