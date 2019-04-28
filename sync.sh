#!/usr/bin/env bash

rm -fr backend/static/*
rm -fr backend/templates/*

mv frontend/dist/*.html backend/templates/
mv frontend/dist/* backend/static/
