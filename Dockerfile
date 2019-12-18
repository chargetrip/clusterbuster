FROM node:10.15.1

ENV APP_ROOT /usr/src/app
WORKDIR $APP_ROOT

RUN mkdir -p $APP_ROOT

COPY package.json yarn.lock rollup.config.js babel.config.js $APP_ROOT/
COPY . $APP_ROOT/

RUN cd $APP_ROOT && yarn && yarn build

EXPOSE 3005

CMD [ "yarn", "start" ]