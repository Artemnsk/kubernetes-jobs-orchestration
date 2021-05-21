# syntax=docker/dockerfile:1
FROM node
WORKDIR /
COPY . .
RUN yarn install --production
CMD ["yarn", "start"]
