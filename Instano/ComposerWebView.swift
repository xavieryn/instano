import SwiftUI
import WebKit

// Desktop-UA Instagram for posting: the desktop composer supports video and
// reels, which the mobile site does not. Shares the default cookie store, so
// the session is already logged in.
struct ComposerSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ComposerWebView()
                .ignoresSafeArea(edges: .bottom)
                .navigationTitle("New post")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { dismiss() }
                    }
                }
        }
    }
}

struct ComposerWebView: UIViewRepresentable {
    static let desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.limitsNavigationsToAppBoundDomains = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.customUserAgent = Self.desktopUA
        #if DEBUG
        webView.isInspectable = true
        #endif
        webView.load(URLRequest(url: URL(string: "https://www.instagram.com/")!))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
