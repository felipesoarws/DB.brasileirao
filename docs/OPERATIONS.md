# Deploy monitoring and rollback

## Monitoring and alerts

Production is built and deployed by [Build and deploy with Gold data](https://github.com/felipesoarws/DB.brasileirao/actions/workflows/deploy.yml), on pushes to `master`, manual dispatch, and every 12 hours. The workflow downloads Gold, builds the site, deploys the prebuilt output, then checks `/`, `/robots.txt`, `/sitemap.xml`, and whether `/api/data-status` reports the exact `updated_at` timestamp from the downloaded Gold manifest. A mismatch or failed route makes the workflow fail and adds a runbook link to its summary.

To receive failure notifications, watch the repository with Actions included (GitHub repository **Watch → Custom → Actions**) and set GitHub notification preferences to **Actions → Only notify for failed workflows**. Notifications are controlled by each GitHub account; a repository workflow cannot opt an account into email or web notifications.

## Gold update timestamp

The sidebar's “last updated” date comes from `data/gold/_metadata.json` → `updated_at`, which records the Gold snapshot load time. `/api/data-status` exposes that timestamp as ISO-8601 in `lastUpdated`. Match-level `canonical_updated_at` is only a compatibility fallback for older manifests without `updated_at`.

Check the latest value and deployment verification in the Actions run summary. The workflow uses a unique query string on its health check so a previously cached status response cannot make a new snapshot appear current.

## Rollback procedure

1. Open the failed workflow and Vercel production deployment logs. Determine whether failure happened before deployment or during the post-deploy verification. A failure before the deploy step leaves the previous deployment active; a verification failure means the new deployment may already be serving traffic.
2. If the active deployment is bad, pause the GitHub workflow (Actions → **Build and deploy with Gold data** → `…` → **Disable workflow**) so the 12-hour schedule or another push does not redeploy it during recovery.
3. In the Vercel project, select the last known-good production deployment and use **Promote to Production** / rollback. Alternatively, from a linked project checkout with the authorized `VERCEL_TOKEN`, use the pinned CLI:

   ```sh
   GOOD_DEPLOYMENT="deployment-url-or-id"
   npx --yes vercel@59.25.4 rollback "$GOOD_DEPLOYMENT" --token="$VERCEL_TOKEN"
   npx --yes vercel@59.25.4 rollback status --token="$VERCEL_TOKEN"
   ```

   Review the target before confirming the rollback. CLI authentication and project linking must point to this project. Do not put the token in command output or commit it.
4. Verify the production homepage, `/api/data-status`, `/robots.txt`, and `/sitemap.xml`. The rollback restores a previous deployment; it does not repair the Drive data, GitHub secrets, or source code.
5. Fix the failing code or Gold input, then re-enable the workflow and run it manually. Confirm its post-deploy verification passes before relying on the next scheduled run.

## Rollback test performed

The rollback path is documented and the pinned Vercel CLI's rollback help/status commands can be checked without changing production. A production rollback itself is intentionally not run as a test because that would change the live deployment. Test recovery on a preview deployment or in a planned maintenance window if an end-to-end rollback exercise is required.
