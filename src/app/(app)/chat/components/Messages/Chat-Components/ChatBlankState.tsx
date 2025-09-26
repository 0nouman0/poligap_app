"use client";

import React from "react";
import { motion } from "framer-motion";

import Icon from "./../../../ui/icon";

const ChatBlankState = ({ isGlobalAgent }: { isGlobalAgent: boolean }) => {
  return (
    <section className='flex flex-col items-center text-center' aria-label='Welcome message'>
      <div className='flex max-w-3xl flex-col gap-y-8'>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          <div className='flex flex-col items-center justify-center gap-1 gap-x-2 font-medium whitespace-nowrap'>
            <div className='h-[72px] w-[72px] overflow-hidden flex items-center justify-center'>
              <img
                src={'/assets/poligap-high-resolution-logo.png'}
                alt='Poligap AI'
                width={72}
                height={72}
                className='object-contain'
                style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}
              />
            </div>
            <span className='mt-1 flex items-center text-sm font-[500] text-[var(--text-color)]'>
              {" "}
              {isGlobalAgent ? "Ask, write, or search for anything" : "Start Chat with AI Agent"}{" "}
            </span>
            <span className='flex items-center text-xs text-[var(--secondary-text-color)]'>
              {isGlobalAgent
                ? "Start Chat with Poligap AI. Ask any specific question or search for anything."
                : "Ask any question or browse prompts to generate ques."}
            </span>
          </div>
        </motion.h1>
      </div>
    </section>
  );
};

export default ChatBlankState;
