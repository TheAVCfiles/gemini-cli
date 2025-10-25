# IntuitionLabs Mythos Cloud SaaS starter kit

This mini-kit packages the assets IntuitionLabs uses to pilot AI-native SaaS offers.
Everything is defined in `config.yaml` so landing pages, pricing tables, and sales
collateral stay in sync.

## Contents

- **Configuration:** `config.yaml` holds the product narrative, pricing tiers,
  go-to-market audiences, and automation instructions.
- **Automation script:** `package_and_publish.py` reads the configuration and renders
  the landing page plus three sales offers into the `dist/` folder.
- **Landing shell:** `saas_auto_landing.html` is a responsive, dark-mode friendly
  template filled with data from the configuration file.
- **GitHub Actions:** `actions_auto_sell.yml` shows how to regenerate the kit on
  every push and publish the resulting artifact bundle.
- **Offer templates:** Markdown blueprints in `templates/` align messaging across
  adaptive ethics, product operations, and culture-forward marketing motions.

## Quick start

```bash
cd docs/intuitionlabs/saas_template
python package_and_publish.py --output dist
```

The command renders `dist/index.html`, three offer one-pagers under
`dist/offers/`, and a `package_manifest.json` summarising the build.

Feel free to duplicate the directory and adjust the configuration for your own
SaaS experiments.
