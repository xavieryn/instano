import Foundation

enum BlockRules {
    // /reels = the endless swipe feed (blocked). /reel/<id> = a single video
    // post — every IG video is a "reel" since 2022, so blocking it breaks
    // friends' videos, own profile videos, and video upload. Allowed.
    private static let blockedPrefixes = ["/reels", "/explore"]
    private static let allowedPrefixes = ["/explore/search", "/reels/create"]
    private static let hosts: Set<String> = ["instagram.com", "www.instagram.com"]

    static func allows(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased(), hosts.contains(host) else { return true }
        let path = url.path
        if allowedPrefixes.contains(where: { path == $0 || path.hasPrefix($0 + "/") }) { return true }
        return !blockedPrefixes.contains { path == $0 || path.hasPrefix($0 + "/") }
    }
}
