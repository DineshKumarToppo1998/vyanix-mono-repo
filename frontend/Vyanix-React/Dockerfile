FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build-time environment variable for SSR
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
RUN echo "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}" > .env.local

RUN npm run build

EXPOSE 3000

CMD ["npm","start"]
