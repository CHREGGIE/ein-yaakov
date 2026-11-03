# Audio hosting on Cloudflare R2

The site and the podcast feed play MP3s from one public R2 bucket. Files live at
`<AUDIO_BASE_URL>/<masechta>/<Masechta-NN>.mp3`, for example `.../baitza/Baitza-01.mp3`.

## 1. Create the bucket

1. Sign in at dash.cloudflare.com and open **R2 Object Storage** in the left sidebar.
   The first time, Cloudflare asks you to turn on R2 and add a payment method. The free tier
   covers 10 GB of storage and R2 has no download (egress) fees.
2. Click **Create bucket**. Name it `ein-yaakov-audio`, leave location on **Automatic**, and create it.

## 2. Make it public

3. Open the bucket, go to **Settings**, find **Public Development URL** (r2.dev) and click **Enable**.
   Type `allow` to confirm. Copy the URL it shows, which looks like `https://pub-xxxxxxxx.r2.dev`.
   - r2.dev is fine to start, but Cloudflare rate-limits it. Once the site has its own domain,
     add a **Custom Domain** here (for example `audio.yourdomain.org`) and use that URL instead.

## 3. Upload the audio

4. In the bucket, open **Objects**, click **Add directory** (or **Create folder**), and name it `baitza` (lowercase).
5. Open `baitza` and upload the five cleaned MP3s, keeping these exact names:
   `Baitza-01.mp3`, `Baitza-02.mp3`, `Baitza-03.mp3`, `Baitza-04.mp3`, `Baitza-05.mp3`.
6. Check one works: open `https://pub-xxxxxxxx.r2.dev/baitza/Baitza-01.mp3` in a browser. It should play.

## 4. Point the site at it (Vercel)

7. In Vercel, open the **ein-yaakov** project → **Settings** → **Environment Variables**. Add:
   - `AUDIO_BASE_URL` = the r2.dev (or custom domain) URL from step 3, with no trailing slash.
     Tick Production and Preview.
   - Optional, for Apple Podcasts: `PODCAST_OWNER_NAME` and `PODCAST_OWNER_EMAIL`.
   - Optional, for download stats: `OP3` = `1`.
8. Still in Settings, open **Deployment Protection** and turn **Vercel Authentication** off,
   so visitors don't need a Vercel login.
9. Go to **Deployments**, open the menu (⋯) on the latest one and click **Redeploy**.
   Environment variable changes only take effect on a new deployment.

## Later: uploads without the dashboard

To let the pipeline upload new shiurim on its own, create an R2 API token
(R2 → **Manage API tokens** → **Create API token**, permission *Object Read & Write*, scoped to this bucket)
and store the Account ID, Access Key ID and Secret Access Key as secrets in the environment that runs
the pipeline. Never paste them into chat or commit them to the repo.
