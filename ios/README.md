# InkDeck for iPhone and iPad — 1.0.0 beta 1

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
3. Open Sideloadly, select the device, drag in `InkDeck-iOS-1.0.0-beta1-unsigned.ipa` and enter your Apple ID in Sideloadly.
4. Choose Start and complete Apple's authentication if requested. Keep Apple credentials in Sideloadly; do not add them to this repository.
5. Follow the device's prompts to trust the developer and enable Developer Mode if required.

Sideloadly signs the IPA during installation. Signing validity depends on the Apple account and provisioning used. A jailbreak is not required.

## Platform differences and validation

Kindle's shell-based updater, Wi-Fi upload server and filesystem plugin manager are excluded from the mobile menu. Install newer mobile builds through Sideloadly. The shared Hacket text may still describe Kindle-specific features; it is not an iOS installation guide.

Node regression checks cover the original game behavior, generated resources, board sizing for phone/tablet viewports, Snake pausing and network bridge callbacks. A successful device build is required before claiming the IPA is ready. Physical iPhone/iPad checks remain necessary for touch, Pencil, document picking, persistent data after an update, full online games and AI providers.
