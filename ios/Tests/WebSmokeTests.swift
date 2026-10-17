import XCTest
import WebKit
@testable import InkDeck

@MainActor
final class WebSmokeTests: XCTestCase {
    func testBundledGamesInWebKit() async throws {
        let controller = InkDeckController()
        controller.loadViewIfNeeded()
        let web = try XCTUnwrap(controller.view.subviews.compactMap { $0 as? WKWebView }.first)
        web.configuration.userContentController.addUserScript(WKUserScript(source:
            "window.smokeErrors=[];window.addEventListener('error',function(e){smokeErrors.push(e.message)});",
            injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let root = try XCTUnwrap(Bundle(for: AppDelegate.self).url(forResource: "Web", withExtension: nil))
        let host = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        host.rootViewController = controller
        host.makeKeyAndVisible()
        web.loadFileURL(root.appendingPathComponent("index.html"), allowingReadAccessTo: root)
        var ready = false
        for _ in 0..<100 {
            if let value = try? await web.evaluateJavaScript("document.readyState==='complete' && !!window.InkDeck && typeof InkDeck.show==='function' && !!document.getElementById('snakeUp').onpointerdown") as? Bool, value {
                ready = true; break
            }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        XCTAssertTrue(ready, "Bundled scripts must finish startup")
        guard ready else { return }
        for size in [CGSize(width: 390, height: 760), CGSize(width: 768, height: 980)] {
            web.translatesAutoresizingMaskIntoConstraints = true
            NSLayoutConstraint.deactivate(controller.view.constraints)
            web.frame = CGRect(origin: .zero, size: size)
            for game in ["ttt", "chess", "checkers", "snake", "sudoku", "nonogram", "g2048", "wordle", "mahjongconnect", "ludo", "papersoccer", "memory", "lights", "life", "writer", "draw", "todo", "calc", "kindleai"] {
                _ = try await web.evaluateJavaScript("InkDeck.show('\(game)')")
                try await Task.sleep(nanoseconds: 150_000_000)
                let errors = try await web.evaluateJavaScript("JSON.stringify(window.smokeErrors)") as? String
                XCTAssertEqual(errors, "[]", "Startup/render errors in \(game) at \(size)")
                let active = try await web.evaluateJavaScript("document.querySelector('.page.active').id") as? String
                XCTAssertEqual(active, game)
                let overflow = try await web.evaluateJavaScript("(function(){var p=document.querySelector('.page.active');return p.scrollWidth > p.clientWidth+2})()") as? Bool
                XCTAssertEqual(overflow, false, "Horizontal overflow in \(game) at \(size)")
            }
        }
        host.isHidden = true
    }
}
