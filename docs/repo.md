### For complete refresh of node modules and system links

`find . -name "node_modules" -type d -prune -exec rm -rf '{}' +`

`pnpm store prune`

Delete pnpm.lock file

Run `pnpm install` from the root dir
