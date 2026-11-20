# InkDeck for Apple Watch — 1.1.0 beta 5

Native SwiftUI/Canvas games for watchOS 9 or newer: Pong, brick breaking, Ink Blocks, Space Invaders, Ink Flight, MultiplicatingKid training and Snake. The games run on the watch without an active iPhone/internet connection after installation. Digital Crown controls paddles, the ship, block movement or Snake turns; touch/buttons provide additional controls. Leaving the game or backgrounding the watch pauses it. Records are stored on that watch, independently of iOS.

Ink Blocks has seven shuffled figures, rotation with wall kicks, hold, ghost, next-piece previews, soft gravity, hard drop, line/combo points and rising speed. MultiplicatingKid offers 20-question practice, a 60-second sprint and a three-life challenge at ranges 1–10/12/20, with retries of mistakes and local answer counters. Full website accounts/classes/rankings are available in the iOS online view, not on watchOS.

## Packages and installation

The `InkDeck-Apple-Watch-beta` Actions artifact contains:

- `InkDeck-iPhone-Watch-1.1.0-beta5-unsigned.ipa`: iOS companion with the embedded `Watch/InkDeckWatch.app`.
- `InkDeckWatch-1.1.0-beta5.app.zip`: the native watch app for development installation.
- SHA-256 checksum of the IPA.

These are unsigned development/sideload artifacts, not TestFlight packages. The iPhone companion still requires iOS 15; pairing with a watch running watchOS 9 also depends on Apple's iPhone/watch pairing requirements. A watch cannot be paired with an iPad. Use the ordinary iOS artifact for iPad Air 2.

A signing/installation tool must preserve and sign the nested watch application and its identifiers. Installing just the iPhone portion in an arbitrary IPA tool does not guarantee watch installation. The supported development route is Xcode with your Apple Developer team and a registered/paired watch: generate `ios/InkDeck.xcodeproj` and `watch/InkDeckWatch.xcodeproj` using XcodeGen, enable signing, select the watch and run the watch scheme. For TestFlight, archive a correctly signed companion with its embedded watch app and upload through App Store Connect; no signing credentials are included here.

## Validation

`Shared/GameCore.swift` has no UI dependencies. CI concatenates it with `tests/core-test.swift`, executes the rule checks with Swift, and builds Release for a physical watch destination without launching a simulator. The deployment target and companion identifiers are checked in the produced bundle. Crown feel, tiny-screen layout, energy usage and actual installation require a physical Apple Watch test; building is not evidence of those checks.

The Kindle branch/source and iOS 15 support are preserved. Legacy iPad 2 / 32-bit support is outside this update.
