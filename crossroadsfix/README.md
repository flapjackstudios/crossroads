# CROSSROADS

A two-player, no-map street exploration game starter.

## Deploy on Render

1. Rotate the Mapillary token that was pasted into chat. Use a dedicated client access token for this app.
2. Create a GitHub repository named `crossroads`.
3. Upload **the contents of this folder** to the repository root. `package.json`, `server.js`, `render.yaml`, and the `public` folder must all be at the top level as shown below.
4. In Render, choose **New → Blueprint**, connect the repository, and deploy the `render.yaml` Blueprint. If you use **New → Web Service** instead, choose Node, Build Command `npm install`, Start Command `npm start`, and add `MAPILLARY_TOKEN` in Environment.
5. Add your replacement token as the `MAPILLARY_TOKEN` environment variable in Render. Do not put it in source code or commit it to GitHub.
6. Wait until the service is live. Open the `onrender.com` URL and check that the home page loads. `/healthz` should return `{"ok":true}`.
7. Create a room and share the website URL and room code with your friend. Both players can connect from different Wi-Fi networks.

Expected repository structure:

```text
crossroads/
├── package.json
├── server.js
├── render.yaml
└── public/
    ├── index.html
    ├── client.js
    └── style.css
```

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm install`.
4. In Windows PowerShell, set the token with `$env:MAPILLARY_TOKEN="YOUR_NEW_CLIENT_TOKEN"`.
5. Run `npm start` and open `http://localhost:3000`.

## Prototype limitations

- This is an MVP prototype, not a production-hardened release.
- Mapillary coverage varies by city and street. The current round picker uses Lisbon, Prague, Amsterdam, and Copenhagen.
- MapillaryJS requires a client access token in the browser. It is visible to site visitors by design; use a dedicated token with suitable restrictions/permissions and review Mapillary's current terms.
- The game checks whether the two players' current panorama positions are within 18 metres. The movement and proximity experience should be play-tested.
- Render's free service may sleep after inactivity, so the first visit after a quiet period can take a little longer.
