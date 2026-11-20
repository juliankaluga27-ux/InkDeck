# InkDeck for iPhone and iPad — 1.1.0 beta 5

Separate iOS/iPadOS application based on the Kindle 3.11.2 game code. Requires iOS/iPadOS 15 or newer, including the iPad Air 2. Kindle source files, version number, release workflow and published packages are unchanged.

## Arcade beta 5

The iOS-only Arcade tab adds Pong (first to seven), ten-level brick breaking with three lives, Ink Blocks, Space Invaders, Ink Flight and MultiplicatingKid. Ink Blocks includes seven shuffled figures, hold, three-piece previews, a ghost, wall kicks, lock delay, hard/soft drop, line/combo points and increasing speed. Touch controls, pause on navigation/background, local records and resuming unfinished Ink Blocks sessions are included. The original game launcher keeps its no-scroll layout.

MultiplicatingKid includes a local trainer: twenty-question practice, a sixty-second sprint and a three-life challenge, ranges 10/12/20, selected tables, retries and persistent answer counters. **Full game online** opens the existing HTTPS service in a separate native web view, including accounts, classes, rankings, streaks and administration. Internet/service availability is required. The online view has no access to InkDeck API keys or its privileged local-file networking bridge. Offline sessions do not synchronize with the service.

Download `InkDeck-iOS-1.1.0-beta5-unsigned.ipa` from the ordinary iOS artifact. A separate `InkDeck-Apple-Watch-beta` artifact contains the companion IPA with the native watch app and a zipped watch application; see [watch instructions](../watch/README.md). The watch job tests native rules and builds without a simulator. A failed watch build does not remove the published iOS IPA. The ordinary IPA still targets iOS/iPadOS 15, including Air 2. All these packages remain beta.

`node ios/tests/arcade-test.js` checks actual rule transitions. The optional `ios/tests/arcade-browser-test.js` uses Playwright/Chrome to exercise menus, canvases and controls. Install Playwright separately or provide its module path through PLAYWRIGHT_MODULE. Physical iOS 15 and Apple Watch testing remains necessary.

## Architecture

- Swift/UIKit host with a persistent WKWebView data store and bundled offline games.
- `node ios/prepare-web.js` generates `ios/Web` from the existing game sources, then adds mobile styles and adapters. Generated assets are not committed.
- The page column controls board width on iPad. UIKit keeps content inside safe areas and above the keyboard. Portrait, landscape and iPad multitasking use the current viewport.
- Snake supports direction buttons on contact and swipe gestures. 2048 retains its existing swipe controls. Snake pauses outside its page and in the background.
- Online play and AI use an allowlisted native HTTPS bridge because bundled files have a different origin from the server. No embedded credentials, disabled TLS validation or arbitrary shell execution. Redirects are rejected.
- Local settings, notes and drawings use the persistent web data store. Removing the app deletes its local data. Cross-device synchronization is not included.

## Build the IPA

Open the **iOS IPA for iLoader and Sideloadly** workflow in GitHub Actions. Pushes to `ios/**` branches start it automatically. Download the `InkDeck-iOS-iLoader-Sideloadly` artifact from a successful run and extract the IPA from the ZIP.

The workflow generates an Xcode project using XcodeGen, builds for physical iOS devices with signing disabled, and packages `Payload/InkDeck.app` into an IPA. No Apple account, certificates or signing secrets are required for this build.

For a local Mac build: run `node ios/prepare-web.js`, install XcodeGen, run `cd ios && xcodegen generate`, then use the same `xcodebuild` and packaging commands as `.github/workflows/ios.yml`.

## Install through iLoader (including iPad Air 2)

1. Download the artifact ZIP from the successful workflow and extract `InkDeck-iOS-1.1.0-beta5-unsigned.ipa`.
2. Connect the iPad by USB, unlock it, trust the computer, and select it in iLoader.
3. Use iLoader's IPA installation option, choose the extracted IPA, and complete signing/authentication in iLoader.
4. If iPadOS asks, trust your developer identity under Settings > General > VPN & Device Management. iPadOS 15 does not have the Developer Mode switch introduced in iPadOS 16.

iLoader must sign the IPA for the selected device. This is an unsigned sideload build, not a TestFlight or AltStore PAL distribution package. The workflow verifies the packaged application's minimum OS, iPad device family and arm64 executable. CI runs WebKit/touch tests on the available newer simulator; installation and runtime behavior on a physical iPad Air 2 with iPadOS 15 still need device verification. If installation fails, keep iLoader's exact error message.

## Install through Sideloadly (Windows or macOS)

1. Download and extract the IPA from the successful Actions run.
2. Connect the iPhone or iPad with USB, unlock it and trust the computer.
3. Open Sideloadly, select the device, drag in `InkDeck-iOS-1.1.0-beta5-unsigned.ipa` and enter your Apple ID in Sideloadly.
4. Choose Start and complete Apple's authentication if requested. Keep Apple credentials in Sideloadly; do not add them to this repository.
5. Follow the device's prompts to trust the developer and enable Developer Mode if required.

Sideloadly signs the IPA during installation. Signing validity depends on the Apple account and provisioning used. A jailbreak is not required.

## Platform differences and validation

Beta 3 centers/scales chess pieces independently of glyph baselines and reserves screen height for Wordle's full Polish/English keyboard. Wordle uses a side-by-side layout in landscape. Ink AI has an API settings dialog, encrypted key vault, persistent named/deletable chats and drafts, provider-specific model selection/search, and catalog refresh. The bundled text-chat catalog contains 392 interactive OpenRouter entries, 49 OpenAI starter entries and 22 Gemini/Gemma starter entries (snapshot 2026-10-17, derived from the public OpenRouter catalog). Starter entries are not a guarantee of availability via a particular account or direct-provider API; refresh uses the provider's canonical model listing. Model IDs and names can be searched. No API keys or vault passwords are stored in chat history or catalog caches.

Google uses generateContent with structured conversation history; OpenAI uses Responses with store:false; OpenRouter uses Chat Completions. GET model catalogs and Google model-generation routes are explicitly allowlisted by the native bridge. Redirects remain rejected. AI response parsing, chat switching during pending requests, encrypted-vault migration and catalog pagination are checked with deterministic fixtures; no paid provider completion is sent during CI.

Beta 2 fixes document-level drawing handlers canceling unrelated touch events. Its tests include real simulator taps opening Tic-tac-toe and placing X, plus a regression check for uncanceled touchend events. It restores the original InkDeck logo, supplies a home-screen app icon, uses a compact game launcher without scrolling at supported phone/tablet sizes, renames the editor InkWriter, and adds color including blue X and red O.

Kindle's shell-based updater, Wi-Fi upload server and filesystem plugin manager are excluded from the mobile menu. Install newer mobile builds through iLoader or Sideloadly. The shared Hacket text may still describe Kindle-specific features; it is not an iOS installation guide.

Node regression checks cover the original game behavior, generated resources, board sizing for phone/tablet viewports, Snake pausing and network bridge callbacks. A successful device build is required before claiming the IPA is ready. Physical iPhone/iPad checks remain necessary for touch, Pencil, document picking, persistent data after an update, full online games and AI providers.
