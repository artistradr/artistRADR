
## Working rules (for Claude, read first)
- Always give copy-paste bash commands, not just explanations.
- Local dev: cd ~/artist-radr && git checkout feature/studio && git pull origin feature/studio && npm install && pkill -f vite; rm -rf node_modules/.vite; npm run dev
- Public site: npm run dev (port 5173). Studio: npm run dev:studio (port 5174). Never put VITE_APP_MODE in .env, only in .env.studio.
- Legacy Supabase keys are off. Use sb_publishable_ and sb_secret_ keys only.
- Weekly Top 10 design C is locked (header and rows from B, track 1 from A). Do not add more design.
