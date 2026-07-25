import Foundation

enum BlockRules {
    private static let blockedPrefixes = ["/reels", "/reel", "/explore"]
    private static let hosts: Set<String> = ["instagram.com", "www.instagram.com"]

    static func allows(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased(), hosts.contains(host) else { return true }
        let path = url.path
        // People search lives under /explore/search — the one explore surface we keep
        if path == "/explore/search" || path.hasPrefix("/explore/search/") { return true }
        return !blockedPrefixes.contains { path == $0 || path.hasPrefix($0 + "/") }
    }
}
