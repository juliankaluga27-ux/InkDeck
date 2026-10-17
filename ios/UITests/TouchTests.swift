import XCTest

final class TouchTests: XCTestCase {
    func testRealTapsOpenGameAndPlaceCross() throws {
        let app = XCUIApplication()
        app.launch()
        let game = app.webViews.buttons["KÓŁKO I KRZYŻYK"]
        XCTAssertTrue(game.waitForExistence(timeout: 20))
        game.tap()
        let empty = app.webViews.buttons["Pole 1: puste"]
        XCTAssertTrue(empty.waitForExistence(timeout: 8), "A real tap must open the game")
        empty.tap()
        XCTAssertTrue(app.webViews.buttons["Pole 1: X"].waitForExistence(timeout: 5), "A real tap must place X")
        app.webViews.buttons["‹ MENU"].tap()
        XCTAssertTrue(game.waitForExistence(timeout: 5))
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "iPhone compact color menu"
        shot.lifetime = .keepAlways
        add(shot)
    }
}
