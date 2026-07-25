import WebKit

enum Injector {
    static func makeContentController() -> WKUserContentController {
        let controller = WKUserContentController()
        if let url = Bundle.main.url(forResource: "blocker", withExtension: "js"),
           let source = try? String(contentsOf: url, encoding: .utf8) {
            let script = WKUserScript(
                source: source,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            controller.addUserScript(script)
        }
        return controller
    }
}
