# ai-language-translate

[Online](https://nextjs-langchain-supabase-translate.vercel.app/)

This repo is an experimental project intended to test out various AI APIs and their ability to handle tranlsation between English and Samoan (and potentially other Pacific Islander) languages. Obviously, more widespread languages could be added, but online translation for those is a broadly-solved problem--whereas for Samoan and other indigenous Pacific Island languages it is less so.

More importantly, this project is experimenting with building a stable, repeatable testbed framework that can quickly prototype AI-based solutions.

The project's API is using code from the [nextjs-langchain-example](https://github.com/jaredpalmer/nextjs-langchain-example) by [Jared Palmer](https://github.com/jaredpalmer). The primary technical uses to the approach are:

1. Ability to deploy to Vercel Edge functions
2. Ability to handle returns that are either streaming (including capability in the UI to handle this) or simply Async calls.

The UI is based on the [Nextly Landing Page Template](https://github.com/surjithctly/nextly-template.git), which we are beginning to convert to Typescript for the project. 

## How to use

To use, simply clone and install, and then hit `dev` with your favorite package manager.

## About

Peter Dresslar leads Pacific Broadband and Digital Equity, a non-profit based on O‘ahu. He also works with American Samoa Community College to manage a technology modernization project there.
