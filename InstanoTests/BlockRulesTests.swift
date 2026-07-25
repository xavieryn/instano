import XCTest
@testable import Instano

final class BlockRulesTests: XCTestCase {
    private func url(_ s: String) -> URL { URL(string: s)! }

    func testBlocksReelsFeed() {
        XCTAssertFalse(BlockRules.allows(url("https://www.instagram.com/reels/")))
        XCTAssertFalse(BlockRules.allows(url("https://www.instagram.com/reels")))
        XCTAssertFalse(BlockRules.allows(url("https://instagram.com/reels/audio/123/")))
    }

    func testBlocksSingleReel() {
        XCTAssertFalse(BlockRules.allows(url("https://www.instagram.com/reel/Cabc123/")))
    }

    func testBlocksExplore() {
        XCTAssertFalse(BlockRules.allows(url("https://www.instagram.com/explore/")))
        XCTAssertFalse(BlockRules.allows(url("https://www.instagram.com/explore/tags/cats/")))
    }

    func testAllowsCoreSurfaces() {
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/")))
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/direct/inbox/")))
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/accounts/login/")))
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/someprofile/")))
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/p/Cxyz789/")))
    }

    func testAllowsPeopleSearch() {
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/explore/search/")))
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/explore/search/keyword/?q=joe")))
    }

    func testDoesNotBlockPrefixLookalikes() {
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/reelsmith/")))
        XCTAssertTrue(BlockRules.allows(url("https://www.instagram.com/explorer_joe/")))
    }

    func testIgnoresOtherHosts() {
        XCTAssertTrue(BlockRules.allows(url("https://static.cdninstagram.com/anything/reels/")))
        XCTAssertTrue(BlockRules.allows(url("https://example.com/reels/")))
    }
}
