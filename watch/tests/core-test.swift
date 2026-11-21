// Concatenated after Shared/GameCore.swift and executed by swift in CI.
func require(_ condition: @autoclosure () -> Bool, _ message: String) {
    if !condition() { fatalError(message) }
}
var blocks = WatchGame(.blocks)
blocks.bag = []
let bag = (0..<7).map { _ in blocks.take() }
require(Set(bag).count == 7,"Seven-piece bag")
let original = blocks.type
blocks.hold(); require(blocks.held == original,"Hold stores figure")
let active = blocks.type; blocks.hold(); require(blocks.type == active,"One hold per lock")
blocks.board = (0..<20).map { y in (0..<10).map { x in y >= 16 && x != 4 ? 2 : 0 } }
blocks.type = 0; blocks.cells = (0..<4).map { GridPoint(x:0,y:$0) }; blocks.blockX = 4; blocks.blockY = 16
blocks.place(); require(blocks.lines == 4,"Four-line clear"); require(blocks.score == 800,"Four-line points")
var wall = WatchGame(.blocks)
for _ in 0..<30 { wall.move(-1) }; wall.rotate(); require(wall.valid(wall.cells,wall.blockX,wall.blockY),"Wall kick stays valid")
wall.drop(); require(wall.board.flatMap { $0 }.contains(where: { $0 > 0 }),"Hard drop locks")
var pong = WatchGame(.pong); pong.wait = 0; pong.x = 180; pong.y = 470; pong.vx = 0; pong.vy = 200; pong.update(0.02)
require(pong.vy < 0,"Paddle collision"); pong.score = 6; pong.y = -16; pong.vy = -100; pong.update(0.01); require(pong.over && pong.won,"Pong ends at seven")
var breakout = WatchGame(.breakout); breakout.tap(); breakout.y = 540; breakout.update(0.01); require(breakout.lives == 2 && breakout.waiting,"Lost ball reserves two lives")
var invaders = WatchGame(.invaders); invaders.enemies = []; invaders.update(0.01); require(invaders.level == 2 && invaders.enemies.count == 28,"Next wave")
var snake = WatchGame(.snake); snake.snake = [GridPoint(x:11,y:8),GridPoint(x:10,y:8),GridPoint(x:9,y:8)]; snake.snakeStep(); require(snake.snake[0].x == 0,"Snake wraps")
var flight = WatchGame(.flight); flight.tap(); let y = flight.y; flight.update(0.02); require(flight.y < y,"Flight tap")
for mode in 0..<3 {
    var math = WatchGame(.multiplication,mathRange:12,mathMode:mode)
    require(Set(math.choices).count == 4 && math.choices.contains(math.a*math.b),"Four distinct answers")
    math.answer(math.a*math.b); math.answer(math.a*math.b); require(math.correct == 1,"Debounced math answers"); math.update(1)
    if mode == 0 { for _ in 1..<20 { math.answer(math.a*math.b); math.update(1) }; require(math.over && math.correct == 20,"Practice ends") }
    if mode == 1 { math.remaining = 0.01; math.update(0.02); require(math.over,"Timed session ends") }
    if mode == 2 { for _ in 0..<3 { math.answer(-1); math.update(2) }; require(math.over && math.lives == 0,"Challenge ends") }
}
print("Watch rules passed: bags, hold, lines, collisions, lives, waves, Snake, flight, math modes")
