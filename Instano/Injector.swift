import WebKit

enum Injector {
    // Diagnostic bisection: true = ship with NO injected script/CSS to test
    // whether blocker.js itself breaks Instagram's composer.
    static let vanillaDiagnosticMode = false

    static func makeContentController() -> WKUserContentController {
        let controller = WKUserContentController()
        if vanillaDiagnosticMode { return controller }
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
