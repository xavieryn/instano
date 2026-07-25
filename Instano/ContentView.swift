import SwiftUI

struct ContentView: View {
    @State private var showComposer = false

    var body: some View {
        ZStack {
            // Status-bar band matches the page background instead of black
            Color(uiColor: .systemBackground).ignoresSafeArea()
            WebView()
                .ignoresSafeArea(edges: .bottom)
        }
        .onReceive(NotificationCenter.default.publisher(for: .instanoOpenComposer)) { _ in
            showComposer = true
        }
        .sheet(isPresented: $showComposer) {
            ComposerSheet()
        }
    }
}

extension Notification.Name {
    static let instanoOpenComposer = Notification.Name("instano.openComposer")
}
