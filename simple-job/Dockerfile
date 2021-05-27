# syntax=docker/dockerfile:1
FROM node
WORKDIR /
COPY . .
RUN yarn install --production
EXPOSE 8081
CMD ["yarn", "start"]
