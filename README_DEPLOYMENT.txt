PUJAMAP26 - SIMPLE SETUP (no Netlify Functions needed)

The website now talks to Supabase directly through safe database functions.
Netlify only has to host index.html and admin.html.

FILES (upload to the ROOT of your GitHub repo):
  index.html, admin.html, netlify.toml, package.json, supabase-schema.sql, supabase-photos.sql
  netlify/functions/*.js   (optional - not required any more)

STEP 1  Supabase > SQL Editor > New query
        Paste the ENTIRE supabase-schema.sql and click Run. Wait for "Success".
        Then, in a NEW query, paste supabase-photos.sql and Run (creates the photo bucket).
        Do this BEFORE step 3. If either shows an error, copy the error text.

STEP 2  Supabase > Authentication > Users > Add user
        Enter your admin email + a password (tick "auto confirm" if offered).

STEP 3  Supabase > SQL Editor > New query. Run this ONE line with your real admin email:
        insert into public.admins (email) values (lower('YOUR_ADMIN_EMAIL_HERE')) on conflict do nothing;

STEP 4  GitHub: upload the files, commit. Netlify redeploys by itself.
        (Netlify > Deploys should show "Published".)

STEP 5  Test:
        - Open your site. Tap "I'm here": the message should say "Live community pulse".
        - Open /admin.html, sign in with the Step 2 email/password.
          Keep the main site open on a phone: a visitor row appears within ~30 seconds.

TROUBLESHOOTING
- The site itself shows the reason in brackets, e.g. (HTTP 404: Could not find the function ...)
  means Step 1 was not run / not fully run. Run the whole SQL again (safe to repeat).
- Admin says "Not an admin": do Step 3 with the exact same email you log in with.
- Admin says "Invalid login credentials": do Step 2.
- Photo upload error: run supabase-photos.sql (Step 1, second part).

SECURITY
- Only the public anon key is in the website. No secret key is needed anywhere in this setup.
- All tables are locked (RLS). The public can only call validated functions; only your admin email can read visitor data.
- Tips/photos are rate-limited to 10 per hour per browser.
- Visitor code is a browser identifier, not a hardware/MAC address.
- The Mahalaya stream URL in index.html is still blank and must be set to an authorized stream.
