FROM node:10-alpine as builder

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --only=production
RUN cp -R node_modules prod_node_modules
RUN npm install

# Bundle app source
COPY . /usr/src/app

# Build app
RUN npm run build

# Begin release (same as used by pipeline, i.e. CI.Dockerfile)
FROM node:alpine as release

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy files to release container
COPY --from=builder /usr/src/app/package.json /usr/src/app/
# Copy builded files to release container
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
# Copy prodution dependencies only
COPY --from=builder /usr/src/app/prod_node_modules /usr/src/app/node_modules

CMD [ "node", "dist/server.js" ]