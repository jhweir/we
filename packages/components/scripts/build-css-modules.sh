#!/bin/bash

# Build the global index.scss to index.css
npx sass src/styles/index.scss dist/styles/index.css --no-source-map --style=compressed
echo "Built src/styles/index.scss -> dist/styles/index.css"