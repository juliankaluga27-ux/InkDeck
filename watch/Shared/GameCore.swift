import Foundation

enum GameKind: String, CaseIterable, Identifiable {
    case pong, breakout, blocks, invaders, flight, multiplication, snake
    var id: String { rawValue }
    var title: String {
        switch self {
        case .pong: return "Pong"
        case .breakout: return "Niszczenie bloków"
        case .blocks: return "Ink Blocks"
        case .invaders: return "Space Invaders"
        case .flight: return "Ink Flight"
        case .multiplication: return "MultiplicatingKid"
        case .snake: return "Snake"
        }
    }
    var icon: String {
        switch self {
        case .pong: return "sportscourt"
        case .breakout: return "square.grid.3x3.fill"
        case .blocks: return "square.stack.3d.up.fill"
        case .invaders: return "sparkles"
        case .flight: return "bird.fill"
        case .multiplication: return "multiply"
        case .snake: return "point.topleft.down.curvedto.point.bottomright.up"
        }
    }
    var instructions: String {
        switch self {
        case .pong: return "Koronka lub palec: paletka. Wygraj do 7."
        case .breakout: return "Koronka lub palec: paletka. Dotknij, aby wypuścić piłkę. 10 plansz."
        case .blocks: return "Koronka: ruch. Dotknij: obrót. ↓: zrzut. ⇄: schowek."
        case .invaders: return "Koronka lub palec: statek. Strzelanie automatyczne."
        case .flight: return "Dotknij planszy lub ↑, aby podfrunąć."
        case .multiplication: return "20 działań. Wybierz wynik. Błędne działania wracają."
        case .snake: return "Koronka: skręt. Przyciski: lewo/prawo. Nie uderz w siebie."
        }
    }
}

struct GridPoint: Equatable { var x: Int; var y: Int }
struct GameRect { var x: Double; var y: Double; var w: Double; var h: Double; var hp: Int = 1 }
struct Shot { var x: Double; var y: Double }
struct Pipe { var x: Double; var center: Double; var passed = false }

// Rules are Foundation-only, so CI can exercise them without a watch simulator.
struct WatchGame {
    let kind: GameKind
    var score = 0, enemyScore = 0, lives = 3, level = 1, lines = 0
    var over = false, won = false
    var player = 180.0, bot = 180.0, x = 180.0, y = 260.0, vx = 100.0, vy = 205.0
    var wait = 0.7, waiting = true, elapsed = 0.0, cooldown = 0.0, shotTimer = 0.0, shield = 0.0, direction = 1.0
    var bricks: [GameRect] = [], enemies: [GameRect] = [], bullets: [Shot] = [], shots: [Shot] = [], pipes: [Pipe] = []
    var board = Array(repeating: Array(repeating: 0, count: 10), count: 20)
    var bag: [Int] = [], next: [Int] = [], cells: [GridPoint] = [], type = 0, blockX = 3, blockY = 0
    var held: Int?, holdUsed = false, lock = 0.0, lockMoves = 0, fall = 0.0, combo = -1
    var a = 1, b = 1, choices: [Int] = [], answered = 0, correct = 0, feedback = "", selected: Int?, answerDelay = 0.0
    var mathRange = 10, mathMode = 0, remaining = 60.0, streak = 0, retries: [GridPoint] = []
    var snake = [GridPoint(x: 5, y: 8), GridPoint(x: 4, y: 8), GridPoint(x: 3, y: 8)]
    var food = GridPoint(x: 9, y: 8), snakeDirection = 0, pendingDirection = 0, snakeClock = 0.0
    static let shapes: [[GridPoint]] = [
        [(0,1),(1,1),(2,1),(3,1)], [(1,0),(2,0),(1,1),(2,1)], [(1,0),(0,1),(1,1),(2,1)],
        [(1,0),(2,0),(0,1),(1,1)], [(0,0),(1,0),(1,1),(2,1)], [(0,0),(0,1),(1,1),(2,1)], [(2,0),(0,1),(1,1),(2,1)]
    ].map { $0.map { GridPoint(x: $0.0, y: $0.1) } }

    init(_ kind: GameKind, mathRange: Int = 10, mathMode: Int = 0) {
        self.kind = kind; self.mathRange = mathRange; self.mathMode = mathMode
        switch kind {
        case .breakout: makeBricks()
        case .blocks: for _ in 0..<4 { next.append(take()) }; spawn()
        case .invaders: makeEnemies()
        case .multiplication: question()
        default: break
        }
    }
    static func clamp(_ v: Double, _ low: Double, _ high: Double) -> Double { min(high, max(low, v)) }
    static func hit(_ x: Double, _ y: Double, _ r: Double, _ b: GameRect) -> Bool {
        let dx = x - clamp(x, b.x, b.x + b.w), dy = y - clamp(y, b.y, b.y + b.h)
        return dx * dx + dy * dy <= r * r
    }
    mutating func serve() { x = player; y = kind == .pong ? 260 : 465; vx = kind == .pong ? Double.random(in: -100...100) : 110; vy = kind == .pong ? ((score + enemyScore) % 2 == 0 ? 205 : -205) : -230 - Double(level) * 12; wait = 0.7; waiting = true }
    mutating func makeBricks() { bricks = (0..<40).map { i in GameRect(x: 10 + Double(i % 8)*43, y: 60 + Double(i / 8)*23, w: 39, h: 18, hp: level > 2 && i < 16 ? 2 : 1) }; serve() }
    mutating func makeEnemies() { enemies = (0..<28).map { i in GameRect(x: 28 + Double(i % 7)*43, y: 48 + Double(i / 7)*31, w: 24, h: 18) }; bullets = []; shots = []; direction = 1; shotTimer = 0 }
    mutating func bounce(_ paddle: Double, _ sign: Double) { let speed = min(430, hypot(vx,vy)+16), angle = Self.clamp((x-paddle)/44,-1,1)*1.05; vx = sin(angle)*speed; vy = sign*cos(angle)*speed }

    mutating func update(_ dt: Double) {
        guard !over else { return }
        elapsed += dt
        switch kind {
        case .pong:
            bot += Self.clamp(x + vx*0.10 - bot, -160*dt, 160*dt); bot = Self.clamp(bot,42,318)
            if wait > 0 { wait -= dt; return }
            x += vx*dt; y += vy*dt
            if x < 7 || x > 353 { x = Self.clamp(x,7,353); vx *= -1 }
            if vy > 0 && y >= 472 && y <= 490 && abs(x-player) < 49 { y = 472; bounce(player,-1) }
            if vy < 0 && y <= 48 && y >= 30 && abs(x-bot) < 49 { y = 48; bounce(bot,1) }
            if y < -15 || y > 535 { if y < 0 { score += 1 } else { enemyScore += 1 }; if score == 7 || enemyScore == 7 { over = true; won = score == 7 } else { serve() } }
        case .breakout:
            if waiting { x = player; return }
            let ox = x, oy = y; x += vx*dt; y += vy*dt
            if x < 6 || x > 354 { x = Self.clamp(x,6,354); vx *= -1 }; if y < 6 { y = 6; vy = abs(vy) }
            if vy > 0 && oy <= 474 && y >= 474 && abs(x-player) < 46 { y = 474; bounce(player,-1) }
            if let i = bricks.firstIndex(where: { $0.hp > 0 && Self.hit(x,y,6,$0) }) { let brick = bricks[i]; bricks[i].hp -= 1; score += bricks[i].hp == 0 ? 10 : 5; if ox < brick.x || ox > brick.x + brick.w { vx *= -1 } else { vy *= -1 }; x = ox; y = oy }
            if y > 535 { lives -= 1; if lives == 0 { over = true } else { serve() } }
            if !bricks.contains(where: { $0.hp > 0 }) { score += 100; level += 1; if level > 10 { over = true; won = true } else { makeBricks() } }
        case .blocks:
            fall += dt; if fall >= max(0.07, 0.8*pow(0.82,Double(level-1))) { fall = 0; if valid(cells,blockX,blockY+1) { blockY += 1 } }
            if !valid(cells,blockX,blockY+1) { lock += dt; if lock >= 0.45 { place() } } else { lock = 0 }
        case .invaders:
            cooldown -= dt; if cooldown <= 0 { bullets.append(Shot(x:player,y:475)); cooldown = 0.22 }
            let speed = 14 + Double(level)*5 + Double(28-enemies.count)*1.2
            for i in enemies.indices { enemies[i].x += direction*speed*dt }
            if enemies.contains(where: { $0.x < 8 || $0.x+$0.w > 352 }) { direction *= -1; for i in enemies.indices { enemies[i].x = Self.clamp(enemies[i].x,8,328); enemies[i].y += 13 } }
            shotTimer += dt; if shotTimer > max(0.25,1.1-Double(level)*0.08), let enemy = enemies.randomElement() { shotTimer = 0; shots.append(Shot(x:enemy.x+12,y:enemy.y+18)) }
            for i in bullets.indices.reversed() { bullets[i].y -= 360*dt; let shot = bullets[i]; if let target = enemies.firstIndex(where: { shot.x >= $0.x && shot.x <= $0.x+$0.w && shot.y >= $0.y && shot.y <= $0.y+$0.h }) { enemies.remove(at:target); bullets.remove(at:i); score += 20 } else if shot.y < 0 { bullets.remove(at:i) } }
            shield = max(0,shield-dt)
            for i in shots.indices.reversed() { shots[i].y += (165+Double(level)*12)*dt; if shots[i].y >= 473 && shots[i].y <= 495 && abs(shots[i].x-player) < 19 { shots.remove(at:i); if shield == 0 { lives -= 1; shield = 1.5; if lives == 0 { over = true } } } else if shots[i].y > 530 { shots.remove(at:i) } }
            if enemies.contains(where: { $0.y+$0.h >= 465 }) { over = true }; if enemies.isEmpty && !over { level += 1; score += 100; makeEnemies() }
        case .flight:
            if waiting { return }; vy += 620*dt; y += vy*dt; shotTimer += dt
            if shotTimer >= 1.75 { shotTimer = 0; pipes.append(Pipe(x:380,center:Double.random(in:130...370))) }
            for i in pipes.indices { pipes[i].x -= (105+min(50,Double(score)*2))*dt; let p = pipes[i]; if !p.passed && p.x+48 < 86 { pipes[i].passed = true; score += 1 }; if Self.hit(86,y,11,GameRect(x:p.x,y:0,w:48,h:p.center-78)) || Self.hit(86,y,11,GameRect(x:p.x,y:p.center+78,w:48,h:520-p.center-78)) { over = true } }
            pipes.removeAll { $0.x < -60 }; if y < 11 || y > 509 { over = true }
        case .multiplication:
            if mathMode == 1 { remaining = max(0,remaining-dt); if remaining == 0 { over = true; return } }
            if answerDelay > 0 { answerDelay = max(0,answerDelay-dt); if answerDelay == 0 { if (mathMode == 0 && answered >= 20) || (mathMode == 2 && lives == 0) { over = true; won = mathMode == 0 } else { question() } } }
        case .snake:
            snakeClock += dt; if snakeClock >= max(0.085,0.19-Double(score)*0.004) { snakeClock = 0; snakeStep() }
        }
    }
    mutating func tap() { guard !over else { return }; if kind == .breakout { waiting = false }; if kind == .flight { waiting = false; vy = -220 }; if kind == .blocks { rotate() } }
    mutating func steer(_ delta: Double) { guard !over else { return }; if kind == .blocks { move(delta > 0 ? 1 : -1) } else if kind == .snake { turn(delta > 0 ? 1 : -1) } else { player = Self.clamp(player+delta*8,kind == .pong ? 42 : 40,kind == .pong ? 318 : 320) } }
    mutating func turn(_ delta: Int) { let candidate = (pendingDirection+delta+4)%4; if candidate != (snakeDirection+2)%4 { pendingDirection = candidate } }
    mutating func snakeStep() { snakeDirection = pendingDirection; let directions = [(1,0),(0,1),(-1,0),(0,-1)],d = directions[snakeDirection]; let head = GridPoint(x:(snake[0].x+d.0+12)%12,y:(snake[0].y+d.1+18)%18); let eating = head == food; let occupied = eating ? snake : Array(snake.dropLast()); if occupied.contains(head) { over = true; return }; snake.insert(head,at:0); if eating { score += 1; let free = (0..<216).map { GridPoint(x:$0%12,y:$0/12) }.filter { !snake.contains($0) }; if let nextFood = free.randomElement() { food = nextFood } else { over = true; won = true } } else { snake.removeLast() } }

    mutating func take() -> Int { if bag.isEmpty { bag = Array(0..<7).shuffled() }; return bag.removeLast() }
    mutating func spawn(_ replacement: Int? = nil) { if let replacement { type = replacement } else { type = next.removeFirst(); next.append(take()) }; cells = Self.shapes[type]; blockX = 3; blockY = 0; fall = 0; lock = 0; lockMoves = 0; if !valid(cells,blockX,blockY) { over = true } }
    func valid(_ c: [GridPoint], _ x: Int, _ y: Int) -> Bool { c.allSatisfy { let xx = x+$0.x, yy = y+$0.y; return xx >= 0 && xx < 10 && yy < 20 && (yy < 0 || board[yy][xx] == 0) } }
    mutating func resetLock() { if lockMoves < 15 { lock = 0; lockMoves += 1 } }
    mutating func move(_ dx: Int) { guard !over,valid(cells,blockX+dx,blockY) else { return }; blockX += dx; resetLock() }
    mutating func rotate() { guard !over,type != 1 else { return }; let size = type == 0 ? 4 : 3,c = cells.map { GridPoint(x:size-1-$0.y,y:$0.x) }; for (dx,dy) in [(0,0),(-1,0),(1,0),(-2,0),(2,0),(0,-1),(0,-2)] { if valid(c,blockX+dx,blockY+dy) { cells = c; blockX += dx; blockY += dy; resetLock(); return } } }
    func ghostY() -> Int { var y = blockY; while valid(cells,blockX,y+1) { y += 1 }; return y }
    mutating func drop() { guard !over else { return }; let y = ghostY(); score += (y-blockY)*2; blockY = y; place() }
    mutating func hold() { guard !over,!holdUsed else { return }; let old = held; held = type; spawn(old); holdUsed = true }
    mutating func place() { for c in cells { let y = blockY+c.y; if y < 0 { over = true; return }; board[y][blockX+c.x] = type+1 }; let rows = board.filter { $0.contains(0) }, count = 20-rows.count; board = Array(repeating:Array(repeating:0,count:10),count:count)+rows; if count > 0 { combo += 1; score += ([0,100,300,500,800][count]+max(0,combo)*50)*level; lines += count; level = 1+lines/10 } else { combo = -1 }; holdUsed = false; spawn() }
    mutating func question() { if !retries.isEmpty && answered%3 == 2 { let retry = retries.removeFirst(); a = retry.x; b = retry.y } else { a = Int.random(in:1...mathRange); b = Int.random(in:1...mathRange) }; var values: Set<Int> = [a*b]; while values.count < 4 { values.insert(max(0,min(mathRange*mathRange,a*b+Int.random(in: -15...15)))) }; choices = values.shuffled(); selected = nil; feedback = "" }
    mutating func answer(_ value: Int) { guard !over,answerDelay == 0 else { return }; answered += 1; selected = value; if value == a*b { correct += 1; streak += 1; score += 10+min(10,streak); feedback = "Dobrze!"; answerDelay = 0.35 } else { lives -= 1; streak = 0; retries.append(GridPoint(x:a,y:b)); feedback = "\(a) × \(b) = \(a*b)"; answerDelay = 1.2 } }
}
