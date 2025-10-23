#!/bin/sh
set -euxo pipefail

# Railway ejecuta este script mediante Railpack. Preparar y arrancar el backend.
cd backend
npm install
npm run build
npm run start