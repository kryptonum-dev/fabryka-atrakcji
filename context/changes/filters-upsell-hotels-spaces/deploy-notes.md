# Deploy notes

Established 2026-11-02, from the Vercel project, GitHub deployments and `sanity-dataset-embeddings-migration/rollout.md`.

## How production deploys

**Git integration on push to `main`.** Project `kryptonum/fabryka-atrakcji` is linked to GitHub `kryptonum-dev/fabryka-atrakcji`, production branch `main`, root directory `apps/astro`, framework Astro, Node 22. Every production deployment up to `fc9ee20` (2026-07-29) came from `vercel[bot]` on push. A push is what later phases should use.

The three production deployments from 2026-09-20 did not use Git. They were `vercel deploy --prod` runs from clean source exports, which is why `origin/main` fell 8 commits behind production.

Rules for a CLI deploy, if one is ever needed:

- Pass `--scope kryptonum`. The CLI's default scope is a personal account, where the project lookup fails.
- Deploy a `git archive` export, not the working tree. The working tree has uncommitted changes that must not ship.
- `--skip-domain` builds a production-target deployment with ISR and aliases nothing, so it can be probed before promotion. Its URL is protected, so use `vercel curl <path> --deployment <url> --scope kryptonum`.

A Preview cannot reproduce ISR behaviour, because `is-preview-deployment.ts` turns ISR off there.

A push that touches `apps/sanity/**` also deploys the production Studio through `.github/workflows/sanity-deploy.yml`.

## How to confirm a build is live

1. Find the production deployment for the pushed SHA:

   ```sh
   gh api repos/kryptonum-dev/fabryka-atrakcji/deployments \
     --jq '[.[] | select(.environment == "Production")][0] | {sha: .sha[:7], created_at}'
   gh api repos/kryptonum-dev/fabryka-atrakcji/commits/<sha>/status \
     --jq '{state, statuses: [.statuses[] | {context, state, target_url}]}'
   ```

   The `Vercel` status turns `success` when the build finishes, and its `target_url` names the deployment.

2. Read what the domain serves:

   ```sh
   vercel inspect https://www.fabryka-atrakcji.com --scope kryptonum | head -12
   ```

   The `created` time must be later than the push, and the id must match the deployment from step 1.

3. Run `context/changes/filters-upsell-hotels-spaces/verify.sh`.

Do not print the project object from the Vercel API. It contains the deploy hook URL and encrypted env values.

## State before the first push of this change

- Production served `dpl_A6LENqe1zgRgQpFNuSzCwPBc4TQS`, built 2026-09-20 from `6cd70fc`. `origin/main` was at `fc9ee20`.
- The 8 unpushed commits, `da87956..55af545`, were therefore already live. `6cd70fc..55af545` changes only rollout evidence under `context/`, so pushing them changes no runtime code.
- Those commits also touch `apps/sanity/**`, so the first push redeploys the Studio from the same source that went live on 2026-09-20.

## Rollback

Promote the previous deployment:

```sh
vercel promote https://fabryka-atrakcji-t9qful76x-kryptonum.vercel.app --scope kryptonum --yes
```

A promote pauses automatic domain assignment for Git deployments. Check this in the Vercel dashboard before relying on the next push.
