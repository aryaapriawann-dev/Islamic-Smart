FROM node:20-bookworm-slim
WORKDIR /app
COPY dashboard/package.json dashboard/package-lock.json ./dashboard/
WORKDIR /app/dashboard
RUN npm install --production=false
COPY dashboard /app/dashboard
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
