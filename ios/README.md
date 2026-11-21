# InkDeck for iPhone, iPad and Apple Watch — 1.1.0 beta 6

This beta produces **one IPA** for iPhone and iPad, with the native watchOS app embedded inside the iPhone app. It targets iOS/iPadOS 15 or newer. The Watch app targets watchOS 9 or newer and runs its games offline after installation. Kindle source and release 3.11.2 are unchanged.

## Apple Watch

Open **Ustawienia** from the InkDeck home screen and tap **Dodaj do Apple Watcha** for the install steps. Install the IPA on the paired iPhone and sign both the iPhone app and its embedded Watch app with the same Apple Developer team. Then open Apple's Watch app on the iPhone and choose **Mój zegarek → Dostępne aplikacje → InkDeck → Instaluj**. iOS controls Watch app installation; InkDeck cannot install an app onto the Watch directly. An iPad can run InkDeck, but cannot pair with Apple Watch.

The Watch app includes Pong, Breakout, Ink Blocks, Space Invaders, Ink Flight, MultiplicatingKid practice and Snake. It stores its records locally. Full MultiplicatingKid accounts, classes and rankings remain in the online iPhone app.

The Actions artifact is a ZIP wrapper containing **one IPA and its SHA-256 file**. Extract the IPA before importing it into Sideloadly or iLoader. There is no separate watch-app ZIP to open. The IPA is unsigned; the build verifies that the watchOS 9 app and its companion identifier are embedded, but installation on a physical Watch still needs signing and device testing.

## Games and layout

The iOS-only Arcade tab includes Pong, ten-level brick breaking, Ink Blocks with seven-piece bags/hold/ghost/drop/levels, Space Invaders, Ink Flight and MultiplicatingKid training. The full MultiplicatingKid website opens separately in a WKWebView. Its account, class, ranking and streak features require internet access.

Chess, checkers and tic-tac-toe can use online rooms. When an online game ends, InkDeck now clears the local room session and shows the create/join controls again, so a new room can be started without manually leaving the old one. The completed board remains visible.

## Build and validation

The **iOS IPA for iLoader and Sideloadly** workflow builds iOS and watchOS together, packages one combined IPA, and runs the web/game checks without launching a simulator. The app minimum remains iOS/iPadOS 15 for devices such as iPad Air 2. Optional simulator checks are available by manual workflow dispatch; physical iOS 15 and Watch installation checks remain outstanding.

Run `node ios/prepare-web.js` to generate the bundled site, then run `node ios/tests/mobile-test.js`, `node ios/tests/multiplayer-test.js`, `node ios/tests/ai-test.js`, `node ios/tests/arcade-test.js`, `node tests/ui-test.js` and `node tests/updater-client-test.js` for the local regressions. A Mac with Xcode and XcodeGen is required to build the combined IPA.
