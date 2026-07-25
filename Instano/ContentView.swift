import SwiftUI

struct ContentView: View {
    @State private var showComposer = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            // Status-bar band matches the page background instead of black
            Color(uiColor: .systemBackground).ignoresSafeArea()
            WebView()
                .ignoresSafeArea(edges: .bottom)
            // Guaranteed entry to the desktop composer (video/reel upload) —
            // independent of Instagram's DOM
            Button {
                showComposer = true
            } label: {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 44))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(.secondary)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .padding(.trailing, 16)
            .padding(.bottom, 72)
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
