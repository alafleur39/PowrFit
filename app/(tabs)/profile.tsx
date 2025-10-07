import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USE_MOCK_DATA } from "../../config";
import {
  fetchMockUserProgress,
  MOCK_PROGRESS_DEFAULT,
  type MockUserProgress,
} from "../../lib/mockData";
import { useAuth } from "../../src/auth/AuthProvider";

type StatCard = {
  label: string;
  value: string;
  delta?: string;
};

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const PROGRESS_CACHE_KEY = "powrfit::mock_progress_v1";

// --- Static quick actions: wire these to actual routes once backend endpoints exist. ---
const quickActions: QuickAction[] = [
  { icon: "play-circle", label: "Start Workout" },
  { icon: "stats-chart", label: "Progress" },
  { icon: "calendar", label: "Schedule" },
  { icon: "nutrition", label: "Nutrition" },
];

const formatDelta = (current: number, previous?: number, suffix = ""): string | undefined => {
  if (previous === undefined) return undefined;
  const diff = Math.round(current - previous);
  if (diff === 0) return undefined;
  const symbol = diff > 0 ? "+" : "-";
  return `${symbol}${Math.abs(diff)}${suffix}`;
};

const percentOfGoal = (value: number, goal: number) => {
  if (goal <= 0) return 0;
  return Math.min(1, value / goal);
};

export default function Profile() {
  const { user, loading: isAuthLoading, signOut } = useAuth();
  const [progress, setProgress] = useState<MockUserProgress | null>(null);
  const [previousProgress, setPreviousProgress] = useState<MockUserProgress | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(USE_MOCK_DATA);

  // --- Hydrate dashboard analytics via mock backend until the real API is connected. ---
  useEffect(() => {
    let isMounted = true;

    const hydrateProgress = async () => {
      if (!USE_MOCK_DATA) {
        setIsProgressLoading(false);
        return;
      }

      if (!user) {
        setProgress(null);
        setPreviousProgress(null);
        setIsProgressLoading(false);
        return;
      }

      setIsProgressLoading(true);

      try {
        const cachedJson = await AsyncStorage.getItem(PROGRESS_CACHE_KEY);
        const cachedProgress: MockUserProgress | null = cachedJson
          ? JSON.parse(cachedJson)
          : null;

        if (isMounted && cachedProgress) {
          setPreviousProgress(cachedProgress);
        }

        const nextProgress = await fetchMockUserProgress(cachedProgress ?? undefined);

        if (!isMounted) return;

        setProgress(nextProgress);
        setPreviousProgress(cachedProgress ?? nextProgress);

        await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(nextProgress));
      } catch (error) {
        if (__DEV__) {
          console.warn("Mock analytics load failed", error);
        }
      } finally {
        if (isMounted) {
          setIsProgressLoading(false);
        }
      }
    };

    hydrateProgress().catch((error) => {
      if (__DEV__) {
        console.warn("Mock analytics hydrate failed", error);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // --- Show spinner while the authentication state resolves. ---
  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.centerStateText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Prompt users who are not authenticated yet. ---
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Ionicons name="person-circle-outline" size={56} color="#94A3B8" />
          <Text style={styles.centerStateTitle}>Sign In to View Profile</Text>
          <Text style={styles.centerStateText}>
            Log in to PowrFit to unlock your dashboard, training stats, and personalized goals.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Resolve the latest available progress (from live fetch, cache, or sane defaults). ---
  const resolvedProgress = progress ?? previousProgress ?? MOCK_PROGRESS_DEFAULT;
  const previousStats = previousProgress?.stats;
  const streakDelta = formatDelta(
    resolvedProgress.stats.workoutStreak,
    previousStats?.workoutStreak,
    " days"
  );
  const caloriesDelta = formatDelta(
    resolvedProgress.stats.caloriesBurned,
    previousStats?.caloriesBurned,
    ""
  );
  const minutesDelta = formatDelta(
    resolvedProgress.stats.weeklyMinutes,
    previousStats?.weeklyMinutes,
    " min"
  );

  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: "Workout Streak",
        value: `${resolvedProgress.stats.workoutStreak} days`,
        delta: streakDelta,
      },
      {
        label: "Calories Burned",
        value: resolvedProgress.stats.caloriesBurned.toLocaleString(),
        delta: caloriesDelta ? `${caloriesDelta} kcal` : undefined,
      },
      {
        label: "Weekly Minutes",
        value: `${resolvedProgress.stats.weeklyMinutes} min`,
        delta: minutesDelta,
      },
    ],
    [caloriesDelta, minutesDelta, resolvedProgress.stats, streakDelta]
  );

  const weeklyGoalCompletion = percentOfGoal(
    resolvedProgress.stats.activeMinutes,
    resolvedProgress.stats.weeklyGoal
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      if (__DEV__) {
        console.warn("Sign out failed", error);
      }
    }
  };

  const avatarSource = user.photoURL
    ? { uri: user.photoURL }
    : { uri: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80" };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- User hero card (ready to swap with live profile payload). --- */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.headerDetails}>
              <Text style={styles.userName}>{user.displayName ?? "PowrFit Athlete"}</Text>
              <Text style={styles.userSubtitle}>{user.email ?? "Update your email"}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Ionicons name="flame" size={14} color="#F97316" />
                  <Text style={styles.badgeText}>Level 7 · Challenger</Text>
                </View>
                <View style={[styles.badge, styles.badgeSecondary]}>
                  <Ionicons name="trophy" size={14} color="#1E293B" />
                  <Text style={styles.badgeSecondaryText}>Top 10% weekly</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={handleSignOut}>
              <Ionicons name="settings-outline" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View style={styles.motivationBlock}>
            <View style={styles.motivationText}>
              <Text style={styles.motivationTitle}>You’re crushing it</Text>
              <Text style={styles.motivationSubtitle}>
                {`Streak ${resolvedProgress.stats.workoutStreak} days • ${resolvedProgress.stats.activeMinutes}/${resolvedProgress.stats.weeklyGoal} active minutes this week.`}
              </Text>
            </View>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Log activity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Snapshot cards fed by mock analytics (swap fetch with real API later). --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today’s snapshot</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>
          {isProgressLoading && !progress ? (
            <View style={styles.sectionLoader}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.sectionLoaderText}>Loading analytics...</Text>
            </View>
          ) : (
            <View style={styles.statsRow}>
              {statCards.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  {stat.delta && (
                    <View style={styles.deltaPill}>
                      <Ionicons
                        name={stat.delta.startsWith("-") ? "arrow-down" : "arrow-up"}
                        size={12}
                        color={stat.delta.startsWith("-") ? "#EF4444" : "#22C55E"}
                      />
                      <Text
                        style={[
                          styles.deltaText,
                          stat.delta.startsWith("-") ? styles.deltaNegative : undefined,
                        ]}
                      >
                        {stat.delta}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* --- Weekly goal visualization (replace with chart library when backend ready). --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly goal</Text>
            <Text style={styles.sectionCaption}>
              {`${resolvedProgress.stats.activeMinutes}/${resolvedProgress.stats.weeklyGoal} min`}
            </Text>
          </View>
          <View style={styles.progressTrackLarge}>
            <View style={[styles.progressFillLarge, { width: `${weeklyGoalCompletion * 100}%` }]} />
          </View>
          <Text style={styles.sectionHint}>
            You’re {Math.round(weeklyGoalCompletion * 100)}% toward this week’s activity target.
          </Text>
        </View>

        {/* --- Quick navigation shortcuts (static until routed to live screens). --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
          </View>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.label} style={styles.quickActionCard}>
                <Ionicons name={action.icon} size={24} color="#1D4ED8" />
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Upcoming sessions sourced from the mock payload. --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming sessions</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>See calendar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sessionList}>
            {resolvedProgress.upcomingSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionMeta}>{session.coach}</Text>
                  <Text style={styles.sessionMeta}>{session.time}</Text>
                </View>
                <View style={styles.sessionPill}>
                  <Ionicons name="pulse" size={14} color="#1D4ED8" />
                  <Text style={styles.sessionPillText}>{session.focus}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* --- Goal tracking with animated percentages (replace with backend-provided metrics later). --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active goals</Text>
          </View>
          <View style={styles.goalsList}>
            {resolvedProgress.goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalProgress}>{Math.round(goal.progress)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(goal.progress, 100)}%` }]} />
                </View>
                <Text style={styles.goalTarget}>{goal.target}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  headerDetails: {
    flex: 1,
    marginLeft: 16,
    gap: 6,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  userSubtitle: {
    fontSize: 14,
    color: "#475569",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#FFF7ED",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EA580C",
  },
  badgeSecondary: {
    backgroundColor: "#E0F2FE",
  },
  badgeSecondaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  motivationBlock: {
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  motivationText: {
    flex: 1,
    gap: 8,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  motivationSubtitle: {
    fontSize: 14,
    color: "#CBD5F5",
  },
  primaryButton: {
    backgroundColor: "#38BDF8",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionCaption: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  sectionAction: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  deltaPill: {
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },
  deltaNegative: {
    color: "#991B1B",
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: "47%",
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    gap: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  sessionList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sessionMeta: {
    fontSize: 14,
    color: "#475569",
  },
  sessionPill: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#38BDF8",
  },
  progressTrackLarge: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFillLarge: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  goalTarget: {
    fontSize: 13,
    color: "#475569",
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  centerStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  centerStateText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  sectionLoader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionLoaderText: {
    fontSize: 14,
    color: "#475569",
  },
  sectionHint: {
    fontSize: 13,
    color: "#64748B",
  },
});
