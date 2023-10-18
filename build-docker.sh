#!/bin/bash

set e+x

export TEAM_UUID=$(uuidgen) && docker-compose down -v && docker-compose up --build
