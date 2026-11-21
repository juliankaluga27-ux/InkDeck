# InkDeck Watch app — 1.1.0 beta 6

The native SwiftUI app targets watchOS 9 or newer and is built as part of the iPhone/iPad IPA. It is embedded at `Payload/InkDeck.app/Watch/InkDeckWatch.app`; there is no standalone Watch ZIP in the release artifact.

The app offers Pong, brick breaking, Ink Blocks, Space Invaders, Ink Flight, MultiplicatingKid practice and Snake. Games run offline once installed, use Digital Crown/touch controls and save records on the Watch. It does not contain the full website, accounts, classes or multiplayer.

To install, sideload and sign the combined IPA on the paired iPhone, using the same Apple Developer team for both app bundles. Then install InkDeck from the Apple Watch app on iPhone under **Mój zegarek → Dostępne aplikacje**. The iOS app's **Ustawienia → Dodaj do Apple Watcha** button shows these steps. Apple controls installation onto the Watch, and the iPad cannot pair with a Watch.

The IPA is an unsigned development build, not a TestFlight package. The CI verifies the nested app, watchOS 9 minimum and iPhone companion identifier, and builds the Watch target without a simulator. Physical installation still requires signing that preserves the embedded Watch app and has not yet been verified on hardware.
