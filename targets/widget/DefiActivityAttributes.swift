import ActivityKit

// Defines the shape of a Live Activity's data: `ContentState` is what
// changes over the activity's lifetime (redrawn on every update), anything
// outside it is fixed for the activity's whole lifetime. This file is
// duplicated (not shared) into the main app target — see
// modules/live-activity/ios/DefiActivityAttributes.swift — since ActivityKit
// activities are identified by matching struct shape, not by a single
// compiled type shared across targets.
struct DefiActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var currentDay: Int
        var totalDays: Int
        var doneCount: Int
        var totalCount: Int
        var progress: Double
        var streak: Int
    }
}
