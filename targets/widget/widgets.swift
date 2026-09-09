import WidgetKit
import SwiftUI

private let appGroup = "group.com.nywacmoi.defi99"

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")))
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}

private let bg = Color(hex: "#000000")
private let accentBlue = Color(hex: "#58B7FF")
private let successGreen = Color(hex: "#3ECF5B")
private let goldYellow = Color(hex: "#FFC542")
private let trackGray = Color.white.opacity(0.12)
private let mutedWhite = Color.white.opacity(0.55)

private func statusColor(for progress: Double) -> Color {
    if progress >= 0.66 { return successGreen }
    if progress >= 0.34 { return goldYellow }
    return accentBlue
}

struct ProgressEntry: TimelineEntry {
    let date: Date
    let currentDay: Int
    let totalDays: Int
    let doneCount: Int
    let totalCount: Int
    let progress: Double
}

// The React Native app writes fresh values into the shared App Group's
// UserDefaults on every habit toggle and calls ExtensionStorage.reloadWidget()
// right after, so this provider never needs its own refresh timer — it just
// reads whatever is there and hands back a single entry that never expires
// on its own.
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressEntry {
        ProgressEntry(date: Date(), currentDay: 12, totalDays: 99, doneCount: 3, totalCount: 4, progress: 0.75)
    }

    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        completion(Timeline(entries: [readEntry()], policy: .never))
    }

    private func readEntry() -> ProgressEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let totalDays = defaults?.integer(forKey: "totalDays") ?? 0
        return ProgressEntry(
            date: Date(),
            currentDay: defaults?.integer(forKey: "currentDay") ?? 0,
            totalDays: totalDays == 0 ? 99 : totalDays,
            doneCount: defaults?.integer(forKey: "doneCount") ?? 0,
            totalCount: defaults?.integer(forKey: "totalCount") ?? 0,
            progress: defaults?.double(forKey: "progress") ?? 0
        )
    }
}

struct WidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(trackGray, lineWidth: 8)
                Circle()
                    .trim(from: 0, to: CGFloat(min(max(entry.progress, 0), 1)))
                    .stroke(statusColor(for: entry.progress), style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(Int(round(entry.progress * 100)))%")
                        .font(.system(size: 20, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                    if entry.totalCount > 0 {
                        Text("\(entry.doneCount)/\(entry.totalCount)")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(mutedWhite)
                    }
                }
            }
            .frame(width: 72, height: 72)

            Text(entry.currentDay > 0 ? "JOUR \(entry.currentDay) / \(entry.totalDays)" : "DÉFI 99")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(mutedWhite)
                .tracking(0.5)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(bg, for: .widget)
    }
}

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Défi 99")
        .description("Ta progression du jour, en un coup d'œil.")
        .supportedFamilies([.systemSmall])
    }
}

#Preview(as: .systemSmall) {
    widget()
} timeline: {
    ProgressEntry(date: .now, currentDay: 12, totalDays: 99, doneCount: 3, totalCount: 4, progress: 0.75)
    ProgressEntry(date: .now, currentDay: 12, totalDays: 99, doneCount: 4, totalCount: 4, progress: 1.0)
}
