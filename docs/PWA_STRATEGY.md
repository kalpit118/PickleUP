# PWA and Mobile Strategy

## Goal

The website must provide nearly the full functionality of the mobile experience so an iOS App Store release is not required for the core product.

## Web

Desktop users access the application through a normal browser.

## Android

Android users can install the PWA from a supported browser. An Android APK can be produced later if direct distribution or Play Store distribution becomes useful.

## iPhone/iPad

Users can open the web app in Safari and add it to the Home Screen. This avoids requiring an App Store application for the initial product.

## Shared Functionality

The following should work on web and mobile:

- Authentication
- Profile
- Friends
- Groups
- Games
- Match scoring
- Match history
- Tournaments
- Standings
- Brackets
- Analytics
- Leaderboards
- Public tournament pages
- Notifications where platform support permits

## Responsive Design Rule

Do not build separate web and mobile products initially. Build one responsive application with mobile-first components where appropriate.

## Mobile Score Screen

The score-entry screen should prioritize:

- Very large score controls
- Minimal typing
- Clear team/player names
- Immediate score visibility
- Confirmation before final submission
- Good usability while standing near a court

## Offline Consideration

The PWA shell can be cached. Offline match scoring should be treated as a later feature because synchronization conflicts can make score integrity complicated.
