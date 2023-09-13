import Image from "next/image";
import React from "react";
import Container from "./container";

export default function Footer() {
  return (
    <Container>
      <div className="flex flex-wrap mx-0 md:mx-0 items-start justify-center md:justify-between">
        <a href="https://pacificbroadband.org" className="flex min-w-[300px] items-center space-x-2 text-xl md:text-2xl font-medium text-indigo-500 dark:text-gray-100">
          <Image
            src="/img/PBDE.png"
            alt="PBDE"
            width="32"
            height="32"
            className="w-8"
          />
          <span>Pacific Broadband and Digital Equity</span>
        </a>

        <div className="min-w-[300px] text-center md:text-end">
          <div className="flex flex-wrap w-full justify-center md:justify-end">
            <a href="https://www.pacificbroadband.org/2023/09/01/can-ai-grasp-pacific-languages-inside-our-push-for-an-ai-samoan-translator/" className="w-auto mt-2 ml-3 text-gray-500 dark:text-gray-400">
              Blog Post 1
            </a>
          </div>
          <div className="flex flex-wrap w-full justify-center md:justify-end">
            <a href="https://www.pacificbroadband.org/2023/09/12/ai-translator-part-2-building-and-testing-the-app/" className="w-auto mt-2 ml-3 text-gray-500 dark:text-gray-400">
              Blog Post 2
            </a>
          </div>
          <div className="flex flex-wrap w-full justify-center md:justify-end">
            <a href="https://github.com/peterdresslar/ai-language-translate" className="flex w-auto mt-2 ml-3 text-gray-500 dark:text-gray-400 items-center">
              <svg height="16" width="16" viewBox="0 0 16 16" className="mr-2">
                <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              Source Code
            </a>
          </div>
        </div>

      </div> {/* end of the main footernav */}

      <div className="flex my-2 font-bold justify-center text-gray-600 dark:text-gray-400">
        <a
          href="https://www.pacificbroadband.org/disclaimer/"
          target="_blank"
          rel="noopener">
          Disclaimer
        </a>{" "}
      </div>

      <div className="flex mb-10 text-sm justify-center text-gray-600 dark:text-gray-400">
        Copyright © {new Date().getFullYear()}. Peter Dresslar,&nbsp;
        <a
          href="https://pacificbroadband.org/"
          target="_blank"
          rel="noopener">
          Pacific Broadband and Digital Equity.
        </a>{" "}
      </div>
    </Container>
  );
}
