import ActivityKit
import WidgetKit
import SwiftUI

private func liveStatusColor(for progress: Double) -> Color {
    if progress >= 0.66 { return Color(hex: "#3ECF5B") }
    if progress >= 0.34 { return Color(hex: "#FFC542") }
    return Color(hex: "#58B7FF")
}

private func liveRing(progress: Double, size: CGFloat, lineWidth: CGFloat, color: Color) -> some View {
    ZStack {
        Circle().stroke(Color.white.opacity(0.15), lineWidth: lineWidth)
        Circle()
            .trim(from: 0, to: CGFloat(min(max(progress, 0), 1)))
            .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
            .rotationEffect(.degrees(-90))
    }
    .frame(width: size, height: size)
}

struct DefiLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DefiActivityAttributes.self) { context in
            // Lock screen / banner presentation
            let color = liveStatusColor(for: context.state.progress)
            HStack(spacing: 14) {
                ZStack {
                    liveRing(progress: context.state.progress, size: 52, lineWidth: 5, color: color)
                    Text("\(Int(round(context.state.progress * 100)))%")
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("DÉFI 99 · JOUR \(context.state.currentDay)/\(context.state.totalDays)")
                        .font(.system(size: 10.5, weight: .bold))
                        .foregroundColor(.white.opacity(0.5))
                    Text("\(context.state.doneCount)/\(context.state.totalCount) habitudes cochées")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                    if context.state.streak > 0 {
                        HStack(spacing: 5) {
                            Circle().fill(Color(hex: "#FFC542")).frame(width: 6, height: 6)
                            Text("Série de \(context.state.streak) jour\(context.state.streak > 1 ? "s" : "")")
                                .font(.system(size: 12.5))
                                .foregroundColor(.white.opacity(0.65))
                        }
                    }
                }
                Spacer()
            }
            .padding(16)
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            let color = liveStatusColor(for: context.state.progress)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    liveRing(progress: context.state.progress, size: 44, lineWidth: 4, color: color)
                        .overlay(
                            Text("\(Int(round(context.state.progress * 100)))%")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundColor(.white)
                        )
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 3) {
                        Text("JOUR \(context.state.currentDay)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(hex: "#58B7FF"))
                        Text("\(context.state.doneCount)/\(context.state.totalCount)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.streak > 0 {
                        Text("Série de \(context.state.streak) jour\(context.state.streak > 1 ? "s" : "")")
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
            } compactLeading: {
                liveRing(progress: context.state.progress, size: 20, lineWidth: 2.5, color: color)
            } compactTrailing: {
                Text("\(context.state.doneCount)/\(context.state.totalCount)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
            } minimal: {
                liveRing(progress: context.state.progress, size: 18, lineWidth: 2.5, color: color)
            }
        }
    }
}
