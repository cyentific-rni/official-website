# Publish cyentific.eu with GitHub Pages

Source: [cyentific-rni/official-website](https://github.com/cyentific-rni/official-website)  
Remote: `git@github.com:cyentific-rni/official-website.git`  
Production branch: `main`  
Public address: `https://cyentific.eu/`

## One-time repository setup

1. Open [repository Settings → Pages](https://github.com/cyentific-rni/official-website/settings/pages). Set **Build and deployment → Source** to **GitHub Actions**.
2. Set **Custom domain** to `cyentific.eu` and save it. For Actions deployments, GitHub uses this repository setting; the `public/CNAME` file alone does not configure the domain.
3. When the certificate is ready, select **Enforce HTTPS**. GitHub may take up to 24 hours to make this available.

The deployment workflow has `pages: read` during configuration, and `pages: write` plus `id-token: write` only in the deployment job. It uses the `github-pages` environment and can deploy only from `main`.

## DNS

The DNS check on 8 November 2026 already matched GitHub's documented records:

| Name | Type | Value |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `@` | AAAA | `2606:50c0:8000::153` |
| `@` | AAAA | `2606:50c0:8001::153` |
| `@` | AAAA | `2606:50c0:8002::153` |
| `@` | AAAA | `2606:50c0:8003::153` |
| `www` | CNAME | `cyentific-rni.github.io.` |

No DNS change is needed while these values remain in place. Preserve the domain's email records. GitHub's custom-domain setting and certificate still need to be configured for this repository.

## Publish a release

1. Confirm the **Validate website** workflow is passing for the intended `main` commit.
2. Open [Actions → Publish static website](https://github.com/cyentific-rni/official-website/actions/workflows/pages.yml), choose **Run workflow**, and select `main`.
3. Check the build and deployment jobs. Visit `https://cyentific.eu/`, the product pages, contact page and `https://cyentific.eu/.well-known/security.txt`.
4. Check that HTTPS works and that `www.cyentific.eu` reaches the primary address. If GitHub is still provisioning the certificate, wait for the Pages settings to report it ready.

Pushing source runs validation. Publication is a separate manual workflow. To roll back, revert the relevant source change on `main`, let validation pass and run the publication workflow again.

## Contact and build configuration

The production origin and root base path are fixed in the workflow. No repository variables are required for email drafts. Enquiries are sent only when the visitor sends the prepared email; confirm receipt at `contact@cyentific.eu` as part of launch.

If a direct-submission provider is agreed later, add all three repository Actions variables: `PUBLIC_CONTACT_ENDPOINT`, `CONTACT_PROVIDER_NAME` and `CONTACT_PROVIDER_PRIVACY_URL`. The service must accept the documented JSON payload and allow the website origin. Build validation checks provider details, and the privacy notice uses the same configuration. Never put credentials in these public values.

Dependencies, generated output, local environment files, internal interview notes and prototype screenshots are excluded from the release source. Only the generated `dist/` directory is uploaded to Pages.

Sources: [GitHub custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains and DNS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
