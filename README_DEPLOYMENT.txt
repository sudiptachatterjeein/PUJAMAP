PUJAMAP26 DEPLOYMENT PACKAGE  (Netlify + Supabase)

FOLDER LAYOUT (keep exactly like this on GitHub):
  index.html
  admin.html                     (Supabase URL + public anon key already filled in)
  netlify.toml
  supabase-schema.sql
  netlify/functions/admin.js
  netlify/functions/community.js
  netlify/functions/concierge.js

SETUP
1. Supabase > SQL Editor: paste and run ALL of supabase-schema.sql.
2. Supabase > Storage: create a PUBLIC bucket named  puja-photos
3. Supabase > Authentication > Users > Add user (your admin email + password).
4. Upload this folder's contents to a GitHub repo (keep the netlify/functions folders).
5. Netlify > Add new site > Import from GitHub (do not use drag-and-drop; it will not build functions).
6. Netlify > Site configuration > Environment variables (scope: include Functions):
     SUPABASE_URL                = https://obrtopvixqemwhvzadda.supabase.co
     SUPABASE_SERVICE_ROLE_KEY   = your secret / service_role key
     ADMIN_EMAIL                 = the same email as the Supabase admin user
     ANTHROPIC_API_KEY           = (optional, for AI Concierge)
7. Deploys > Trigger deploy > Clear cache and deploy site.

CHECK IT WORKS
Open  https://YOUR-SITE.netlify.app/.netlify/functions/community
You should see: "function":"running", all four tables "ok", "photoBucket":"ok".
  - 404 page            -> functions were not deployed (check folder layout / Deploys > Functions).
  - a value is false    -> that environment variable is missing; add it and redeploy.
  - table ERROR         -> run supabase-schema.sql again.
  - photoBucket MISSING -> create the public puja-photos bucket.
The main site also shows the real error text under "Demo/local mode" if the backend fails.
Then open /admin.html, sign in, and keep the main site open in another tab/phone:
visitors appear within ~30 seconds.

SECURITY
- NEVER put SUPABASE_SERVICE_ROLE_KEY in GitHub, index.html or admin.html.
- Row Level Security is enabled on all tables (no public policies); only the Netlify functions read/write.
- Once everything works you may delete the GET health-check block near the top of community.js.
- The Mahalaya stream URL in index.html is still blank and must be set to an authorized stream.
- Visitor code is a browser identifier, not a hardware/MAC address.
