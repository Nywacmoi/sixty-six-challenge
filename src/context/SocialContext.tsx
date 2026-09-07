import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  listMyGroups,
  PublicProfile,
  SocialGroup,
} from '../firebase/social';
import { useApp } from './AppContext';

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
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setRefreshing(true);
    try {
      const [followingIds, myGroups] = await Promise.all([listFollowingIds(uid), listMyGroups(uid)]);
      const profiles = await Promise.all(followingIds.map((id) => getProfile(id)));
      setFollowing(profiles.filter((p): p is PublicProfile => p !== null));
      setGroups(myGroups);
    } finally {
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid && username) refresh();
  }, [uid, username]);

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
      const group = await createGroup(uid, name, emoji);
      await refresh();
      return group;
    },
    [uid, refresh]
  );

  const joinGroup = useCallback(
    async (code: string) => {
      if (!uid) throw new Error('Pas encore connecté.');
      const group = await joinGroupByCode(uid, code);
      await refresh();
      return group;
    },
    [uid, refresh]
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
  };

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}
