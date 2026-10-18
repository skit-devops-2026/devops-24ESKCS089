# Production multi-stage Dockerfile for Rescue Network (devops-24ESKCS089)

# Stage 1: Build client frontend assets
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy client package manifests and install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build production bundle
COPY client/ ./
RUN npm run build

# Stage 2: Production server runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Copy server package manifests and install production-only dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Copy server source code
COPY server/ ./server/

# Copy built frontend assets into runtime container
COPY --from=client-builder /app/client/dist ./client/dist

# Run as non-root user for security
USER node

# Expose default application port
EXPOSE 5000

# Start server
CMD ["node", "server/server.js"]
