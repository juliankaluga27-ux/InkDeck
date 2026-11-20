import SwiftUI

@main
struct InkDeckWatchApp: App {
    var body: some Scene { WindowGroup { WatchLibrary() } }
}

struct WatchLibrary: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(GameKind.allCases) { kind in
                        NavigationLink { WatchPlay(kind: kind) } label: {
                            Label(kind.title, systemImage: kind.icon)
                                .font(.system(size: 14, weight: .semibold))
                        }
                    }
                } header: { Text("INKDECK · BETA") }
                Text("Gry offline · rekordy na zegarku").font(.caption2).foregroundStyle(.secondary)
            }
            .navigationTitle("InkDeck")
        }
    }
}

@MainActor
final class WatchStore: ObservableObject {
    @Published var game: WatchGame
    @Published var paused = true
    @Published var started = false
    @Published var best = 0
    private var last: Date?
    private var recorded = false
    init(_ kind: GameKind) { game = WatchGame(kind); loadBest() }
    var recordKey: String { "inkdeck_watch_best_\(game.kind.rawValue)_\(game.mathRange)_\(game.mathMode)" }
    func loadBest() { best = UserDefaults.standard.integer(forKey: recordKey) }
    func tick(_ date: Date) {
        guard !paused,!game.over else { last = nil; return }
        var dt = min(0.05,last.map { date.timeIntervalSince($0) } ?? 0); last = date
        while dt > 0 { let step = min(dt,1.0/120); game.update(step); dt -= step }
        if game.over && !recorded {
            recorded = true
            if game.score > best { best = game.score; UserDefaults.standard.set(best,forKey:recordKey) }
            if game.kind == .multiplication {
                let defaults = UserDefaults.standard
                defaults.set(defaults.integer(forKey:"inkdeck_watch_math_sessions")+1,forKey:"inkdeck_watch_math_sessions")
            }
        }
    }
    func play() { if game.over { restart() }; paused = false; started = true; last = nil }
    func pause() { paused = true; last = nil }
    func restart() { game = WatchGame(game.kind,mathRange:game.mathRange,mathMode:game.mathMode); paused = true; started = false; recorded = false; last = nil; loadBest() }
    func configure(range: Int, mode: Int) { game = WatchGame(.multiplication,mathRange:range,mathMode:mode); paused = true; started = false; recorded = false; last = nil; loadBest() }
    func answer(_ value: Int) {
        guard !paused,!game.over,game.answerDelay == 0 else { return }
        let key = "inkdeck_watch_math_\(game.a)x\(game.b)_\(value == game.a*game.b ? "correct" : "wrong")"
        let defaults = UserDefaults.standard; defaults.set(defaults.integer(forKey:key)+1,forKey:key)
        game.answer(value)
    }
}

struct WatchPlay: View {
    let kind: GameKind
    @StateObject private var store: WatchStore
    @Environment(\.scenePhase) private var scenePhase
    @State private var crown = 0.0
    @State private var range = 10
    @State private var mode = 0
    private let timer = Timer.publish(every:1.0/30,on:.main,in:.common).autoconnect()
    init(kind: GameKind) { self.kind = kind; _store = StateObject(wrappedValue:WatchStore(kind)) }
    var body: some View {
        VStack(spacing: 3) {
            header
            if kind == .multiplication { mathView } else { arcadeView }
        }
        .navigationTitle(kind == .multiplication ? "Mnożenie" : kind.title)
        .onReceive(timer) { date in if scenePhase == .active { store.tick(date) } }
        .onChange(of: scenePhase) { phase in if phase != .active { store.pause() } }
        .onDisappear { store.pause() }
    }
    private var header: some View {
        HStack(spacing: 4) {
            VStack(alignment:.leading,spacing:0) {
                Text(kind == .pong ? "\(store.game.score) : \(store.game.enemyScore)" : "\(store.game.score) pkt").font(.system(size:14,weight:.bold,design:.rounded))
                Text("Rekord \(store.best)").font(.system(size:9)).foregroundStyle(.secondary)
            }.frame(maxWidth:.infinity,alignment:.leading)
            Button { if store.paused { store.play() } else { store.pause() } } label: { Image(systemName:store.paused ? "play.fill" : "pause.fill") }.accessibilityLabel(store.paused ? "Graj" : "Pauza").frame(width:34,height:32)
            Button { store.restart() } label: { Image(systemName:"arrow.counterclockwise") }.accessibilityLabel("Nowa gra").frame(width:34,height:32)
        }.buttonStyle(.plain)
    }
    private var arcadeView: some View {
        VStack(spacing:3) {
            GeometryReader { geometry in
                ZStack {
                    GameBoard(game:store.game)
                        .contentShape(Rectangle())
                        .gesture(DragGesture(minimumDistance:0).onChanged { value in
                            guard !store.paused else { return }
                            if kind == .pong || kind == .breakout || kind == .invaders {
                                store.game.player = WatchGame.clamp(Double(value.location.x/geometry.size.width)*360,42,318)
                            }
                        }.onEnded { value in
                            guard !store.paused else { return }
                            if kind == .blocks && value.translation.height > 25 { store.game.drop() }
                            else if kind == .blocks && abs(value.translation.width) > 20 { store.game.move(value.translation.width > 0 ? 1 : -1) }
                            else { store.game.tap() }
                        })
                        .focusable(true)
                        .digitalCrownRotation($crown,from:-1000,through:1000,by:1,sensitivity:.low,isContinuous:true,isHapticFeedbackEnabled:false)
                        .onChange(of:crown) { value in
                            let delta = value-lastCrown; lastCrown = value
                            guard !store.paused,abs(delta) < 20,abs(delta) >= 0.5 else { return }
                            store.game.steer(delta)
                        }
                    if store.paused || store.game.over { gameOverlay }
                }.clipShape(RoundedRectangle(cornerRadius:10))
            }
            if kind == .blocks {
                Text("Linie \(store.game.lines) · Poz. \(store.game.level)").font(.system(size:9))
                HStack(spacing:3) {
                    control("⇄") { store.game.hold() }
                    control("←") { store.game.move(-1) }
                    control("↻") { store.game.rotate() }
                    control("→") { store.game.move(1) }
                    control("↓") { store.game.drop() }
                }
            } else if kind == .snake {
                HStack { control("↶") { store.game.turn(-1) }; control("↷") { store.game.turn(1) } }
            } else if kind == .flight {
                control("↑ LEĆ") { store.game.tap() }
            } else {
                HStack { control("←") { store.game.steer(-3) }; control(kind == .breakout ? "START" : "◎") { store.game.tap() }; control("→") { store.game.steer(3) } }
                if kind != .pong { Text("♥ \(store.game.lives) · Fala \(store.game.level)").font(.system(size:9)) }
            }
        }
    }
    @State private var lastCrown = 0.0
    private func control(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action:action) { Text(title).font(.system(size:13,weight:.bold)).frame(maxWidth:.infinity,minHeight:30) }.buttonStyle(.bordered).disabled(store.paused || store.game.over)
    }
    private var gameOverlay: some View {
        VStack(spacing:5) {
            Text(store.game.over ? (store.game.won ? "Wygrano!" : "Koniec gry") : store.started ? "Pauza" : "Gotowy?").font(.headline)
            Text(store.game.over ? "Wynik: \(store.game.score)" : kind.instructions).font(.system(size:11)).multilineTextAlignment(.center)
            Button(store.game.over ? "JESZCZE RAZ" : store.started ? "WZNÓW" : "GRAJ") { store.play() }.font(.system(size:12,weight:.bold))
        }.padding(8).frame(maxWidth:.infinity,maxHeight:.infinity).background(Color.black.opacity(0.88))
    }
    private var mathView: some View {
        Group {
            if !store.started {
                ScrollView {
                    VStack(spacing:5) {
                        Picker("Zakres",selection:$range) { Text("1–10").tag(10); Text("1–12").tag(12); Text("1–20").tag(20) }.frame(height:50)
                        Picker("Tryb",selection:$mode) { Text("20 działań").tag(0); Text("60 sekund").tag(1); Text("3 życia").tag(2) }.frame(height:50)
                        Button("START") { store.configure(range:range,mode:mode); store.play() }
                    }
                }
            } else if store.game.over {
                VStack(spacing:7) {
                    Text("\(store.game.correct) / \(store.game.answered)").font(.title2)
                    Text("Poprawne odpowiedzi").font(.caption2)
                    Button("JESZCZE RAZ") { store.restart() }
                }.frame(maxHeight:.infinity)
            } else if store.paused {
                VStack { Text("Pauza"); Button("WZNÓW") { store.play() } }.frame(maxHeight:.infinity)
            } else {
                VStack(spacing:4) {
                    Text(mode == 1 ? "\(Int(ceil(store.game.remaining))) s" : mode == 2 ? "♥ \(store.game.lives)" : "\(store.game.answered) / 20").font(.system(size:10))
                    Text("\(store.game.a) × \(store.game.b)").font(.system(size:28,weight:.bold,design:.rounded)).minimumScaleFactor(0.6)
                    Text(store.game.feedback.isEmpty ? "Wybierz wynik" : store.game.feedback).font(.system(size:10)).foregroundStyle(store.game.selected == nil ? Color.secondary : store.game.selected == store.game.a*store.game.b ? .green : .orange)
                    LazyVGrid(columns:[GridItem(.flexible()),GridItem(.flexible())],spacing:4) {
                        ForEach(store.game.choices,id:\.self) { value in
                            Button { store.answer(value) } label: { Text("\(value)").font(.system(size:20,weight:.bold)).frame(maxWidth:.infinity,minHeight:32) }
                                .disabled(store.game.answerDelay > 0)
                        }
                    }
                }.frame(maxHeight:.infinity)
            }
        }
    }
}

struct GameBoard: View {
    let game: WatchGame
    private let palette: [Color] = [.cyan,.yellow,.purple,.green,.pink,.blue,.orange]
    var body: some View {
        Canvas { context,size in
            var c = context
            c.scaleBy(x:size.width/360,y:size.height/520)
            func rect(_ x: Double,_ y: Double,_ w: Double,_ h: Double,_ color: Color) { c.fill(Path(CGRect(x:x,y:y,width:w,height:h)),with:.color(color)) }
            func ball(_ x: Double,_ y: Double,_ r: Double,_ color: Color) { c.fill(Path(ellipseIn:CGRect(x:x-r,y:y-r,width:r*2,height:r*2)),with:.color(color)) }
            func text(_ value: String,_ x: Double,_ y: Double,_ size: Double) { c.draw(Text(value).font(.system(size:size,weight:.bold)).foregroundColor(.white),at:CGPoint(x:x,y:y),anchor:.topLeading) }
            func blocks(_ cells: [GridPoint],_ x: Double,_ y: Double,_ size: Double,_ color: Color) { for p in cells { rect(x+Double(p.x)*size+1,y+Double(p.y)*size+1,size-2,size-2,color) } }
            rect(0,0,360,520,Color(red:0.04,green:0.08,blue:0.16))
            switch game.kind {
            case .pong:
                for y in stride(from:0,through:520,by:24) { rect(178,Double(y),4,12,.gray.opacity(0.4)) }
                rect(game.bot-42,30,84,10,.pink); rect(game.player-42,480,84,10,.cyan); ball(game.x,game.y,7,.white)
            case .breakout:
                for (i,b) in game.bricks.enumerated() where b.hp > 0 { rect(b.x,b.y,b.w,b.h,palette[(i/8)%7]); if b.hp > 1 { rect(b.x+4,b.y+4,b.w-8,3,.white) } }
                rect(game.player-40,480,80,10,.cyan); ball(game.x,game.y,6,.white)
            case .blocks:
                for y in 0..<20 { for x in 0..<10 { let v = game.board[y][x]; rect(8+Double(x)*24,18+Double(y)*24,23,23,v == 0 ? Color.white.opacity(0.07) : palette[v-1]) } }
                blocks(game.cells,8+Double(game.blockX)*24,18+Double(game.ghostY())*24,24,palette[game.type].opacity(0.25))
                blocks(game.cells,8+Double(game.blockX)*24,18+Double(game.blockY)*24,24,palette[game.type])
                text("DALEJ",258,25,17)
                for (i,type) in game.next.prefix(3).enumerated() { blocks(WatchGame.shapes[type],258,60+Double(i)*72,19,palette[type]) }
                text("SCHOWEK",253,300,15); if let held = game.held { blocks(WatchGame.shapes[held],258,333,19,palette[held]) }
                text("\(game.lines) LINII",255,435,18)
            case .invaders:
                for e in game.enemies { rect(e.x,e.y+5,e.w,8,.purple); rect(e.x+4,e.y,e.w-8,e.h,.purple); rect(e.x+5,e.y+5,4,4,.black); rect(e.x+15,e.y+5,4,4,.black) }
                for b in game.bullets { rect(b.x-2,b.y,4,12,.cyan) }; for b in game.shots { rect(b.x-2,b.y,4,10,.pink) }
                if game.shield == 0 || Int(game.shield*12)%2 == 1 { rect(game.player-16,480,32,10,.cyan); rect(game.player-5,472,10,10,.cyan) }
            case .flight:
                for p in game.pipes { rect(p.x,0,48,p.center-78,.green); rect(p.x,p.center+78,48,520-p.center-78,.green) }; ball(86,game.y,12,.yellow); ball(91,game.y-3,3,.black)
            case .snake:
                for (i,p) in game.snake.enumerated() { rect(Double(p.x)*30+2,Double(p.y)*28.8+2,26,25,i == 0 ? .green : .mint) }; ball(Double(game.food.x)*30+15,Double(game.food.y)*28.8+14,10,.red)
            case .multiplication: break
            }
        }.accessibilityLabel("Plansza \(game.kind.title)")
    }
}
