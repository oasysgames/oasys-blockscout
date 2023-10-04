FROM hexpm/elixir:1.14.5-erlang-25.3.2.4-ubuntu-jammy-20230126 AS builder

WORKDIR /app

RUN apt update && \
    DEBIAN_FRONTEND=noninteractive apt install -y \
    libgmp-dev automake autoconf libtool inotify-tools python3 \
    file libstdc++6 ca-certificates curl git make nodejs npm

ENV PORT=4000 \
    MIX_ENV="prod" \
    SECRET_KEY_BASE="RMgI4C1HSkxsEjdhtGMfwAHfyT6CKWXOgzCboJflfSm4jeAlic52io05KB6mqzc5" \
    ERL_FLAGS="+JPperf true"

ARG CACHE_EXCHANGE_RATES_PERIOD
ARG DISABLE_READ_API
ARG API_PATH
ARG NETWORK_PATH
ARG DISABLE_WEBAPP
ARG DISABLE_WRITE_API
ARG CACHE_ENABLE_TOTAL_GAS_USAGE_COUNTER
ARG WOBSERVER_ENABLED
ARG ADMIN_PANEL_ENABLED
ARG CACHE_ADDRESS_WITH_BALANCES_UPDATE_INTERVAL
ARG SOCKET_ROOT
ARG COIN
ARG API_V1_READ_METHODS_DISABLED
ARG API_V1_WRITE_METHODS_DISABLED
ARG CACHE_TOTAL_GAS_USAGE_COUNTER_ENABLED
ARG CACHE_ADDRESS_WITHBALANCES_UPDATE_INTERVAL
ARG SESSION_COOKIE_DOMAIN
ARG MIXPANEL_TOKEN
ARG MIXPANEL_URL
ARG AMPLITUDE_API_KEY
ARG AMPLITUDE_URL

# Cache elixir deps
ADD mix.exs mix.lock ./
ADD apps/block_scout_web/mix.exs ./apps/block_scout_web/
ADD apps/explorer/mix.exs ./apps/explorer/
ADD apps/ethereum_jsonrpc/mix.exs ./apps/ethereum_jsonrpc/
ADD apps/indexer/mix.exs ./apps/indexer/

ENV MIX_HOME=/opt/mix
RUN mix local.hex --force
RUN mix do deps.get, local.rebar --force, deps.compile

ADD apps ./apps
ADD config ./config
ADD rel ./rel
ADD *.exs ./

RUN if [ "$COIN" != "" ]; then \
        sed -i s/"POA"/"${COIN}"/g apps/block_scout_web/priv/gettext/en/LC_MESSAGES/default.po; \
        sed -i "/msgid \"Ether\"/{n;s/msgstr \"\"/msgstr \"${COIN}\"/g}" apps/block_scout_web/priv/gettext/default.pot; \
        sed -i "/msgid \"Ether\"/{n;s/msgstr \"\"/msgstr \"${COIN}\"/g}" apps/block_scout_web/priv/gettext/en/LC_MESSAGES/default.po; \
        sed -i "/msgid \"ETH\"/{n;s/msgstr \"\"/msgstr \"${COIN}\"/g}" apps/block_scout_web/priv/gettext/default.pot; \
        sed -i "/msgid \"ETH\"/{n;s/msgstr \"\"/msgstr \"${COIN}\"/g}" apps/block_scout_web/priv/gettext/en/LC_MESSAGES/default.po; \
    fi


# Run forderground build and phoenix digest
RUN mix compile
RUN npm install -g n && n 18.18.0 && apt purge -y nodejs npm

# Add blockscout npm deps
RUN cd apps/block_scout_web/assets/ && \
    npm install && \
    npm run deploy && \
    cd /app/apps/explorer/ && \
    npm install

RUN mix phx.digest

RUN mkdir -p /opt/release \
  && mix release blockscout \
  && mv _build/${MIX_ENV}/rel/blockscout /opt/release

##############################################################
FROM hexpm/elixir:1.14.5-erlang-25.3.2.4-ubuntu-jammy-20230126

ARG RELEASE_VERSION
ENV RELEASE_VERSION=${RELEASE_VERSION}
ARG BLOCKSCOUT_VERSION
ENV BLOCKSCOUT_VERSION=${BLOCKSCOUT_VERSION}

RUN apt update && \
    DEBIAN_FRONTEND=noninteractive apt install -y jq libgmp-dev nodejs && \
    apt clean autoclean && \
    apt autoremove -y && \
    rm -rf /var/lib/{apt,dpkg,cache,log}

WORKDIR /app

COPY --from=builder /opt/release/blockscout .
COPY --from=builder /app/apps/explorer/node_modules ./node_modules
COPY --from=builder /app/config/config_helper.exs ./config/config_helper.exs
COPY --from=builder /app/config/config_helper.exs /app/releases/${RELEASE_VERSION}/config_helper.exs

COPY docker/run.sh /run.sh
CMD ["/bin/sh", "/run.sh"]
