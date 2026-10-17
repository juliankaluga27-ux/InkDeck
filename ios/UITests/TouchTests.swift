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
        app.webViews.buttons["WORDLE"].tap()
        let enter = app.webViews.buttons["OK"]
        XCTAssertTrue(enter.waitForExistence(timeout: 5))
        XCTAssertLessThanOrEqual(enter.frame.maxY,app.webViews.firstMatch.frame.maxY+1,"Wordle submit key must be visible without scrolling")
        app.webViews.buttons["Q"].tap()
        app.webViews.buttons["‹ MENU"].tap()
        app.webViews.buttons["NARZĘDZIA"].tap()
        app.webViews.buttons["Ink AI"].tap()
        app.webViews.buttons["USTAWIENIA API"].tap()
        XCTAssertTrue(app.webViews.secureTextFields.firstMatch.waitForExistence(timeout:5))
        app.webViews.buttons["GOTOWE"].tap()
        app.webViews.buttons["+ CZAT"].tap()
        app.webViews.buttons["‹ MENU"].tap()
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "iPhone compact color menu"
        shot.lifetime = .keepAlways
        add(shot)
    }
}
