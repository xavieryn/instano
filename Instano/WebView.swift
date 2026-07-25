import OSLog
import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    // Following-variant feed: only followed accounts, no algorithmic suggestions
    static let home = URL(string: "https://www.instagram.com/?variant=following")!
    // Safari UA: instagram.com serves the default WKWebView UA a degraded page
    static let userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController = Injector.makeContentController()
        config.userContentController.add(context.coordinator, name: "instanoLog")
        config.userContentController.add(context.coordinator, name: "instanoCreate")
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        // Enables Service Workers for instagram.com (WKAppBoundDomains in
        // Info.plist) — IG web's upload pipeline needs them
        config.limitsNavigationsToAppBoundDomains = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.customUserAgent = Self.userAgent
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        #if DEBUG
        webView.isInspectable = true
        #endif

        context.coordinator.webView = webView
        webView.load(URLRequest(url: Self.home))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        weak var webView: WKWebView?
        private let log = Logger(subsystem: "com.xaviernishikawa.instano", category: "web")

        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            if message.name == "instanoCreate" {
                NotificationCenter.default.post(name: .instanoOpenComposer, object: nil)
                return
            }
            log.error("web: \(String(describing: message.body), privacy: .public)")
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }
            if !BlockRules.allows(url) {
                decisionHandler(.cancel)
                return
            }
            // Outbound links (not instagram/auth hosts) open in Safari
            if navigationAction.navigationType == .linkActivated,
               let host = url.host?.lowercased(),
               url.scheme?.hasPrefix("http") == true,
               !host.hasSuffix("instagram.com"),
               !host.hasSuffix("cdninstagram.com"),
               !host.hasSuffix("facebook.com") {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

    }
}
