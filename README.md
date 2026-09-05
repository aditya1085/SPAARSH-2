# SPAARSH — Smart Personal Assistance And Remote Support for Healthcare
### A Digital Touch of Care

**Team Titans** — Aditya Tripathi (Team Leader), Ashu Garg, Dewanshi Gaikwad, Harshvardhan Singh

Built for **Build with Bharat 2.0** — National Level Hackathon

---

## Problem Statement

Medical emergencies can happen anytime, but delayed response often leads to severe consequences. Individuals living alone are at higher risk due to lack of monitoring and immediate assistance, resulting in preventable deaths or long-term damage.

## Solution

SPAARSH turns a smartphone people already carry into a privacy-first safety net. It uses real device sensors to detect inactivity, escalates through a 3-level alert system, and only shares live location and personal details with guardians once a genuine emergency is confirmed — never before.

Every account can act as **both a User (monitored person) and a Guardian (watching others)** at the same time — there's no separate sign-up for each role.

## How It Works

### Account & Profile (one-time signup)
A single sign-up form collects everything needed for both roles: full name, age, date of birth, phone number, an emergency contact, and the user's **active window** (e.g. 7:00 AM – 11:00 PM) — the hours they're normally awake and active.

### The 3-Level Escalation
- **Level 1 — Inactivity Check-in:** If no real activity (touch, motion, GPS movement) is detected *within the user's stated active window*, the app asks "Are you okay?" Silence during the user's own sleep hours is treated as normal and never triggers an alert. The inactivity threshold is user-editable from their dashboard (demo uses a short delay; real deployment uses 4–6 hours as specified in the original design).
- **Level 2 — Guardian Alert:** If there's still no response, every accepted guardian is notified — in-app notification + a chat message — asking them to check in. No location or personal details are shared yet.
- **Level 3 — Emergency Escalation:** If the user still doesn't respond, their real live GPS location and emergency-relevant profile details (age, emergency contact) are unlocked for their guardians, sent as a message in the chat, and pushed as a notification.

### Guardian Requests (privacy by design)
Adding a guardian isn't automatic — the user sends a request by the guardian's registered email, and the guardian must **explicitly accept** it before they can see anything. Until Level 3 is reached, an accepted guardian only sees the user's name and a high-level status (fine / checking in / emergency) — never their live location or personal details.

### Medication Adherence
Users can add medications with a due time. If a dose isn't marked "Taken" in time, it's flagged as missed and guardians are notified immediately — an early, non-emergency warning sign.

### Real-Time Chat & Notifications
Every accepted User–Guardian pair gets a live chat thread. During an emergency, the location is delivered as a message right there, the same way a person would share it manually. Both roles also get an in-app notification bell for requests, alerts, and status changes.

## What's Real (not simulated)

| Feature | Implementation |
|---|---|
| Screen touch detection | Real `touchstart`/`mousedown`/`keydown`/`scroll` listeners with live timestamps |
| Accelerometer | Real `DeviceMotionEvent` data (x/y/z), shown live |
| Gyroscope | Real `DeviceOrientationEvent` data (α/β/γ), shown live |
| GPS | Real `navigator.geolocation.watchPosition`, used for actual Level 3 location sharing |
| Camera ("on unlock") | Real `getUserMedia` camera preview, triggered via the Page Visibility API when the app is resumed (browsers cannot detect an actual OS-level unlock — this is the closest real equivalent) |
| Backend & database | Firebase Firestore — per-user documents, live `onSnapshot` sync, no shared/mock state |
| Authentication | Firebase Auth — email/password sign-up & login, plus anonymous guest mode for quick demos |
| Chat | Real Firestore-backed messages, delivered live between two accounts |

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (single-page app, no build step)
- **Backend / Database:** Firebase Firestore (real-time, per-user collections) + Firebase Authentication
- **Browser sensor APIs:** DeviceMotionEvent, DeviceOrientationEvent, Geolocation API, MediaDevices (camera), Page Visibility API
- **Planned full mobile app stack:** Flutter, Dart, Google Maps API, Node.js

## Live Demo

🔗 **[Add your deployed Netlify link here]**

To try the full flow, sign up with **two different email addresses** (in two browser tabs or two devices):
1. Account A: go to **Guardians** tab → add Account B's email → sends a request.
2. Account B: go to **Guardians** tab → see the incoming request → Accept it.
3. Account A: go to **My Status** → enable sensors → press **Force trigger** (or just stay idle past the threshold).
4. Account B: watch **People I Watch** update live — status escalates, and location unlocks at Level 3.

## Running Locally

Single self-contained HTML file — no build steps needed.

```bash
git clone <this-repo-url>
cd spaarsh
open index.html   # or double-click the file
```

To connect your own Firebase backend, replace the `firebaseConfig` object near the top of the `<script>` section with your own project's config (Firebase Console → Project Settings → General → Your apps), and in the Firebase Console enable:
- **Firestore Database** (start in test mode for a demo)
- **Authentication → Sign-in method → Email/Password** and **Anonymous**

## Deployment

Deployed via [Netlify](https://netlify.com) — drag-and-drop the `index.html` file at [app.netlify.com/drop](https://app.netlify.com/drop) for instant hosting.

## References

- IEEE, 2020 — IoT-Based Smart Health Monitoring System
- Springer, 2019 — Human Activity Recognition using Machine Learning
- Elsevier, 2021 — Real-Time Emergency Response using Mobile Technology
- MDPI, 2022 — IoT in Healthcare: Applications and Challenges
