# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# Create a non-root user and switch to it
RUN useradd -m appuser
USER appuser

EXPOSE 3000

CMD ["node", "dist/server/index.cjs"]