# CROSSROADS

A two-player, no-map street exploration game starter.

## What works
- Create a private four-character room code.
- A second player joins from another browser/device.
- Host starts a round; both players are assigned opposite sides of the same city.
- Street-level panorama viewer (Mapillary) and server-side proximity check.
- Round ends when the players are within 18 metres.

## Requirements
- Node.js 18+
- A Mapillary access token (free account/API access; availability and terms are controlled by Mapillary).

## Run locally
1. Install Node.js.
2. Unzip this project and open a terminal in the `crossroads` folder.
3. Run `npm install`.
4. Set your token:
   - Windows PowerShell: `$env:MAPILLARY_TOKEN="YOUR_TOKEN"`
   - macOS/Linux: `export MAPILLARY_TOKEN="YOUR_TOKEN"`
5. Run `npm start`.
6. Open `http://localhost:3000` in two browser windows.

For two people on different networks, deploy the Node app to a host that supports WebSockets and set `MAPILLARY_TOKEN` in its environment variables. Share the deployed URL and room code.

## Important prototype notes
- This is an MVP scaffold, not a finished production game.
- Mapillary street imagery coverage varies by city. The four starting regions are Lisbon, Prague, Amsterdam, and Copenhagen.
- The Mapillary JS viewer API can change; verify the current SDK and token requirements if the viewer fails to initialize.
- The client reports panorama position to the server. The proximity check is a prototype and should be validated against the current viewer SDK's position API before public release.
- Do not expose the Mapillary token in public client code in a production deployment. This starter serves it to the browser for the viewer, so use a token with only the minimum permissions and review Mapillary's current usage terms.
- No map, minimap, compass, player markers, or live opponent coordinates are shown.
