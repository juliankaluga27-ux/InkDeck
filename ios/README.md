# InkDeck for iPhone and iPad — 1.0.2 beta 3

Separate iOS/iPadOS application based on the Kindle 3.11.2 game code. Requires iOS/iPadOS 16 or newer. Kindle source files, version number, release workflow and published packages are unchanged.

## Architecture

- Swift/UIKit host with a persistent WKWebView data store and bundled offline games.
- `node ios/prepare-web.js` generates `ios/Web` from the existing game sources, then adds mobile styles and adapters. Generated assets are not committed.
- The page column controls board width on iPad. UIKit keeps content inside safe areas and above the keyboard. Portrait, landscape and iPad multitasking use the current viewport.
- Snake supports direction buttons on contact and swipe gestures. 2048 retains its existing swipe controls. Snake pauses outside its page and in the background.
- Online play and AI use an allowlisted native HTTPS bridge because bundled files have a different origin from the server. No embedded credentials, disabled TLS validation or arbitrary shell execution. Redirects are rejected.
- Local settings, notes and drawings use the persistent web data store. Removing the app deletes its local data. Cross-device synchronization is not included.

## Build the IPA

Open the **iOS IPA for Sideloadly** workflow in GitHub Actions. Pushes to `ios/**` branches start it automatically. Download the `InkDeck-iOS-Sideloadly` artifact from a successful run and extract the IPA from the ZIP.

The workflow generates an Xcode project using XcodeGen, builds for physical iOS devices with signing disabled, and packages `Payload/InkDeck.app` into an IPA. No Apple account, certificates or signing secrets are required for this build.

For a local Mac build: run `node ios/prepare-web.js`, install XcodeGen, run `cd ios && xcodegen generate`, then use the same `xcodebuild` and packaging commands as `.github/workflows/ios.yml`.

## Install through Sideloadly (Windows or macOS)

1. Download and extract the IPA from the successful Actions run.
2. Connect the iPhone or iPad with USB, unlock it and trust the computer.
3. Open Sideloadly, select the device, drag in `InkDeck-iOS-1.0.2-beta3-unsigned.ipa` and enter your Apple ID in Sideloadly.
4. Choose Start and complete Apple's authentication if requested. Keep Apple credentials in Sideloadly; do not add them to this repository.
5. Follow the device's prompts to trust the developer and enable Developer Mode if required.

Sideloadly signs the IPA during installation. Signing validity depends on the Apple account and provisioning used. A jailbreak is not required.

## Platform differences and validation

Beta 3 centers/scales chess pieces independently of glyph baselines and reserves screen height for Wordle's full Polish/English keyboard. Wordle uses a side-by-side layout in landscape. Ink AI has an API settings dialog, encrypted key vault, persistent named/deletable chats and drafts, provider-specific model selection/search, and catalog refresh. The bundled text-chat catalog contains 392 interactive OpenRouter entries, 49 OpenAI starter entries and 22 Gemini/Gemma starter entries (snapshot 2026-10-17, derived from the public OpenRouter catalog). Starter entries are not a guarantee of availability via a particular account or direct-provider API; refresh uses the provider's canonical model listing. Model IDs and names can be searched. No API keys or vault passwords are stored in chat history or catalog caches.

Google uses generateContent with structured conversation history; OpenAI uses Responses with store:false; OpenRouter uses Chat Completions. GET model catalogs and Google model-generation routes are explicitly allowlisted by the native bridge. Redirects remain rejected. AI response parsing, chat switching during pending requests, encrypted-vault migration and catalog pagination are checked with deterministic fixtures; no paid provider completion is sent during CI.

Beta 2 fixes document-level drawing handlers canceling unrelated touch events. Its tests include real simulator taps opening Tic-tac-toe and placing X, plus a regression check for uncanceled touchend events. It restores the original InkDeck logo, supplies a home-screen app icon, uses a compact game launcher without scrolling at supported phone/tablet sizes, renames the editor InkWriter, and adds color including blue X and red O.

Kindle's shell-based updater, Wi-Fi upload server and filesystem plugin manager are excluded from the mobile menu. Install newer mobile builds through Sideloadly. The shared Hacket text may still describe Kindle-specific features; it is not an iOS installation guide.

Node regression checks cover the original game behavior, generated resources, board sizing for phone/tablet viewports, Snake pausing and network bridge callbacks. A successful device build is required before claiming the IPA is ready. Physical iPhone/iPad checks remain necessary for touch, Pencil, document picking, persistent data after an update, full online games and AI providers.
