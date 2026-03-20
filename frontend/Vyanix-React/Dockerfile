FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build-time environment variable for SSR
# Default to internal Docker URL for nginx proxy
ARG NEXT_PUBLIC_API_BASE_URL=http://backend:8080/api
RUN echo "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}" > .env.local

RUN npm run build

RUN apk add --no-cache wget

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3000 || exit 1

CMD ["npm","start"]
