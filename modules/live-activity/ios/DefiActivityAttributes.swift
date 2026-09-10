import ActivityKit

// Kept identical to targets/widget/DefiActivityAttributes.swift on purpose —
// see the note there. This copy is what the app-side module uses to call
// Activity<DefiActivityAttributes>.request(...); the widget extension's copy
// is what draws the lock screen / Dynamic Island UI from the same data.
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
