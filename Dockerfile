FROM node:20-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
# Docker auto-sets HOSTNAME to the container ID; Next standalone would bind
# to that IP only and refuse loopback, breaking the healthcheck.
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
