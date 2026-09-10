import ActivityKit
import ExpoModulesCore

// No stored property of an availability-gated type on purpose (e.g. a
// `Activity<DefiActivityAttributes>?` ivar) — that would force this whole
// class under @available(iOS 16.2, *), which Module subclasses can't be.
// Every ActivityKit call instead lives inside its own guarded function body,
// looking the current activity back up via Activity<...>.activities.first
// rather than caching it.
public final class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivityModule")

    AsyncFunction("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("start") { (currentDay: Int, totalDays: Int, doneCount: Int, totalCount: Int, progress: Double, streak: Int, promise: Promise) in
      guard #available(iOS 16.2, *) else {
        promise.resolve(false)
        return
      }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        promise.resolve(false)
        return
      }
      Task {
        // At most one Défi 99 activity at a time — clear out anything left
        // over (e.g. the app never got a chance to end yesterday's).
        for activity in Activity<DefiActivityAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
        let state = DefiActivityAttributes.ContentState(
          currentDay: currentDay, totalDays: totalDays, doneCount: doneCount,
          totalCount: totalCount, progress: progress, streak: streak
        )
        do {
          _ = try Activity<DefiActivityAttributes>.request(
            attributes: DefiActivityAttributes(),
            content: .init(state: state, staleDate: nil)
          )
          promise.resolve(true)
        } catch {
          promise.resolve(false)
        }
      }
    }

    AsyncFunction("update") { (currentDay: Int, totalDays: Int, doneCount: Int, totalCount: Int, progress: Double, streak: Int, promise: Promise) in
      guard #available(iOS 16.2, *) else {
        promise.resolve(false)
        return
      }
      Task {
        guard let activity = Activity<DefiActivityAttributes>.activities.first else {
          promise.resolve(false)
          return
        }
        let state = DefiActivityAttributes.ContentState(
          currentDay: currentDay, totalDays: totalDays, doneCount: doneCount,
          totalCount: totalCount, progress: progress, streak: streak
        )
        await activity.update(.init(state: state, staleDate: nil))
        promise.resolve(true)
      }
    }

    AsyncFunction("end") { (promise: Promise) in
      guard #available(iOS 16.2, *) else {
        promise.resolve(false)
        return
      }
      Task {
        for activity in Activity<DefiActivityAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
        promise.resolve(true)
      }
    }
  }
}
