FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --chown=node:node docker-server.js index.html app.js style.css tickets.js xlsx.full.min.js XLSX-LICENSE.txt ./
USER node
EXPOSE 3000
CMD ["node", "docker-server.js"]

